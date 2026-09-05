import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/auth";
const TABLES = { hosting: "hosting_plans", addons: "addons", domains: "domain_pricing" } as const;
type Kind = keyof typeof TABLES;
function kindOf(value: string | null): Kind | null { return value && value in TABLES ? value as Kind : null; }

export async function GET(req: Request) {
  const auth = await assertAdminApi("catalog:read"); if (auth.response) return auth.response;
  const kind = kindOf(new URL(req.url).searchParams.get("kind")); if (!kind) return NextResponse.json({ error: "Invalid catalog kind." }, { status: 400 });
  const { data, error } = await auth.admin!.from(TABLES[kind]).select("*").order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json({ items: data ?? [] });
}

export async function PUT(req: Request) {
  const auth = await assertAdminApi("catalog:write"); if (auth.response) return auth.response;
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const kind = kindOf(body?.kind); if (!kind || !Array.isArray(body?.items)) return NextResponse.json({ error: "Invalid catalog payload." }, { status: 400 });
  const db = auth.admin!;
  const existing = await db.from(TABLES[kind]).select("id");
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });
  const incomingIds = new Set<string>();
  const rows = body.items.map((item: any, index: number) => {
    const base: any = { ...(item.id ? { id: item.id } : {}), is_active: Boolean(item.is_active), sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index, updated_at: new Date().toISOString() };
    if (kind === "hosting") Object.assign(base, { name: String(item.name ?? "").trim(), type: ["premium","free","custom"].includes(item.type) ? item.type : "premium", price: Math.max(0, Number(item.price ?? 0)), billing_cycle: ["monthly","yearly","one_time","n_a"].includes(item.billing_cycle) ? item.billing_cycle : "yearly", description: String(item.description ?? "").trim() });
    if (kind === "addons") Object.assign(base, { name: String(item.name ?? "").trim(), description: String(item.description ?? "").trim(), price: Math.max(0, Number(item.price ?? 0)), billing_cycle: String(item.billing_cycle ?? "one_time"), currency: String(item.currency ?? "BDT").toUpperCase().trim() });
    if (kind === "domains") Object.assign(base, { tld: String(item.tld ?? "").replace(/^\./, "").toLowerCase().trim(), registration_price: Math.max(0, Number(item.registration_price ?? 0)), renewal_price: Math.max(0, Number(item.renewal_price ?? item.registration_price ?? 0)), currency: String(item.currency ?? "USD").toUpperCase().trim() });
    return base;
  }).filter((row: any) => kind === "domains" ? row.tld : row.name);

  for (const row of rows) {
    const { data, error } = await db.from(TABLES[kind]).upsert(row).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (data?.id) incomingIds.add(data.id);
  }
  const oldIds = (existing.data ?? []).map((r: any) => r.id).filter((id: string) => !incomingIds.has(id));
  if (oldIds.length) { const { error } = await db.from(TABLES[kind]).delete().in("id", oldIds); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); }
  await db.from("admin_audit_logs").insert({ admin_id: auth.user!.id, action: "catalog_updated", entity_type: kind, metadata: { count: rows.length, removed: oldIds.length } });
  const { data, error } = await db.from(TABLES[kind]).select("*").order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json({ ok: true, items: data ?? [] });
}
