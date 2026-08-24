import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/auth";

export async function GET() {
  const auth = await assertAdminApi();
  if (auth.response) return auth.response;
  const { data, error } = await auth.admin!.from("pricing_plans").select("*").order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plans: data ?? [] });
}

export async function PUT(request: Request) {
  const auth = await assertAdminApi();
  if (auth.response) return auth.response;
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!Array.isArray(body?.plans)) return NextResponse.json({ error: "plans must be an array." }, { status: 400 });

  const db = auth.admin!;
  const plans = body.plans.map((p: any, index: number) => ({
    ...(p.id ? { id: p.id } : {}),
    name: String(p.name ?? "").trim(),
    price: Number(p.price ?? 0),
    currency: String(p.currency ?? "BDT").trim().toUpperCase(),
    billing_period: String(p.billing_period ?? "year").trim(),
    description: String(p.description ?? "").trim(),
    features: Array.isArray(p.features) ? p.features.map(String).filter(Boolean) : [],
    badge: p.badge ? String(p.badge).trim() : null,
    cta_text: String(p.cta_text ?? "Get Started").trim(),
    is_active: Boolean(p.is_active),
    sort_order: Number.isFinite(Number(p.sort_order)) ? Number(p.sort_order) : index,
    updated_at: new Date().toISOString(),
  })).filter((p: any) => p.name);

  for (const plan of plans) {
    const { error } = await db.from("pricing_plans").upsert(plan, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const ids = plans.map((p: any) => p.id).filter(Boolean);
  if (ids.length) await db.from("pricing_plans").delete().not("id", "in", `(${ids.join(",")})`);
  return NextResponse.json({ ok: true, plans });
}
