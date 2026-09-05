import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const features = [
  ["Create Email Address", "Create branded addresses such as hello@yourdomain.com."],
  ["My Email Accounts", "View and manage mailboxes connected to your domains."],
  ["Forwarding & Aliases", "Route messages to another inbox or create aliases."],
  ["Password Management", "Securely manage mailbox credentials when hosting is connected."],
  ["Storage / Plan", "Review mailbox storage and your current email plan."],
  ["Webmail Access", "Open webmail once a live provider is connected."],
];
export default async function EmailPage() {
  const db = await createClient(); const { data: { user } } = await db.auth.getUser();
 return <DashboardLayout pageTitle="Email" userEmail={user?.email ?? null}>
  <div className="overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-[var(--shadow-float)] sm:p-8"><p className="text-xs font-black uppercase tracking-[.18em] text-sky-300">Professional email</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Email for your domain</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">A provider-ready email workspace for branded addresses, forwarding, aliases, storage and webmail.</p></div>
  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{features.map(([title,desc]) => <Link key={title} href="/dashboard/email" className="surface p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30"><h3 className="font-black text-slate-900">{title}</h3><p className="mt-1.5 text-sm leading-5 text-gray-500">{desc}</p></Link>)}</div>
  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><strong>Infrastructure-ready:</strong> mailbox provisioning, MX/SPF/DKIM/DMARC records and webmail access should be connected to a real mail provider before production email delivery is enabled.</div>
 </DashboardLayout>;
}
