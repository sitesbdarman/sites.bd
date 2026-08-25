import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { clientKey, checkAuthRateLimit } from "@/lib/security/auth-rate-limit";
import { verifyOtp } from "@/lib/otp/otp";
import { issueTicket } from "@/lib/auth/ticket";
import { registerVerifyOtpSchema } from "@/lib/validation/auth";

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "We couldn't find a pending code for this email. Please request a new one.",
  expired: "This code has expired. Please request a new one.",
  too_many_attempts: "Too many incorrect attempts. Please request a new code.",
  invalid_code: "That code is incorrect. Please try again.",
};

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const rate = checkAuthRateLimit(clientKey(request, "register-verify"), 20);
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Please wait and try again.", retryAfterSeconds: rate.retryAfterSeconds }, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registerVerifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const result = await verifyOtp(email, "registration", parsed.data.code);

    if (!result.ok) {
      return NextResponse.json(
        { error: ERROR_MESSAGES[result.reason], reason: result.reason },
        { status: 400 },
      );
    }

    const ticket = issueTicket(email, "registration");
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    console.error("register/verify-otp failed:", {
      email,
      error,
    });
    return NextResponse.json(
      { error: "Something went wrong verifying your code. Please try again." },
      { status: 500 },
    );
  }
}
