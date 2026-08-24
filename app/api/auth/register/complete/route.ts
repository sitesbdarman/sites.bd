import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTicket } from "@/lib/auth/ticket";
import { registerCompleteSchema } from "@/lib/validation/auth";

const TICKET_ERROR_MESSAGES: Record<string, string> = {
  malformed: "Your verification session is invalid. Please start over.",
  bad_signature: "Your verification session is invalid. Please start over.",
  expired: "Your verification session has expired. Please verify your email again.",
  wrong_purpose: "Your verification session is invalid. Please start over.",
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

  const parsed = registerCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const verification = verifyTicket(parsed.data.ticket, "registration");
  if (!verification.ok) {
    return NextResponse.json(
      { error: TICKET_ERROR_MESSAGES[verification.reason] },
      { status: 400 },
    );
  }

  const email = verification.email;
  const admin = createAdminClient();

  try {
    // The OTP step already proved control of the inbox, so the account can
    // be created pre-confirmed — no separate Supabase confirmation email.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true,
    });

    if (createError) {
      const normalized = createError.message.toLowerCase();
      if (normalized.includes("already been registered") || normalized.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Try logging in instead." },
          { status: 409 },
        );
      }
      if (normalized.includes("password")) {
        return NextResponse.json(
          { error: "That password doesn't meet the requirements. Use a longer, less predictable password." },
          { status: 400 },
        );
      }
      throw createError;
    }

    const userId = created.user?.id;
    if (!userId) {
      throw new Error("User was created but no id was returned.");
    }

    // profile_status defaults to 'pending' and customer_id is auto-assigned
    // by the database trigger (see database/0001_foundation.sql).
    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      email,
    });

    if (profileError) {
      // Roll back the auth user so we don't leave an orphaned account with
      // no profile row behind.
      await admin.auth.admin.deleteUser(userId).catch(() => {});
      throw profileError;
    }

    return NextResponse.json({ ok: true, email });
  } catch (error) {
    console.error("register/complete failed:", error);
    return NextResponse.json(
      { error: "Something went wrong creating your account. Please try again." },
      { status: 500 },
    );
  }
}
