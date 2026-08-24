/**
 * Email OTP core logic — generation, hashing, issuing, and verification.
 *
 * SERVER-ONLY. Talks to `public.email_otps` exclusively through the
 * service-role client, since that table has no anon/authenticated RLS
 * policies at all (see database/0003_auth_otp.sql).
 *
 * Security properties implemented here (see NEXT_STEP spec):
 * - OTP is 6 digits, expires after 5 minutes, single-use.
 * - OTP is never stored in plain text — only a salted scrypt hash.
 * - Requesting a new OTP invalidates any previous unused OTP for the same
 *   email + purpose.
 * - Verification is attempt-limited per OTP row.
 * - Issuing a new OTP is rate-limited per email + purpose.
 */
import "server-only";
import { randomInt, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type OtpPurpose = "registration" | "password_reset";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;

// Rate limiting for *issuing* OTPs (independent of per-OTP verify attempts).
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 60 * 60 * 1000; // 5 sends per hour per email+purpose

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateOtpCode(): string {
  // randomInt is cryptographically secure (backed by the OS CSPRNG) and
  // avoids the modulo bias of Math.random()-based approaches.
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(randomInt(min, max + 1));
}

function hashOtp(code: string, salt: string): string {
  return scryptSync(code, salt, 64).toString("hex");
}

/** Format persisted as `${salt}:${hash}` inside the single otp_hash column. */
function packHash(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = hashOtp(code, salt);
  return `${salt}:${hash}`;
}

function verifyPackedHash(code: string, packed: string): boolean {
  const [salt, hash] = packed.split(":");
  if (!salt || !hash) return false;
  const candidate = hashOtp(code, salt);
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type IssueOtpResult =
  | { ok: true; code: string; expiresAt: Date }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number };

/**
 * Issues a fresh OTP for the given email + purpose:
 * - invalidates any previous unused OTP for that email + purpose
 * - enforces a short cooldown and an hourly cap on how many can be issued
 * - stores only a hash, returns the plain code so the caller can email it
 */
export async function issueOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<IssueOtpResult> {
  const normalizedEmail = normalizeEmail(email);
  const admin = createAdminClient();
  const now = Date.now();

  const { data: recent, error: recentError } = await admin
    .from("email_otps")
    .select("created_at")
    .eq("email", normalizedEmail)
    .eq("purpose", purpose)
    .gte("created_at", new Date(now - SEND_WINDOW_MS).toISOString())
    .order("created_at", { ascending: false });

  if (recentError) {
    throw new Error(`Failed to check OTP rate limit: ${recentError.message}`);
  }

  if (recent && recent.length > 0) {
    const lastSentAt = new Date(recent[0].created_at as string).getTime();
    const sinceLast = now - lastSentAt;
    if (sinceLast < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: "rate_limited",
        retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000),
      };
    }
  }

  if (recent && recent.length >= MAX_SENDS_PER_WINDOW) {
    const oldestInWindow = new Date(
      recent[recent.length - 1].created_at as string,
    ).getTime();
    const retryAfterSeconds = Math.ceil(
      (oldestInWindow + SEND_WINDOW_MS - now) / 1000,
    );
    return { ok: false, reason: "rate_limited", retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
  }

  // Invalidate any previous unused OTP for this email+purpose so only the
  // most recently issued code is ever valid.
  const { error: invalidateError } = await admin
    .from("email_otps")
    .update({ used_at: new Date().toISOString() })
    .eq("email", normalizedEmail)
    .eq("purpose", purpose)
    .is("used_at", null);

  if (invalidateError) {
    throw new Error(`Failed to invalidate previous OTP: ${invalidateError.message}`);
  }

  const code = generateOtpCode();
  const expiresAt = new Date(now + OTP_TTL_MS);

  const { error: insertError } = await admin.from("email_otps").insert({
    email: normalizedEmail,
    purpose,
    otp_hash: packHash(code),
    expires_at: expiresAt.toISOString(),
    attempts: 0,
  });

  if (insertError) {
    throw new Error(`Failed to store OTP: ${insertError.message}`);
  }

  return { ok: true, code, expiresAt };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "too_many_attempts" | "invalid_code" };

/**
 * Verifies a submitted OTP for the given email + purpose against the most
 * recently issued, still-unused OTP row. Marks the row used on success so
 * it cannot be replayed.
 */
export async function verifyOtp(
  email: string,
  purpose: OtpPurpose,
  submittedCode: string,
): Promise<VerifyOtpResult> {
  const normalizedEmail = normalizeEmail(email);
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from("email_otps")
    .select("id, otp_hash, expires_at, attempts, used_at")
    .eq("email", normalizedEmail)
    .eq("purpose", purpose)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to look up OTP: ${error.message}`);
  }

  if (!row) {
    return { ok: false, reason: "not_found" };
  }

  if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const matches = verifyPackedHash(submittedCode, row.otp_hash as string);

  if (!matches) {
    const nextAttempts = (row.attempts as number) + 1;
    await admin
      .from("email_otps")
      .update({ attempts: nextAttempts })
      .eq("id", row.id as string);

    return {
      ok: false,
      reason: nextAttempts >= MAX_VERIFY_ATTEMPTS ? "too_many_attempts" : "invalid_code",
    };
  }

  await admin
    .from("email_otps")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id as string);

  return { ok: true };
}

export const OTP_TTL_MINUTES = OTP_TTL_MS / (60 * 1000);
