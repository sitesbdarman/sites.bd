"use client";

import { useEffect, useState } from "react";

type Plan = {
  id?: string;
  name: string;
  price: number;
  currency: string;
  billing_period: string;
  description: string;
  features: string[];
  badge: string | null;
  cta_text: string;
  is_active: boolean;
  sort_order: number;
};

const emptyPlan = (): Plan => ({
  name: "New Pricing Plan", price: 0, currency: "BDT", billing_period: "year",
  description: "", features: [], badge: null, cta_text: "Get Started",
  is_active: true, sort_order: 999,
});

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/pricing", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load pricing.");
      setPlans(d.plans || []);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not load pricing."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function update(index: number, patch: Partial<Plan>) {
    setPlans(old => old.map((p, i) => i === index ? { ...p, ...patch } : p));
  }

  async function save() {
    setSaving(true); setMessage("");
    try {
      const r = await fetch("/api/admin/pricing", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not save pricing.");
      setPlans(d.plans || plans); setMessage("Pricing updated successfully.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save pricing."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-7 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Commercial controls</p>
        <h1 className="mt-2 text-3xl font-black">Pricing Management</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Edit the pricing cards shown on the public pricing page. Changes are saved to Supabase.</p>
      </section>
      {message && <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">{message}</div>}
      {loading ? <div className="rounded-2xl bg-white p-8 text-slate-500">Loading pricing…</div> : (
        <div className="space-y-5">
          {plans.map((p, i) => (
            <div key={p.id ?? i} className="rounded-[--radius-surface] border border-slate-200 bg-white p-6 transition-colors hover:border-gray-300">
              <div className="grid gap-4 md:grid-cols-4">
                <label className="md:col-span-2"><span className="text-xs font-bold text-slate-500">Plan name</span><input value={p.name} onChange={e=>update(i,{name:e.target.value})} className="mt-1 w-full rounded-lg border px-3 py-2.5"/></label>
                <label><span className="text-xs font-bold text-slate-500">Price</span><input type="number" min="0" step="0.01" value={p.price} onChange={e=>update(i,{price:Number(e.target.value)})} className="mt-1 w-full rounded-lg border px-3 py-2.5"/></label>
                <label><span className="text-xs font-bold text-slate-500">Currency</span><input value={p.currency} onChange={e=>update(i,{currency:e.target.value.toUpperCase()})} className="mt-1 w-full rounded-lg border px-3 py-2.5"/></label>
                <label><span className="text-xs font-bold text-slate-500">Billing</span><input value={p.billing_period} onChange={e=>update(i,{billing_period:e.target.value})} className="mt-1 w-full rounded-lg border px-3 py-2.5"/></label>
                <label><span className="text-xs font-bold text-slate-500">Badge</span><input value={p.badge ?? ""} onChange={e=>update(i,{badge:e.target.value||null})} className="mt-1 w-full rounded-lg border px-3 py-2.5"/></label>
                <label><span className="text-xs font-bold text-slate-500">CTA text</span><input value={p.cta_text} onChange={e=>update(i,{cta_text:e.target.value})} className="mt-1 w-full rounded-lg border px-3 py-2.5"/></label>
                <label><span className="text-xs font-bold text-slate-500">Order</span><input type="number" value={p.sort_order} onChange={e=>update(i,{sort_order:Number(e.target.value)})} className="mt-1 w-full rounded-lg border px-3 py-2.5"/></label>
                <label className="flex items-end gap-2 pb-2"><input type="checkbox" checked={p.is_active} onChange={e=>update(i,{is_active:e.target.checked})} className="h-4 w-4"/><span className="text-sm font-semibold">Visible on website</span></label>
              </div>
              <label className="mt-4 block"><span className="text-xs font-bold text-slate-500">Description</span><textarea value={p.description} onChange={e=>update(i,{description:e.target.value})} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2.5"/></label>
              <label className="mt-4 block"><span className="text-xs font-bold text-slate-500">Features — one per line</span><textarea value={p.features.join("\n")} onChange={e=>update(i,{features:e.target.value.split("\n").filter(Boolean)})} rows={5} className="mt-1 w-full rounded-lg border px-3 py-2.5"/></label>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={()=>{ if(confirm(`Remove "${p.name}"? This will delete it permanently when you click Save pricing.`)) setPlans(old=>old.filter((_,idx)=>idx!==i)); }}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  Remove plan
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <button onClick={()=>setPlans(p=>[...p,emptyPlan()])} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700 active:scale-[.98]">+ Add pricing plan</button>
            <button onClick={save} disabled={saving} className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:-translate-y-0.5 hover:bg-sky-500 active:scale-[.98] disabled:opacity-60">{saving ? "Saving…" : "Save pricing"}</button>
          </div>
          <p className="text-xs text-slate-500">Removed plans are deleted permanently once you click &ldquo;Save pricing&rdquo;.</p>
        </div>
      )}
    </div>
  );
}
