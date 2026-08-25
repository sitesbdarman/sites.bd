import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DnsManager } from "@/components/dashboard/DnsManager";

export default async function DnsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: domain } = await db.from("domains").select("id,domain_name").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!domain) notFound();
  return <DashboardLayout pageTitle="DNS Records" userEmail={user.email ?? null}>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><Link href={`/dashboard/domains/${id}`} className="text-sm font-bold text-blue-600 hover:text-blue-700">← Back to Domain</Link><h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">DNS Records</h1><p className="mt-1 text-sm text-slate-500">Domain: {domain.domain_name}</p></div>
      <Link href={`/dashboard/domains/${id}/nameservers`} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">Manage Name Servers →</Link>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><DnsManager domainId={id} /></div>
  </DashboardLayout>;
}
