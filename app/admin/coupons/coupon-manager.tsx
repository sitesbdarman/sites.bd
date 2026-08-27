"use client";
import { useMemo, useState } from "react";

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number | string;
  min_order_amount: number | string;
  max_discount_amount: number | string | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  active: boolean;
  created_at: string;
};

const emptyForm = {
  code: "",
  discountType: "percent",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  active: true,
};

export function CouponManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const filtered = useMemo(
    () =>
      coupons.filter(
        (c) =>
          (!q || c.code.toLowerCase().includes(q.toLowerCase())) &&
          (status === "all" || (status === "active" ? c.active : !c.active))
      ),
    [coupons, q, status]
  );

  async function toggle(c: Coupon) {
    setBusy(true);
    const r = await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    const d = await r.json();
    if (r.ok) setCoupons((xs) => xs.map((x) => (x.id === c.id ? d.coupon : x)));
    setBusy(false);
  }

  async function remove(c: Coupon) {
    if (!confirm(`Delete ${c.code}?`)) return;
    setBusy(true);
    const r = await fetch(`/api/admin/coupons?id=${c.id}`, { method: "DELETE" });
    if (r.ok) setCoupons((xs) => xs.filter((x) => x.id !== c.id));
    setBusy(false);
  }

  async function createCoupon() {
    setFormError("");
    if (!form.code.trim()) return setFormError("Coupon code is required.");
    if (!form.discountValue || Number(form.discountValue) <= 0) return setFormError("Enter a valid discount value.");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: form.minOrderAmount === "" ? 0 : Number(form.minOrderAmount),
          maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
          startsAt: form.startsAt || null,
          endsAt: form.endsAt || null,
          usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
          active: form.active,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || "Could not create coupon.");
      setCoupons((xs) => [d.coupon, ...xs]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not create coupon.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const csv = [
      ["Code", "Type", "Value", "Min Order", "Usage", "Status"],
      ...filtered.map((c) => [
        c.code,
        c.discount_type,
        c.discount_value,
        c.min_order_amount,
        `${c.usage_count}/${c.usage_limit ?? "∞"}`,
        c.active ? "active" : "disabled",
      ]),
    ]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sites-bd-coupons.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Coupons</h1>
          <p className="mt-1 text-sm text-slate-500">Create, search, export and manage promotional codes.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="rounded-xl border px-4 py-2.5 text-sm font-bold">Export CSV</button>
          <button
            onClick={() => { setShowForm((s) => !s); setFormError(""); }}
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500"
          >
            {showForm ? "Cancel" : "+ New coupon"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">New coupon</h2>
          {formError && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{formError}</div>}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="sm:col-span-1">
              <span className="text-xs font-bold text-slate-500">Code</span>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25" className="mt-1 w-full rounded-lg border px-3 py-2.5" />
            </label>
            <label>
              <span className="text-xs font-bold text-slate-500">Discount type</span>
              <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2.5">
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed amount (BDT)</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-bold text-slate-500">Discount value</span>
              <input type="number" min="0" step="0.01" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2.5" />
            </label>
            <label>
              <span className="text-xs font-bold text-slate-500">Minimum order (BDT)</span>
              <input type="number" min="0" step="0.01" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2.5" />
            </label>
            <label>
              <span className="text-xs font-bold text-slate-500">Max discount (optional)</span>
              <input type="number" min="0" step="0.01" value={form.maxDiscountAmount} onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2.5" />
            </label>
            <label>
              <span className="text-xs font-bold text-slate-500">Usage limit (optional)</span>
              <input type="number" min="1" step="1" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2.5" />
            </label>
            <label>
              <span className="text-xs font-bold text-slate-500">Starts at (optional)</span>
              <input type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2.5" />
            </label>
            <label>
              <span className="text-xs font-bold text-slate-500">Ends at (optional)</span>
              <input type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2.5" />
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4" />
              <span className="text-sm font-semibold">Active immediately</span>
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button disabled={busy} onClick={createCoupon} className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 disabled:opacity-60">
              {busy ? "Creating…" : "Create coupon"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 shadow-sm grid gap-3 sm:grid-cols-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coupon code" className="rounded-xl border px-4 py-3" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-4 py-3">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>{["Code", "Discount", "Minimum", "Usage", "Status", "Actions"].map((x) => <th key={x} className="px-5 py-3">{x}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-4 font-semibold">{c.code}</td>
                <td className="px-5 py-4">{c.discount_type === "percent" ? `${c.discount_value}%` : `BDT ${Number(c.discount_value).toFixed(2)}`}</td>
                <td className="px-5 py-4">BDT {Number(c.min_order_amount).toFixed(2)}</td>
                <td className="px-5 py-4">{c.usage_count} / {c.usage_limit ?? "∞"}</td>
                <td className="px-5 py-4">{c.active ? "Active" : "Disabled"}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button disabled={busy} onClick={() => toggle(c)} className="rounded-lg border px-3 py-1.5">{c.active ? "Disable" : "Enable"}</button>
                    <button disabled={busy} onClick={() => remove(c)} className="rounded-lg border border-red-200 px-3 py-1.5 text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No coupons found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
