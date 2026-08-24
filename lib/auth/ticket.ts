/**
 * Short-lived, server-signed "verification ticket".
 *
 * SERVER-ONLY. After a user proves control of their inbox via OTP, we need
 * a way to let the *next* request (password creation, or new password on
 * reset) know "this email was just OTP-verified for this purpose" without
 * re-sending the OTP or trusting the client's say-so. Storing this as a
 * signed, expiring, opaque token (rather than a server-side session/table)
 * keeps it stateless and avoids a second database round trip per step.
 *
 * The ticket is never persisted anywhere and never leaves the server
 * signing key, so it cannot be forged. It is NOT a substitute for a
 * Supabase session — it only proves "OTP ownership of this email, for this
 * purpose, a few minutes ago".
 */
import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { OtpPurpose } from "@/lib/otp/otp";

const TICKET_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getSecret(): string {
  const secret = process.env.AUTH_TICKET_SECRET;
  if (!secret) {
    throw new Error(
      "Missing AUTH_TICKET_SECRET. Set a long random value in .env.local (see .env.local.example).",
    );
  }
  return secret;
}

interface TicketPayload {
  email: string;
  purpose: OtpPurpose;
  exp: number; // epoch ms
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Issues a signed ticket for the given email + purpose, valid for 10 minutes. */
export function issueTicket(email: string, purpose: OtpPurpose): string {
  const payload: TicketPayload = {
    email: email.trim().toLowerCase(),
    purpose,
    exp: Date.now() + TICKET_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export type TicketVerification =
  | { ok: true; email: string }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "wrong_purpose" };

/** Verifies a ticket was issued by us, is unexpired, and matches the expected purpose. */
export function verifyTicket(
  ticket: string,
  expectedPurpose: OtpPurpose,
): TicketVerification {
  const parts = ticket.split(".");
  if (parts.length !== 2) {
    return { ok: false, reason: "malformed" };
  }
  const [encodedPayload, signature] = parts;

  const expectedSignature = sign(encodedPayload);
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expectedSignature, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: TicketPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (payload.purpose !== expectedPurpose) {
    return { ok: false, reason: "wrong_purpose" };
  }

  if (Date.now() > payload.exp) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, email: payload.email };
}
