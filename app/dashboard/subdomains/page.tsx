import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export default async function SubdomainsPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const { data: domains } = user ? await db.from("domains").select("id,domain_name,status,registered_at,expires_at").eq("owner_id", user.id).ilike("domain_name", "%.sites.bd").order("created_at", { ascending: false }) : { data: [] };
  return <DashboardLayout pageTitle="My Subdomains" userEmail={user?.email ?? null}>
    <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">Free .sites.bd</h2><p className="mt-1 text-sm text-gray-500">Manage the free addresses you have claimed.</p></div><Link href="/#claim" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white">Claim Subdomain</Link></div>
    <div className="space-y-2">{(domains ?? []).length ? domains!.map(d => <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"><div className="min-w-0"><Link href={`/dashboard/domains/${d.id}`} className="truncate font-bold text-slate-900 hover:text-blue-700">{d.domain_name}</Link><p className="mt-1 text-xs text-gray-500">Free forever · Registered {d.registered_at ? new Date(d.registered_at).toLocaleDateString() : "—"}</p></div><div className="flex items-center gap-2"><StatusBadge status={d.status}/><Link href={`/dashboard/domains/${d.id}`} className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white">Manage →</Link></div></div>) : <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center"><p className="font-bold text-slate-900">No free subdomains yet</p><Link href="/#claim" className="mt-3 inline-block font-bold text-blue-600">Claim your .sites.bd address →</Link></div>}</div>
  </DashboardLayout>;
}
