import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function Card({ label, value, detail, href, icon }: { label: string; value: string | number; detail: string; href: string; icon: string }) {
  return (
    <Link href={href} className="surface accent-bar group block overflow-hidden p-5 pl-6 text-sky-600 transition-colors hover:border-sky-300">
      <div className="flex items-center gap-2 text-slate-500">
        <span aria-hidden="true" className="text-sm">{icon}</span>
        <p className="text-sm font-semibold">{label}</p>
      </div>
      <p className="tabular mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </Link>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const db = createAdminClient();
  const [users, domains, orders, tickets, unpaid, pendingPayments, paidInvoices, activity] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("domains").select("id", { count: "exact", head: true }),
    db.from("orders").select("id", { count: "exact", head: true }),
    db.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]),
    db.from("invoices").select("id", { count: "exact", head: true }).eq("status", "unpaid"),
    db.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    db.from("invoices").select("total").eq("status", "paid"),
    db.from("admin_audit_with_admin").select("id, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const revenue = (paidInvoices.data || []).reduce((sum, row) => sum + Number(row.total || 0), 0);

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-300">Live control center</div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Manage customers, domains, orders, manual payments, support and platform settings from one place.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Link href="/admin/domains" className="rounded-xl bg-sky-500 px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-sky-400 active:scale-[.98]">Manage Domains</Link>
            <Link href="/admin/orders" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10 active:scale-[.98]">Review Payments</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card label="Customers" value={users.count ?? 0} detail="Registered profiles" href="/admin/users" icon="♙" />
        <Card label="Domains" value={domains.count ?? 0} detail="Managed domain records" href="/admin/domains" icon="◎" />
        <Card label="Orders" value={orders.count ?? 0} detail="All platform orders" href="/admin/orders" icon="◫" />
        <Card label="Pending Payments" value={pendingPayments.count ?? 0} detail="Need manual review" href="/admin/orders" icon="৳" />
        <Card label="Open Tickets" value={tickets.count ?? 0} detail="Awaiting support action" href="/admin/tickets" icon="◌" />
        <Card label="Unpaid Invoices" value={unpaid.count ?? 0} detail="Customers still owe" href="/admin/orders" icon="▤" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[--radius-surface] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-lg font-black text-slate-950">Business snapshot</h2><p className="mt-1 text-sm text-slate-500">A quick view of the commercial side of SITES.BD.</p></div>
            <Link href="/admin/orders" className="text-sm font-bold text-sky-600 hover:text-sky-700">View orders →</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-500">Paid invoice value</p><p className="mt-2 text-2xl font-black text-slate-950">BDT {revenue.toFixed(2)}</p><p className="mt-1 text-xs text-slate-400">Based on paid invoices currently stored</p></div>
            <div className="rounded-xl bg-sky-50 p-5"><p className="text-sm font-semibold text-sky-700">Payment queue</p><p className="mt-2 text-2xl font-black text-slate-950">{pendingPayments.count ?? 0}</p><p className="mt-1 text-xs text-slate-500">Manual payments waiting for review</p></div>
          </div>
        </div>

        <div className="rounded-[--radius-surface] border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">Quick actions</h2>
          <div className="mt-4 grid gap-2">
            {[['/admin/users','Customer management'],['/admin/domains','Domain management'],['/admin/orders','Payment approvals'],['/admin/tickets','Support tickets'],['/admin/settings','Payment settings']].map(([href,label]) => <Link key={href} href={href} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 active:scale-[.99]"><span>{label}</span><span>→</span></Link>)}
          </div>
        </div>
      </section>

      <section className="rounded-[--radius-surface] border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Recent activity</h2><p className="mt-1 text-sm text-slate-500">The latest operational changes in the platform.</p></div><Link href="/admin/audit" className="text-sm font-bold text-sky-600">Full audit log →</Link></div><div className="mt-4 space-y-2">{(activity.data||[]).map((a:any)=><div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"><div><div className="font-semibold text-slate-800">{a.action}</div><div className="text-xs text-slate-500">{a.entity_type}{a.entity_id?` · ${a.entity_id}`:''}</div></div><time className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</time></div>)}{!(activity.data||[]).length&&<p className="text-sm text-slate-500">No recent activity yet.</p>}</div></section>
    </div>
  );
}
