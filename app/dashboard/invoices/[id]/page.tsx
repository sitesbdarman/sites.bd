import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PrintInvoiceButton } from "@/components/PrintInvoiceButton";
import { StatusBadge, type DashboardStatus } from "@/components/dashboard/StatusBadge";

const KNOWN_STATUSES: DashboardStatus[] = ["active", "pending", "processing", "expired", "suspended", "paid", "overdue", "closed"];
function toStatus(value: string | null | undefined): DashboardStatus {
  return (KNOWN_STATUSES as string[]).includes(value ?? "") ? (value as DashboardStatus) : "pending";
}

export default async function InvoiceDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: invoice } = await db
    .from("invoices")
    .select("*,orders(order_number,hosting_plan_name,hosting_price)")
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!invoice) notFound();

  const isUnpaid = invoice.status !== "paid";

  return (
    <DashboardLayout pageTitle="Invoice Details" userEmail={user.email ?? null}>
      <Link href="/dashboard/invoices" className="text-sm font-bold text-blue-600 hover:text-blue-700">← My Invoices</Link>
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400">Invoice</p>
            <h1 className="mt-1 text-2xl font-black text-gray-900">{invoice.invoice_number}</h1>
          </div>
          <StatusBadge status={toStatus(invoice.status)} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-400">Order</p>
            <p className="mt-1 font-semibold text-gray-900">{(invoice as any).orders?.order_number || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Issued</p>
            <p className="mt-1 font-semibold text-gray-900">{new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="mt-1 text-lg font-black text-gray-900">{invoice.currency} {Number(invoice.total).toFixed(2)}</p>
          </div>
        </div>

        {isUnpaid && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-800">This invoice is awaiting payment. Pay now to keep your service uninterrupted.</p>
            <Link
              href={`/checkout/payment?invoice=${id}`}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[.98]"
            >
              Pay Now
            </Link>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <PrintInvoiceButton />
        </div>
      </div>
    </DashboardLayout>
  );
}
