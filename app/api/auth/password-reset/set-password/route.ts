import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTicket } from "@/lib/auth/ticket";
import { passwordResetCompleteSchema } from "@/lib/validation/auth";

const TICKET_ERROR_MESSAGES: Record<string, string> = {
  malformed: "Your reset session is invalid. Please start over.",
  bad_signature: "Your reset session is invalid. Please start over.",
  expired: "Your reset session has expired. Please verify your email again.",
  wrong_purpose: "Your reset session is invalid. Please start over.",
};

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = passwordResetCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const verification = verifyTicket(parsed.data.ticket, "password_reset");
  if (!verification.ok) {
    return NextResponse.json(
      { error: TICKET_ERROR_MESSAGES[verification.reason] },
      { status: 400 },
    );
  }

  const email = verification.email;
  const admin = createAdminClient();

  try {
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    // The OTP step only ever issues a code for emails that already have an
    // account (see send-otp), so a missing profile here means the account
    // was deleted between steps — treat it the same as an expired session
    // rather than confirming/denying account existence explicitly.
    if (!profile) {
      return NextResponse.json(
        { error: "Your reset session has expired. Please start over." },
        { status: 400 },
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(profile.id as string, {
      password: parsed.data.password,
    });

    if (updateError) {
      const normalized = updateError.message.toLowerCase();
      if (normalized.includes("password")) {
        return NextResponse.json(
          { error: "That password doesn't meet the requirements. Use a longer, less predictable password." },
          { status: 400 },
        );
      }
      throw updateError;
    }

    return NextResponse.json({ ok: true, email });
  } catch (error) {
    console.error("password-reset/set-password failed:", error);
    return NextResponse.json(
      { error: "Something went wrong resetting your password. Please try again." },
      { status: 500 },
    );
  }
}
