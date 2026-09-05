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

  const money = (value: unknown, currency = "BDT") => { try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value || 0)); } catch { return `${currency} ${Number(value || 0).toFixed(2)}`; } };
  const currency = (domain as any).currency || "BDT";
  return <DashboardLayout pageTitle="Domain Details" userEmail={user.email ?? null}>
    <div className="mx-auto max-w-[1320px]">
      <Link href="/dashboard/domains" className="text-sm font-bold text-blue-600 hover:text-blue-700">← My Domains</Link>
      <section className="mt-4 overflow-hidden rounded-[--radius-sheet] border border-slate-200 bg-slate-950 p-5 text-white shadow-[var(--shadow-soft)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h1 className="break-all text-2xl font-black tracking-tight sm:text-3xl">{domain.domain_name}</h1><StatusBadge status={domain.status} /></div><p className="mt-2 text-sm text-slate-300">Registered {domain.registered_at ? new Date(domain.registered_at).toLocaleDateString() : "—"} · Expires {domain.expires_at ? new Date(domain.expires_at).toLocaleDateString() : "—"}</p></div><div className="flex flex-wrap gap-2"><Link href={`/dashboard/domains/${id}/dns`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">Manage DNS</Link><Link href="/domains/search" className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black text-white">Add domain</Link></div></div>
      </section>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5"><DomainInfoCard domain={domain as any} /><section className="surface p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-[.15em] text-blue-600">Domain controls</p><h2 className="mt-1 text-xl font-black text-slate-950">Everything you need, one click away</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><Link href={`/dashboard/domains/${id}/dns`} className="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40"><p className="font-black">DNS records <span className="text-blue-600">→</span></p><p className="mt-1 text-xs leading-5 text-slate-500">A, CNAME, MX, TXT and other records.</p></Link><Link href={`/dashboard/domains/${id}/nameservers`} className="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40"><p className="font-black">Nameservers <span className="text-blue-600">→</span></p><p className="mt-1 text-xs leading-5 text-slate-500">Connect your DNS or hosting provider.</p></Link><Link href="/dashboard/services" className="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40"><p className="font-black">Connect website <span className="text-blue-600">→</span></p><p className="mt-1 text-xs leading-5 text-slate-500">Choose hosting or connect an existing site.</p></Link><Link href="/dashboard/email" className="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40"><p className="font-black">Create email <span className="text-blue-600">→</span></p><p className="mt-1 text-xs leading-5 text-slate-500">Set up branded mailboxes and forwarding.</p></Link></div></section></div>
        <aside className="surface h-fit p-5 sm:p-6 lg:sticky lg:top-24"><p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">Billing & security</p><dl className="mt-4 space-y-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Auto renewal</dt><dd className="font-black">{domain.auto_renew ? "On" : "Off"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Registration</dt><dd className="font-black">{money((domain as any).registration_price, currency)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Renewal</dt><dd className="font-black">{money((domain as any).renewal_price, currency)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Verification</dt><dd className="font-black capitalize">{(domain as any).verification_status || "waiting"}</dd></div></dl><div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">Renewal pricing is shown clearly before any renewal is placed. Keep auto-renew on if you don&apos;t want the domain to expire.</div><Link href="/dashboard/invoices" className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white">View billing history</Link></aside>
      </div>
    </div>
  </DashboardLayout>;
}
