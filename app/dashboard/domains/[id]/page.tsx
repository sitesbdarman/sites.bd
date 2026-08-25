import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DomainInfoCard } from "@/components/dashboard/DomainInfoCard";

export default async function DomainDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: domain } = await db.from("domains").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!domain) notFound();

  return <DashboardLayout pageTitle="Domain Details" userEmail={user.email ?? null}>
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div><div className="flex items-center gap-3"><h1 className="text-xl font-black text-gray-900">{domain.domain_name}</h1><StatusBadge status={domain.status} /></div><p className="mt-1 text-sm text-gray-500">Registration: {domain.registered_at ? new Date(domain.registered_at).toLocaleDateString() : "—"} · Expiry: {domain.expires_at ? new Date(domain.expires_at).toLocaleDateString() : "—"}</p></div>
      <div className="flex flex-wrap gap-2"><Link href={`/dashboard/domains/${id}/txt`} className="rounded-xl border px-4 py-2 text-sm font-bold">Add TXT Record</Link><Link href="/domains/search" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">Add New Domain</Link></div>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <DomainInfoCard domain={domain as any} />
      <div className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-bold">Hosting & Billing</h2><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-gray-400">Hosting</dt><dd className="mt-1 font-semibold">{(domain as any).hosting_type || "Not selected"}</dd></div><div><dt className="text-gray-400">Auto renewal</dt><dd className="mt-1 font-semibold">{domain.auto_renew ? "On" : "Off"}</dd></div><div><dt className="text-gray-400">Purchase price</dt><dd className="mt-1 font-semibold">BDT {Number((domain as any).registration_price || 0).toFixed(2)}</dd></div><div><dt className="text-gray-400">Renewal price</dt><dd className="mt-1 font-semibold">BDT {Number((domain as any).renewal_price || 0).toFixed(2)}</dd></div></dl><p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Verification status: {(domain as any).verification_status || "waiting"}. Contact support if verification is taking too long.</p></div>
    </div>
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <Link href={`/dashboard/domains/${id}/nameservers`} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">DNS Control</p><h2 className="mt-2 text-lg font-black text-slate-950">Name Server Management</h2><p className="mt-2 text-sm leading-6 text-slate-500">Update and review the nameservers assigned to this domain.</p><span className="mt-4 inline-flex text-sm font-bold text-blue-600 group-hover:text-blue-700">Open Name Servers →</span>
      </Link>
      <Link href={`/dashboard/domains/${id}/dns`} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">DNS Control</p><h2 className="mt-2 text-lg font-black text-slate-950">DNS Records</h2><p className="mt-2 text-sm leading-6 text-slate-500">Add, review and remove A, AAAA, CNAME, MX, TXT, NS and other supported records.</p><span className="mt-4 inline-flex text-sm font-bold text-blue-600 group-hover:text-blue-700">Open DNS Records →</span>
      </Link>
    </div>

  </DashboardLayout>;
}
