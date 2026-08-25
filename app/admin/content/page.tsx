"use client";
import { useEffect, useState } from "react";

type Item = { id?: string; title?: string; question?: string; answer?: string; description?: string; link_url?: string; active: boolean; sort_order: number };

type Tab = "banners" | "faq" | "social";

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>("banners");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content?type=${tab}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [tab]);

  function update(index: number, patch: Partial<Item>) {
    setItems((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  async function save() {
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: tab, items }),
    });
    const data = await res.json();
    setMsg(data.error || "Content saved successfully.");
    if (res.ok) setItems(data.items || items);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-sky-950 p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Content control</p>
        <h1 className="mt-2 text-3xl font-black">Website Content</h1>
        <p className="mt-2 text-sm text-slate-300">Manage banners, FAQs and social links without editing source code.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["banners", "faq", "social"] as Tab[]).map((name) => (
          <button key={name} onClick={() => setTab(name)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === name ? "bg-sky-600 text-white" : "border bg-white text-slate-700"}`}>
            {name.toUpperCase()}
          </button>
        ))}
      </div>

      {msg && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{msg}</div>}

      {loading ? <div className="rounded-2xl border bg-white p-8 text-slate-500">Loading…</div> : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={item.id || i} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="grid gap-3 md:grid-cols-2">
                {tab === "banners" && <>
                  <input placeholder="Title" value={item.title || ""} onChange={(e) => update(i, { title: e.target.value })} className="rounded-lg border px-3 py-2" />
                  <input placeholder="Link URL" value={item.link_url || ""} onChange={(e) => update(i, { link_url: e.target.value })} className="rounded-lg border px-3 py-2" />
                  <textarea placeholder="Description" value={item.description || ""} onChange={(e) => update(i, { description: e.target.value })} className="rounded-lg border px-3 py-2 md:col-span-2" />
                </>}
                {tab === "faq" && <>
                  <input placeholder="Question" value={item.question || ""} onChange={(e) => update(i, { question: e.target.value })} className="rounded-lg border px-3 py-2 md:col-span-2" />
                  <textarea placeholder="Answer" value={item.answer || ""} onChange={(e) => update(i, { answer: e.target.value })} className="rounded-lg border px-3 py-2 md:col-span-2" />
                </>}
                {tab === "social" && <>
                  <input placeholder="Label" value={item.title || ""} onChange={(e) => update(i, { title: e.target.value })} className="rounded-lg border px-3 py-2" />
                  <input placeholder="URL" value={item.link_url || ""} onChange={(e) => update(i, { link_url: e.target.value })} className="rounded-lg border px-3 py-2" />
                </>}
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={item.active} onChange={(e) => update(i, { active: e.target.checked })} />
                Active
              </label>
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={() => setItems((current) => [...current, { active: true, sort_order: current.length }])} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">Add item</button>
            <button onClick={save} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white">Save changes</button>
          </div>
        </div>
      )}
    </section>
  );
}
