import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security/csrf";
import { assertAdminApi } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { user, admin, response } = await assertAdminApi("customers:write");
  if (response) return response;
  if (!user || !admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: { id?: string; action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = body.id?.trim();
  const action = body.action?.trim().toLowerCase();
  const reason = body.reason?.trim() || null;
  if (!id || !["approve", "reject"].includes(action ?? "")) {
    return NextResponse.json({ error: "Invalid verification action." }, { status: 400 });
  }
  if (action === "reject" && !reason) {
    return NextResponse.json({ error: "Please provide a reason for rejecting this document." }, { status: 400 });
  }

  const { data: submission, error: findError } = await admin
    .from("identity_verifications")
    .select("id, user_id, status")
    .eq("id", id)
    .single();
  if (findError || !submission) return NextResponse.json({ error: "Verification request not found." }, { status: 404 });
  if (submission.status !== "pending") {
    return NextResponse.json({ error: `Already ${submission.status}.` }, { status: 400 });
  }

  const now = new Date().toISOString();
  const nextStatus = action === "approve" ? "approved" : "rejected";

  const { error: updateError } = await admin
    .from("identity_verifications")
    .update({ status: nextStatus, reviewed_by: user.id, reviewed_at: now, rejection_reason: action === "reject" ? reason : null })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: "Couldn't update the verification request." }, { status: 500 });

  const { error: profileError } = await admin
    .from("profiles")
    .update(
      action === "approve"
        ? { identity_status: "verified", identity_verified_at: now, identity_rejection_reason: null }
        : { identity_status: "rejected", identity_rejection_reason: reason },
    )
    .eq("id", submission.user_id);
  if (profileError) return NextResponse.json({ error: "Verification updated, but the account status failed to update." }, { status: 500 });

  await admin.from("admin_audit_logs").insert({
    admin_id: user.id,
    action: action === "approve" ? "identity_verification_approved" : "identity_verification_rejected",
    entity_type: "identity_verifications",
    entity_id: id,
    metadata: { user_id: submission.user_id, reason },
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
