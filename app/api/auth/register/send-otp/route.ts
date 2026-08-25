import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { clientKey, checkAuthRateLimit } from "@/lib/security/auth-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueOtp, OTP_TTL_MINUTES } from "@/lib/otp/otp";
import { sendEmail } from "@/lib/email/mailer";
import { buildOtpEmail } from "@/lib/email/templates/otp-email";
import { registerSendOtpSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const rate = checkAuthRateLimit(clientKey(request, "register-send"), 20);
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Please wait and try again.", retryAfterSeconds: rate.retryAfterSeconds }, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registerSendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  // Reject only when we're certain the email already belongs to a fully
  // registered account, so we don't leak fine-grained existence info via
  // response timing/shape beyond what's necessary for a sane UX here
  // (unlike password reset, registration legitimately needs to tell the
  // user "you already have an account").
  const admin = createAdminClient();
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in instead." },
      { status: 409 },
    );
  }

  try {
    const result = await issueOtp(email, "registration");

    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait before requesting another code.",
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    const { subject, html, text } = buildOtpEmail({
      code: result.code,
      purpose: "registration",
      expiresInMinutes: OTP_TTL_MINUTES,
    });

    await sendEmail({ to: email, subject, html, text });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("register/send-otp failed:", error);
    return NextResponse.json(
      { error: "Could not send the verification code. Please try again." },
      { status: 500 },
    );
  }
}
