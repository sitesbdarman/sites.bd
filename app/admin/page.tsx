import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ count: users }, { count: domains }, { count: orders }, { count: tickets }, { count: unpaid }] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("domains").select("id", { count: "exact", head: true }),
    db.from("orders").select("id", { count: "exact", head: true }),
    db.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]),
    db.from("invoices").select("id", { count: "exact", head: true }).eq("status", "unpaid"),
  ]);
  const cards = [['Users',users,'/admin/users'],['Domains',domains,'/admin/domains'],['Orders',orders,'/admin/orders'],['Open Tickets',tickets,'/admin/tickets'],['Unpaid Invoices',unpaid,'/admin/orders']];
  return <div><h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1><p className="mt-1 text-sm text-gray-500">Manage the platform from one secure area.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label,count,href]) => <Link href={String(href)} key={String(label)} className="rounded-xl border bg-white p-5 shadow-sm hover:shadow"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold text-gray-900">{count ?? 0}</p></Link>)}</div></div>;
}
