import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DomainInfoCard } from "@/components/dashboard/DomainInfoCard";
import { DnsManager } from "@/components/dashboard/DnsManager";
import { NameserverManager } from "@/components/dashboard/NameserverManager";

export default async function DomainDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: domain } = await db.from("domains").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!domain) notFound();
  const { data: records } = await db.from("dns_records").select("id,type,name,content,ttl,priority,status,provider_record_id").eq("domain_id", id).eq("owner_id", user.id).neq("status", "deleted").order("created_at", { ascending: false });

  return <DashboardLayout pageTitle="Domain Details" userEmail={user.email ?? null}>
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div><div className="flex items-center gap-3"><h1 className="text-xl font-black text-gray-900">{domain.domain_name}</h1><StatusBadge status={domain.status} /></div><p className="mt-1 text-sm text-gray-500">Registration: {domain.registered_at ? new Date(domain.registered_at).toLocaleDateString() : "—"} · Expiry: {domain.expires_at ? new Date(domain.expires_at).toLocaleDateString() : "—"}</p></div>
      <div className="flex flex-wrap gap-2"><Link href={`/dashboard/domains/${id}/txt`} className="rounded-xl border px-4 py-2 text-sm font-bold">Add TXT Record</Link><Link href="/domains/search" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">Add New Domain</Link></div>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <DomainInfoCard domain={domain as any} />
      <div className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-bold">Hosting & Billing</h2><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-gray-400">Hosting</dt><dd className="mt-1 font-semibold">{(domain as any).hosting_type || "Not selected"}</dd></div><div><dt className="text-gray-400">Auto renewal</dt><dd className="mt-1 font-semibold">{domain.auto_renew ? "On" : "Off"}</dd></div><div><dt className="text-gray-400">Purchase price</dt><dd className="mt-1 font-semibold">BDT {Number((domain as any).registration_price || 0).toFixed(2)}</dd></div><div><dt className="text-gray-400">Renewal price</dt><dd className="mt-1 font-semibold">BDT {Number((domain as any).renewal_price || 0).toFixed(2)}</dd></div></dl><p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Verification status: {(domain as any).verification_status || "waiting"}. Contact support if verification is taking too long.</p></div>
    </div>
    <div className="mt-5 rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">DNS / Name Server Management</h2><div className="mt-4 grid gap-5 xl:grid-cols-2"><NameserverManager domainId={id} initial={[(domain as any).nameserver1,(domain as any).nameserver2,(domain as any).nameserver3,(domain as any).nameserver4].filter(Boolean)} /><DnsManager domainId={id} /></div><p className="mt-5 text-sm text-gray-500">To verify live DNS propagation, use a public DNS checker after a successful sync.</p></div>
    <div className="mt-5 grid gap-5 md:grid-cols-3"><div className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="font-bold">Connect Service</h3><p className="mt-2 text-sm text-gray-500">Link hosting or other services to this domain from your service order.</p></div><div className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="font-bold">Guides & Information</h3><p className="mt-2 text-sm text-gray-500">DNS, nameserver, SSL and free-hosting setup guides can be managed from admin content.</p></div><div className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="font-bold">Special Offers</h3><p className="mt-2 text-sm text-gray-500">Promotions and renewal offers will appear here when configured.</p></div></div>
  </DashboardLayout>;
}
