"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Invoice { id: string; invoice_number: string; status: string; currency: string; total: number; order_id: string; }

export function PaymentContent({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/payment/invoice?id=${encodeURIComponent(invoiceId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.success) throw new Error(data.error || "Couldn't load invoice.");
        setInvoice(data.invoice);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  async function pay() {
    setPaying(true); setError("");
    try {
      const response = await fetch("/api/payment/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Payment failed.");
      setTransactionId(data.payment.transactionId);
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Payment failed."); }
    finally { setPaying(false); }
  }

  if (loading) return <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading payment...</div>;
  if (error && !invoice) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;
  if (!invoice) return null;

  return <div className="mx-auto flex max-w-2xl flex-col gap-5">
    <div><p className="text-xs font-medium uppercase tracking-wide text-gray-400">Step 4 of 4</p><h1 className="mt-1 text-lg font-semibold text-gray-900">Payment</h1><p className="mt-1 text-sm text-gray-500">Complete payment for your invoice to activate the order.</p></div>
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><div><p className="text-xs text-gray-400">Invoice</p><p className="font-semibold text-gray-900">{invoice.invoice_number}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{done ? "paid" : invoice.status}</span></div>
      <div className="mt-6 flex items-end justify-between border-t border-gray-100 pt-5"><span className="text-sm text-gray-500">Total payable</span><span className="text-2xl font-bold text-gray-900">{invoice.currency} {Number(invoice.total).toFixed(2)}</span></div>
    </section>
    <section className="rounded-xl border border-blue-100 bg-blue-50 p-5"><p className="font-semibold text-gray-900">Demo payment</p><p className="mt-1 text-sm text-gray-600">The project currently uses a safe simulation gateway so the complete payment flow can be tested. No card, mobile-wallet, or bank credentials are collected.</p><button onClick={pay} disabled={paying || done || invoice.status !== "unpaid"} className="mt-4 rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{paying ? "Processing..." : done ? "Payment Successful" : `Pay ${invoice.currency} ${Number(invoice.total).toFixed(2)}`}</button></section>
    {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {done && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"><p className="font-semibold">Payment successful.</p><p className="mt-1">Transaction: {transactionId}</p><Link className="mt-3 inline-block font-medium underline" href="/dashboard">Go to Dashboard</Link></div>}
    {!done && <Link href="/dashboard/invoices" className="text-sm font-medium text-gray-600 hover:text-gray-900">Back to invoices</Link>}
  </div>;
}
