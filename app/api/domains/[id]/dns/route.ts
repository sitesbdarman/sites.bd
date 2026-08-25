import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteDnsRecord, isDeSecConfigured, listDnsRecords, upsertDnsRecord } from "@/lib/desec/client";

const schema = z.object({
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS"]),
  name: z.string().trim().min(1).max(253),
  content: z.string().trim().min(1).max(4096),
  ttl: z.coerce.number().int().min(60).max(86400).default(3600),
  priority: z.coerce.number().int().min(0).max(65535).nullable().optional(),
});

async function getOwnedDomain(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, domain: null };
  const { data: domain } = await supabase.from("domains").select("id, domain_name, owner_id").eq("id", id).eq("owner_id", user.id).maybeSingle();
  return { supabase, user, domain };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, domain } = await getOwnedDomain(id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

  const { data, error } = await supabase.from("dns_records").select("id,type,name,content,ttl,priority,status,provider_record_id,created_at,updated_at").eq("domain_id", id).eq("owner_id", user.id).neq("status", "deleted").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ domain, records: data ?? [], deSecConfigured: isDeSecConfigured() });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const { id } = await params;
  const { supabase, user, domain } = await getOwnedDomain(id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid DNS record", details: parsed.error.flatten() }, { status: 400 });

  try {
    const providerRecord = isDeSecConfigured()
      ? await upsertDnsRecord({ domain: domain.domain_name, ...parsed.data })
      : null;

    const { data, error } = await supabase.from("dns_records").insert({
      domain_id: id,
      owner_id: user.id,
      ...parsed.data,
      provider_record_id: providerRecord ? `${parsed.data.type}:${parsed.data.name}:${parsed.data.content}` : null,
      status: providerRecord ? "active" : "pending",
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ record: data, synced: Boolean(providerRecord) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DNS sync failed";
    const isConflict = message.startsWith("CNAME conflict") || message.includes("already has a CNAME record");
    return NextResponse.json({ error: message, code: isConflict ? "DNS_RRSET_CONFLICT" : "DNS_SYNC_FAILED" }, { status: isConflict ? 409 : 502 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const { id } = await params;
  const { supabase, user, domain } = await getOwnedDomain(id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  const recordId = new URL(request.url).searchParams.get("recordId");
  if (!recordId) return NextResponse.json({ error: "recordId is required" }, { status: 400 });
  const { data: record } = await supabase.from("dns_records").select("id,type,name,content,priority,provider_record_id").eq("id", recordId).eq("domain_id", id).eq("owner_id", user.id).maybeSingle();
  if (!record) return NextResponse.json({ error: "DNS record not found" }, { status: 404 });
  try {
    if (isDeSecConfigured()) {
      await deleteDnsRecord({ domain: domain.domain_name, type: record.type, name: record.name, content: record.content, priority: record.priority });
    }
    const { error } = await supabase.from("dns_records").update({ status: "deleted" }).eq("id", recordId).eq("owner_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "DNS delete failed" }, { status: 502 });
  }
}
