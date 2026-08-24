import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileCompletionSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = profileCompletionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  // RLS ("profiles_update_own") already scopes this to the caller's own
  // row, and the immutable-fields trigger blocks role/customer_id/email
  // changes and re-setting mobile_number once it's non-null — this update
  // relies on both rather than re-implementing the same checks here.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      mobile_number: parsed.data.mobileNumber,
      address: { full_address: parsed.data.address },
      profile_status: "complete",
    })
    .eq("id", user.id);

  if (error) {
    const normalized = error.message.toLowerCase();
    if (normalized.includes("mobile_number cannot be changed")) {
      return NextResponse.json(
        { error: "Your mobile number is already set and cannot be changed here." },
        { status: 400 },
      );
    }
    console.error("profile/complete failed:", error);
    return NextResponse.json(
      { error: "Something went wrong saving your profile. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
