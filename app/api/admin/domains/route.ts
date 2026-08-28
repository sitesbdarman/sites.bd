import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security/csrf";
import { assertAdminApi } from "@/lib/admin/auth";

const VALID_STATUSES = ["active", "pending", "expired", "suspended"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { user, admin, response } = await assertAdminApi("domains:write");
  if (response) return response;
  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const db = admin!;
  const { data: domain } = await db.from("domains").select("id,status,domain_name,owner_id").eq("id", id).maybeSingle();
  if (!domain) return NextResponse.json({ success: false, error: "Domain not found." }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.expiresAt !== undefined) update.expires_at = body.expiresAt ? new Date(body.expiresAt).toISOString() : null;
  if (body.autoRenew !== undefined) update.auto_renew = Boolean(body.autoRenew);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: false, error: "Nothing to update." }, { status: 400 });
  }

  const { data: updated, error } = await db.from("domains").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

  if (typeof update.status === "string" && update.status !== domain.status) {
    await db.from("domain_status_logs").insert({
      domain_id: id,
      changed_by: user!.id,
      old_status: domain.status,
      new_status: update.status,
      reason: typeof body.reason === "string" ? body.reason : "Updated by admin",
    });
  }

  await db.from("admin_audit_logs").insert({
    admin_id: user!.id,
    action: "domain_update",
    entity_type: "domain",
    entity_id: id,
    metadata: { domainName: domain.domain_name, changes: update },
  });

  return NextResponse.json({ success: true, domain: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { user, admin, response } = await assertAdminApi("domains:write");
  if (response) return response;
  const { id } = await params;

  const db = admin!;
  const { data: domain } = await db.from("domains").select("id,domain_name,owner_id").eq("id", id).maybeSingle();
  if (!domain) return NextResponse.json({ success: false, error: "Domain not found." }, { status: 404 });

  const { error } = await db.from("domains").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

  await db.from("admin_audit_logs").insert({
    admin_id: user!.id,
    action: "domain_remove",
    entity_type: "domain",
    entity_id: id,
    metadata: { domainName: domain.domain_name, ownerId: domain.owner_id },
  });

  return NextResponse.json({ success: true });
}
