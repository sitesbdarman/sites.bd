import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security/csrf";
import { assertAdminApi } from "@/lib/admin/auth";

const VALID_STATUSES = ["active", "pending", "expired", "suspended"] as const;

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { user, admin, response } = await assertAdminApi();
  if (response) return response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const ownerId = String(body.ownerId || "").trim();
  const domainName = String(body.domainName || "").trim().toLowerCase();
  const status = VALID_STATUSES.includes(body.status) ? body.status : "active";
  const autoRenew = Boolean(body.autoRenew);
  const expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : null;

  if (!ownerId) return NextResponse.json({ success: false, error: "Select a customer." }, { status: 400 });
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domainName)) {
    return NextResponse.json({ success: false, error: "Enter a valid domain name (e.g. example.com)." }, { status: 400 });
  }

  const db = admin!;

  const { data: owner } = await db.from("profiles").select("id,email,customer_id").eq("id", ownerId).maybeSingle();
  if (!owner) return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });

  const { data: existing } = await db.from("domains").select("id").eq("domain_name", domainName).maybeSingle();
  if (existing) return NextResponse.json({ success: false, error: "That domain already exists in the system." }, { status: 409 });

  const { data: domain, error } = await db
    .from("domains")
    .insert({
      owner_id: ownerId,
      domain_name: domainName,
      status,
      auto_renew: autoRenew,
      registered_at: new Date().toISOString(),
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

  await db.from("admin_audit_logs").insert({
    admin_id: user!.id,
    action: "domain_assign",
    entity_type: "domain",
    entity_id: domain.id,
    metadata: { domainName, ownerId, ownerEmail: owner.email, status },
  });

  return NextResponse.json({ success: true, domain });
}
