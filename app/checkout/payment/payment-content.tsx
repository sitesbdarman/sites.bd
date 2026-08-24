"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Invoice { id: string; invoice_number: string; status: string; currency: string; total: number; order_id: string; }

export function PaymentContent({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("bkash");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [settings, setSettings] = useState({bkash_number:"",nagad_number:"",rocket_number:""});

  useEffect(() => {
    fetch("/api/payment/settings").then(r=>r.json()).then(d=>{if(d.success)setSettings(d.settings);}).catch(()=>{});
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
    try { const response=await fetch("/api/payment/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({invoiceId,method,senderNumber,transactionId})}); const data=await response.json(); if(!response.ok||!data.success) throw new Error(data.error||"Payment submission failed."); setSubmitted(true); }
    catch(e){setError(e instanceof Error?e.message:"Payment submission failed.");} finally{setPaying(false);} }


  if (loading) return <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading payment...</div>;
  if (error && !invoice) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;
  if (!invoice) return null;

  return <div className="mx-auto flex max-w-2xl flex-col gap-5">
    <div><p className="text-xs font-medium uppercase tracking-wide text-gray-400">Step 4 of 4</p><h1 className="mt-1 text-lg font-semibold text-gray-900">Payment</h1><p className="mt-1 text-sm text-gray-500">Complete payment for your invoice to activate the order.</p></div>
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><div><p className="text-xs text-gray-400">Invoice</p><p className="font-semibold text-gray-900">{invoice.invoice_number}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{submitted ? "pending review" : invoice.status}</span></div>
      <div className="mt-6 flex items-end justify-between border-t border-gray-100 pt-5"><span className="text-sm text-gray-500">Total payable</span><span className="text-2xl font-bold text-gray-900">{invoice.currency} {Number(invoice.total).toFixed(2)}</span></div>
    </section>
    {!submitted ? <section className="rounded-xl border border-blue-100 bg-blue-50 p-5"><p className="font-semibold text-gray-900">Manual mobile-wallet payment</p><p className="mt-1 text-sm text-gray-600">Send the exact invoice amount to the merchant number below, then enter your wallet number and transaction ID. An admin will review and approve it.</p><div className="mt-4 rounded-lg border border-blue-200 bg-white p-3 text-sm"><span className="text-gray-500">Send via {method === "bkash" ? "bKash" : method === "nagad" ? "Nagad" : "Rocket"} to:</span><strong className="ml-2 text-gray-900">{method === "bkash" ? (settings.bkash_number || "Not configured") : method === "nagad" ? (settings.nagad_number || "Not configured") : (settings.rocket_number || "Not configured")}</strong></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-gray-700">Payment method<select value={method} onChange={e=>setMethod(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5"><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option></select></label><label className="text-sm font-medium text-gray-700">Your wallet number<input value={senderNumber} onChange={e=>setSenderNumber(e.target.value)} placeholder="01XXXXXXXXX" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5" /></label></div><label className="mt-4 block text-sm font-medium text-gray-700">Transaction ID<input value={transactionId} onChange={e=>setTransactionId(e.target.value)} placeholder="e.g. 8A7B6C5D" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5" /></label><button onClick={pay} disabled={paying || invoice.status !== "unpaid"} className="mt-4 rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{paying?"Submitting...":`Submit payment ${invoice.currency} ${Number(invoice.total).toFixed(2)}`}</button></section> : <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><p className="font-semibold">Payment submitted for admin approval.</p><p className="mt-1">Transaction: {transactionId}</p><p className="mt-1">The domain will be activated after the administrator approves the payment.</p><Link className="mt-3 inline-block font-medium underline" href="/dashboard">Go to Dashboard</Link></div>}
    {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {!submitted && <Link href="/dashboard/invoices" className="text-sm font-medium text-gray-600 hover:text-gray-900">Back to invoices</Link>}
  </div>;
}
