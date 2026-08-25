import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NameserverManager } from "@/components/dashboard/NameserverManager";

export default async function NameserversPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: domain } = await db.from("domains").select("id,domain_name,nameserver1,nameserver2,nameserver3,nameserver4").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!domain) notFound();
  const initial = [domain.nameserver1, domain.nameserver2, domain.nameserver3, domain.nameserver4].filter(Boolean) as string[];
  return <DashboardLayout pageTitle="Name Server Management" userEmail={user.email ?? null}>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><Link href={`/dashboard/domains/${id}`} className="text-sm font-bold text-blue-600 hover:text-blue-700">← Back to Domain</Link><h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Name Server Management</h1><p className="mt-1 text-sm text-slate-500">Domain: {domain.domain_name}</p></div>
      <Link href={`/dashboard/domains/${id}/dns`} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">Manage DNS Records →</Link>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">Use at least two nameservers from your DNS or hosting provider. The domain is checked against your signed-in account before saving.</div><NameserverManager domainId={id} initial={initial} /></div>
  </DashboardLayout>;
}
