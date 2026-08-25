import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { clientKey, checkAuthRateLimit } from "@/lib/security/auth-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueOtp, OTP_TTL_MINUTES } from "@/lib/otp/otp";
import { sendEmail } from "@/lib/email/mailer";
import { buildOtpEmail } from "@/lib/email/templates/otp-email";
import { passwordResetSendOtpSchema } from "@/lib/validation/auth";

// Deliberately identical regardless of whether the account exists, or
// whether sending succeeded — never confirms/denies an email is registered.
const GENERIC_RESPONSE = {
  ok: true,
  message: "If an account exists with this email, a verification code has been sent.",
};

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const rate = checkAuthRateLimit(clientKey(request, "reset-send"), 10);
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Please wait and try again.", retryAfterSeconds: rate.retryAfterSeconds }, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = passwordResetSendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const admin = createAdminClient();
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    // Unknown email: return the generic success response without issuing
    // an OTP or sending an email, so nothing is revealed either way.
    if (!existingProfile) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const result = await issueOtp(email, "password_reset");

    // Rate limiting still applies, but we fold it into the same generic
    // shape rather than a distinguishable 429 — a legitimate owner who
    // just requested a code a moment ago doesn't need a new one anyway.
    if (!result.ok) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const { subject, html, text } = buildOtpEmail({
      code: result.code,
      purpose: "password_reset",
      expiresInMinutes: OTP_TTL_MINUTES,
    });

    await sendEmail({ to: email, subject, html, text });

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("password-reset/send-otp failed:", error);
    // Still generic on genuine failure — an attacker shouldn't be able to
    // distinguish "email doesn't exist" from "SMTP is down" either.
    return NextResponse.json(GENERIC_RESPONSE);
  }
}
