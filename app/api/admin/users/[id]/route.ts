import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security/csrf";
import { assertAdminApi } from "@/lib/admin/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { user, admin, response } = await assertAdminApi();
  if (response) return response;
  const { id } = await params;

  if (id === user!.id) {
    return NextResponse.json({ success: false, error: "You cannot change your own account status." }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const accountStatus = body.accountStatus;
  if (!["active", "suspended"].includes(accountStatus)) {
    return NextResponse.json({ success: false, error: "Invalid account status." }, { status: 400 });
  }

  const db = admin!;
  const { data: target } = await db.from("profiles").select("id,email,role,account_status").eq("id", id).maybeSingle();
  if (!target) return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
  if (target.role === "admin") {
    return NextResponse.json({ success: false, error: "Admin accounts cannot be suspended here." }, { status: 400 });
  }

  const { data: updated, error } = await db
    .from("profiles")
    .update({ account_status: accountStatus })
    .eq("id", id)
    .select("id,customer_id,full_name,email,mobile_number,role,profile_status,account_status,created_at")
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

  await db.from("admin_audit_logs").insert({
    admin_id: user!.id,
    action: accountStatus === "suspended" ? "user_ban" : "user_unban",
    entity_type: "user",
    entity_id: id,
    metadata: { email: target.email, previousStatus: target.account_status },
  });

  return NextResponse.json({ success: true, user: updated });
}
