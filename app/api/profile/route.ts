import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/security/csrf";
import { z } from "zod";
import { addressSchema, fullNameSchema, mobileNumberSchema } from "@/lib/validation/auth";

const profileUpdateSchema = z.object({
  fullName: fullNameSchema,
  mobileNumber: mobileNumberSchema,
  address: addressSchema,
  avatarPath: z.string().nullable().optional(),
});

export async function PATCH(request: Request) {
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

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid profile data." },
      { status: 400 },
    );
  }

  const { fullName, mobileNumber, address, avatarPath } = parsed.data;

  if (avatarPath && avatarPath !== `${user.id}/avatar`) {
    return NextResponse.json({ error: "Invalid profile image path." }, { status: 400 });
  }

  const avatarUrl = avatarPath
    ? supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl
    : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      mobile_number: mobileNumber,
      address: { full_address: address },
      avatar_url: avatarUrl,
      profile_status: "complete",
    })
    .eq("id", user.id);

  if (error) {
    console.error("profile update failed:", error);
    return NextResponse.json(
      { error: "Couldn't save your profile. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, avatarUrl });
}
