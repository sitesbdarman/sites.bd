"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBDT, type HostingPlanType } from "@/lib/hosting/plans";
import { loadHostingSelection, type HostingSelection } from "@/lib/hosting/selection";
import { loadAddonsSelection } from "@/lib/hosting/addons-selection";
import { CheckoutProgress } from "@/components/CheckoutProgress";

interface ReviewCartItem { id: string; domain_name: string; price: number; currency: string; validity_years: number; }
interface ReviewHosting { type: string; planId: string; planName: string; price: number; billingCycle: string; custom?: { nameServer: string; ipAddress: string }; }
interface ReviewAddon { id: string; name: string; price: number; }
interface ReviewTotals { domainTotal: number; hostingPrice: number; addonsTotal: number; finalTotal: number; couponDiscount?: number; subtotal?: number; }
interface ReviewResponse { success: boolean; errors?: string[]; cart?: ReviewCartItem[]; hosting?: ReviewHosting | null; addons?: ReviewAddon[]; totals?: ReviewTotals; error?: string; }
type LoadState = "loading" | "error" | "invalid" | "valid";

function formatMoney(price: number, currency = "BDT"): string {
  if (currency === "BDT") return `৳${Number(price).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`;
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price); }
  catch { return `${currency} ${price.toFixed(2)}`; }
}
function formatDomainPrice(item: ReviewCartItem): string {
  // SITES.BD's customer checkout is BDT-first. Legacy/mock USD rows are
  // rendered as BDT here so the UI never mixes a dollar amount with a BDT total.
  return formatMoney(item.price, "BDT");
}

export function ReviewContent() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [errors, setErrors] = useState<string[]>([]);
  const [cart, setCart] = useState<ReviewCartItem[]>([]);
  const [hosting, setHosting] = useState<ReviewHosting | null>(null);
  const [addons, setAddons] = useState<ReviewAddon[]>([]);
  const [totals, setTotals] = useState<ReviewTotals | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadReview() {
      const savedHosting: HostingSelection | null = loadHostingSelection();
      const savedAddons = loadAddonsSelection();
      if (!savedHosting) { if (!cancelled) { setErrors(["No hosting plan selected. Please go back and choose a plan."]); setState("invalid"); } return; }
      try {
        const response = await fetch("/api/checkout/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hosting: { type: savedHosting.type, planId: savedHosting.planId, custom: savedHosting.custom }, addonIds: savedAddons?.addonIds ?? [] }) });
        const data: ReviewResponse = await response.json();
        if (cancelled) return;
        if (!response.ok) { setErrors([data.error ?? "Couldn't validate your order. Please try again."]); setState("error"); return; }
        setCart(data.cart ?? []); setHosting(data.hosting ?? null); setAddons(data.addons ?? []); setTotals(data.totals ?? null);
        setErrors(data.success ? [] : data.errors ?? ["Some checkout data is invalid."]); setState(data.success ? "valid" : "invalid");
      } catch { if (!cancelled) { setErrors(["Couldn't reach the server. Please try again."]); setState("error"); } }
    }
    loadReview(); return () => { cancelled = true; };
  }, []);

  async function applyCoupon() {
    if (!couponCode.trim() || !hosting) return;
    setCouponBusy(true); setCouponMessage("");
    try {
      const savedHosting = loadHostingSelection(); const savedAddons = loadAddonsSelection();
      const response = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponCode, hosting: savedHosting ? { type: savedHosting.type, planId: savedHosting.planId } : undefined, addonIds: savedAddons?.addonIds ?? [] }) });
      const data = await response.json();
      if (!response.ok || !data.success) { setCouponDiscount(0); setCouponMessage(data.message || data.error || "Coupon is not valid."); return; }
      setCouponCode(data.code || couponCode.toUpperCase()); setCouponDiscount(Number(data.discount || 0)); setCouponMessage(data.message || "Coupon applied.");
      setTotals(prev => prev ? { ...prev, finalTotal: Number(data.total), couponDiscount: Number(data.discount || 0), subtotal: Number(data.subtotal) } : prev);
    } catch { setCouponDiscount(0); setCouponMessage("Could not check coupon."); } finally { setCouponBusy(false); }
  }

  async function confirmOrder() {
    if (!(state === "valid" && termsAccepted && !confirmed && !confirming)) return;
    setConfirming(true); setConfirmError("");
    try {
      const response = await fetch("/api/checkout/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hosting: hosting ? { type: hosting.type as HostingPlanType, planId: hosting.planId, custom: hosting.custom } : undefined, addonIds: addons.map(a => a.id), termsAccepted: true, couponCode: couponCode.trim() || undefined }) });
      const data = await response.json();
      if (!response.ok || !data.success) { setConfirmError(data.error ?? "Could not create your order."); return; }
      setOrderNumber(data.order.orderNumber); setConfirmed(true);
      if (data.nextStep === "payment" && data.invoiceId) { router.push(`/checkout/payment?invoice=${encodeURIComponent(data.invoiceId)}`); return; }
      router.push(`/checkout/success?order=${encodeURIComponent(data.order.id)}`);
    } catch { setConfirmError("Could not reach the server. Please try again."); } finally { setConfirming(false); }
  }

  const includePayment = !(totals && totals.finalTotal === 0);

  if (state === "loading") return <div className="space-y-5"><CheckoutProgress current={3} includePayment={includePayment} /><div className="surface flex min-h-56 flex-col items-center justify-center gap-3"><span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"/><p className="text-sm font-semibold text-slate-500">Preparing your order…</p></div></div>;

  const canConfirm = state === "valid" && termsAccepted && !confirmed && !confirming;
  return <div className="space-y-5">
    <CheckoutProgress current={3} includePayment={includePayment} />
    <div><p className="text-xs font-black uppercase tracking-[.18em] text-blue-600">Final review</p><h1 className="mt-2 text-3xl font-black tracking-[-.03em] text-slate-950 sm:text-4xl">Ready to place your order?</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review your domains, services and total. {totals && totals.finalTotal === 0 ? "This order is free — confirming activates it immediately." : "You’ll see the available payment options on the next step."}</p></div>
    {(state === "error" || state === "invalid") && errors.length > 0 && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><ul className="list-inside list-disc">{errors.map(e => <li key={e}>{e}</li>)}</ul></div>}
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <section className="surface p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">Domains</p><h2 className="mt-1 text-lg font-black text-slate-950">Your online identity</h2></div><Link href="/cart" className="text-xs font-black text-blue-600 hover:text-blue-700">Edit cart</Link></div><div className="mt-5 space-y-2">{cart.length ? cart.map(item => <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3.5"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{item.domain_name}</p><p className="mt-0.5 text-xs text-slate-500">{item.validity_years} year registration</p></div><span className="shrink-0 text-sm font-black text-slate-900">{formatDomainPrice(item)}</span></div>) : <p className="text-sm text-slate-500">No domains in cart.</p>}</div></section>
        <section className="surface p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">Hosting</p><div className="mt-3 flex items-center justify-between gap-4"><div><h2 className="font-black text-slate-950">{hosting?.planName ?? "No hosting plan"}</h2><p className="mt-1 text-xs text-slate-500">{hosting?.billingCycle ?? "Not selected"}</p></div>{hosting && <span className="font-black text-slate-900">{formatMoney(hosting.price, "BDT")}</span>}</div></section>
        <section className="surface p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">Add-ons</p>{addons.length ? <div className="mt-3 space-y-2">{addons.map(addon => <div key={addon.id} className="flex justify-between gap-4 text-sm"><span className="font-semibold text-slate-700">{addon.name}</span><span className="font-bold text-slate-900">{addon.price > 0 ? formatBDT(addon.price) : "Custom"}</span></div>)}</div> : <p className="mt-2 text-sm text-slate-500">No additional services selected.</p>}</section>
      </div>
      <aside className="surface h-fit p-5 sm:p-6 lg:sticky lg:top-24"><p className="text-xs font-black uppercase tracking-[.15em] text-blue-600">Order summary</p><h2 className="mt-1 text-xl font-black text-slate-950">Your total</h2>{totals && <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Domains</dt><dd className="font-bold">{formatBDT(totals.domainTotal)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Hosting</dt><dd className="font-bold">{formatBDT(totals.hostingPrice)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Add-ons</dt><dd className="font-bold">{formatBDT(totals.addonsTotal)}</dd></div>{couponDiscount > 0 && <div className="flex justify-between gap-3 text-emerald-700"><dt>Discount</dt><dd className="font-bold">-{formatBDT(couponDiscount)}</dd></div>}<div className="border-t border-slate-200 pt-4"><div className="flex items-end justify-between gap-3"><dt className="font-black text-slate-700">Total</dt><dd className="text-2xl font-black tracking-tight text-slate-950">{formatBDT(totals.finalTotal)}</dd></div></div></dl>}
        {totals && totals.finalTotal === 0 && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">🎉 Total is ৳0.00 — this order activates instantly when you confirm.</div>}
        <div className="mt-5 flex gap-2"><input value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} disabled={confirmed || couponBusy} placeholder="Coupon code" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"/><button type="button" onClick={applyCoupon} disabled={confirmed || couponBusy || !couponCode.trim()} className="rounded-xl bg-slate-900 px-4 text-xs font-black text-white disabled:opacity-40">{couponBusy ? "…" : "Apply"}</button></div>{couponMessage && <p className={`mt-2 text-xs font-semibold ${couponDiscount > 0 ? "text-emerald-600" : "text-red-600"}`}>{couponMessage}</p>}
        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">🔒 Secure checkout · No hidden charges. Applicable taxes and payment fees are shown before payment.</div>
        <label className="mt-5 flex items-start gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} disabled={confirmed} className="mt-1 h-4 w-4 rounded border-slate-300"/><span>I accept the Terms &amp; Conditions.</span></label>
        {confirmError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{confirmError}</div>}
        {confirmed && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">Order {orderNumber || "created"}. {totals && totals.finalTotal > 0 ? "Taking you to payment…" : "Activating your order…"}</div>}
        <button type="button" onClick={confirmOrder} disabled={!canConfirm} className="btn-signature mt-5 min-h-12 w-full rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{confirming ? "Creating order…" : confirmed ? "Order created" : totals && totals.finalTotal === 0 ? "Place order — ৳0.00 →" : "Continue to payment →"}</button>
        <Link href="/checkout/addons" className="mt-3 flex justify-center text-xs font-bold text-slate-500 hover:text-slate-900">← Back to add-ons</Link>
      </aside>
    </div>
  </div>;
}
