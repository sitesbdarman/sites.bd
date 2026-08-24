import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InvoiceIcon } from "@/components/dashboard/icons";
import Link from "next/link";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: invoices, error } = user
    ? await supabase.from("invoices").select("id,invoice_number,status,currency,total,created_at,due_at").eq("customer_id", user.id).order("created_at", { ascending: false })
    : { data: [], error: null };

  return (
    <DashboardLayout pageTitle="My Invoices" userEmail={user?.email ?? null}>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {error ? <EmptyState icon={InvoiceIcon} message="We couldn't load your invoices right now." /> : !invoices?.length ? (
          <EmptyState icon={InvoiceIcon} message="You don't have any invoices yet." />
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-gray-100">{invoices.map((invoice) => (<tr key={invoice.invoice_number}><td className="px-5 py-4 font-medium text-gray-900"><Link className="text-blue-600 hover:underline" href={`/dashboard/invoices/${(invoice as any).id}`}>{invoice.invoice_number}</Link></td><td className="px-5 py-4 text-gray-500">{new Date(invoice.created_at).toLocaleDateString()}</td><td className="px-5 py-4 text-gray-900">{invoice.currency} {Number(invoice.total).toFixed(2)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${invoice.status === "paid" ? "bg-green-50 text-green-700" : invoice.status === "cancelled" ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"}`}>{invoice.status}</span></td></tr>))}</tbody></table></div>
        )}
      </div>
    </DashboardLayout>
  );
}
