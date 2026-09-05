import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security/csrf";
import { assertAdminApi } from "@/lib/admin/auth";

/**
 * Manual override for a customer's identity verification status.
 *
 * This is separate from /api/admin/verifications/review, which only works
 * on a submitted document (a row in identity_verifications). Admins often
 * need to verify a customer who never uploaded anything — e.g. verified
 * over phone/in person, or a trusted long-time customer — so this endpoint
 * lets an admin set profiles.identity_status directly for any customer.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { user, admin, response } = await assertAdminApi("customers:write");
  if (response) return response;
  if (!user || !admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  let body: { status?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const status = body.status?.trim().toLowerCase();
  const reason = body.reason?.trim() || null;
  if (!status || !["verified", "unverified", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid verification status." }, { status: 400 });
  }
  if (status === "rejected" && !reason) {
    return NextResponse.json({ error: "Please provide a reason for rejecting this account." }, { status: 400 });
  }

  const { data: profile, error: findError } = await admin
    .from("profiles")
    .select("id, identity_status")
    .eq("id", id)
    .maybeSingle();
  if (findError || !profile) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      identity_status: status,
      identity_verified_at: status === "verified" ? now : null,
      identity_rejection_reason: status === "rejected" ? reason : null,
    })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: "Couldn't update the customer's verification status." }, { status: 500 });

  await admin.from("admin_audit_logs").insert({
    admin_id: user.id,
    action: "identity_verification_manual_override",
    entity_type: "profiles",
    entity_id: id,
    metadata: { from: profile.identity_status, to: status, reason },
  });

  return NextResponse.json({ success: true, status });
}
