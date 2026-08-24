import { assertAdminApi } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const { user, admin, response } = await assertAdminApi();
  if (response) return response;

  const body = await request.json().catch(() => ({}));
  const { action, entityType, entityId, metadata } = body;

  if (!action || !entityType) {
    return Response.json(
      { error: "action and entityType are required" },
      { status: 400 },
    );
  }

  const { error } = await admin!.from("admin_audit_logs").insert({
    admin_id: user!.id,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata: metadata ?? {},
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
