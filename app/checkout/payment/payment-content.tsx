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
  const [settings, setSettings] = useState({ bkash_number: "", nagad_number: "", rocket_number: "" });

  useEffect(() => {
    fetch("/api/payment/settings").then(r => r.json()).then(d => { if (d.success) setSettings(d.settings); }).catch(() => {});
    fetch(`/api/payment/invoice?id=${encodeURIComponent(invoiceId)}`).then(async r => { const data = await r.json(); if (!r.ok || !data.success) throw new Error(data.error || "Couldn't load invoice."); setInvoice(data.invoice); }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [invoiceId]);

  async function pay() {
    if (!senderNumber.trim() || !transactionId.trim()) { setError("Enter your wallet number and transaction ID to continue."); return; }
    setPaying(true); setError("");
    try { const response = await fetch("/api/payment/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId, method, senderNumber, transactionId }) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || "Payment submission failed."); setSubmitted(true); }
    catch (e) { setError(e instanceof Error ? e.message : "Payment submission failed."); } finally { setPaying(false); }
  }

  if (loading) return <div className="surface flex min-h-56 items-center justify-center text-sm font-semibold text-slate-500">Loading your secure payment step…</div>;
  if (error && !invoice) return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>;
  if (!invoice) return null;

  const merchant = method === "bkash" ? settings.bkash_number : method === "nagad" ? settings.nagad_number : settings.rocket_number;
  return <div className="space-y-5">
    <div><p className="text-xs font-black uppercase tracking-[.18em] text-blue-600">Payment</p><h1 className="mt-2 text-3xl font-black tracking-[-.03em] text-slate-950 sm:text-4xl">Complete your order</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Invoice {invoice.invoice_number}. Submit the payment details below and we’ll review the transaction.</p></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="surface p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">Invoice</p><h2 className="mt-1 text-lg font-black text-slate-950">{invoice.invoice_number}</h2></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black capitalize text-amber-700">{submitted ? "pending review" : invoice.status}</span></div><div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white"><p className="text-xs font-bold text-slate-400">Total payable</p><p className="mt-1 text-3xl font-black tracking-tight">{invoice.currency} {Number(invoice.total).toFixed(2)}</p></div></section>
      <aside className="surface h-fit p-5 sm:p-6">{!submitted ? <><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">Available payment</p><h2 className="mt-1 text-xl font-black text-slate-950">Mobile wallet</h2><p className="mt-2 text-xs leading-5 text-slate-500">This account currently accepts the configured local wallet methods. International card processing can be connected later without changing the checkout flow.</p><label className="mt-5 block text-xs font-black uppercase tracking-wide text-slate-500">Payment method<select value={method} onChange={e=>setMethod(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option></select></label><div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs text-blue-700">Send exactly {invoice.currency} {Number(invoice.total).toFixed(2)} to</p><p className="mt-1 break-all text-base font-black text-slate-950">{merchant || "Payment number not configured"}</p></div><label className="mt-4 block text-xs font-black uppercase tracking-wide text-slate-500">Your wallet number<input value={senderNumber} onChange={e=>setSenderNumber(e.target.value)} placeholder="01XXXXXXXXX" className="mt-2 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"/></label><label className="mt-4 block text-xs font-black uppercase tracking-wide text-slate-500">Transaction ID<input value={transactionId} onChange={e=>setTransactionId(e.target.value)} placeholder="Enter transaction ID" className="mt-2 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"/></label><button onClick={pay} disabled={paying || invoice.status !== "unpaid"} className="btn-signature mt-5 min-h-12 w-full rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{paying ? "Submitting…" : "Submit payment →"}</button>{error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}</> : <div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-xl text-emerald-700">✓</div><p className="mt-4 text-xs font-black uppercase tracking-[.14em] text-emerald-600">Submitted</p><h2 className="mt-1 text-xl font-black text-slate-950">Payment is under review</h2><p className="mt-2 text-sm leading-6 text-slate-500">Transaction <strong className="text-slate-800">{transactionId}</strong> has been submitted. Your order will be activated after approval.</p><Link href="/dashboard" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white">Go to dashboard →</Link></div>}</aside>
    </div>
  </div>;
}
