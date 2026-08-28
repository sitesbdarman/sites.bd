import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/security/csrf";
import { z } from "zod";
import { addressSchema, fullNameSchema, mobileNumberSchema } from "@/lib/validation/auth";

const profileUpdateSchema = z.object({
  fullName: fullNameSchema,
  mobileNumber: mobileNumberSchema,
  address: addressSchema,
  avatarUrl: z.string().url().nullable().optional(),
});


export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ authenticated: false, profile: null }, { status: 200 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, full_name, email, mobile_number")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    authenticated: true,
    profile: {
      avatar_url: profile?.avatar_url ?? null,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? user.email ?? null,
      mobile_number: profile?.mobile_number ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile data." }, { status: 400 });

  const { fullName, mobileNumber, address, avatarUrl } = parsed.data;
  if (avatarUrl) {
    try {
      const hostname = new URL(avatarUrl).hostname;
      const allowed = hostname.endsWith(".cloudinary.com") || hostname.endsWith(".supabase.co");
      if (!allowed) throw new Error("unsupported host");
    } catch {
      return NextResponse.json({ error: "Invalid profile image URL." }, { status: 400 });
    }
  }

  // Auth is verified above. Only editable profile fields are sent through the
  // service-role client, so role/customer_id/email cannot be overwritten by
  // this endpoint and old RLS policies cannot block harmless profile edits.
  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
    full_name: fullName,
    mobile_number: mobileNumber,
    address: { full_address: address },
  };
  if (avatarUrl !== undefined) updatePayload.avatar_url = avatarUrl;
  updatePayload.profile_status = "complete";

  const { error } = await admin.from("profiles").update(updatePayload).eq("id", user.id);

  if (error) {
    console.error("profile update failed:", error);
    return NextResponse.json({ error: "Couldn't save your profile. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, avatarUrl: avatarUrl ?? undefined });
}
