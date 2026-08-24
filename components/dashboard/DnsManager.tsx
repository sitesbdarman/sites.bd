"use client";

import { useEffect, useState } from "react";

type RecordItem = { id: string; type: string; name: string; content: string; ttl: number; priority: number | null; status: string };

export function DnsManager({ domainId }: { domainId: string }) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ type: "A", name: "@", content: "", ttl: "3600", priority: "" });

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/domains/${domainId}/dns`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) { setRecords(data.records ?? []); setConfigured(Boolean(data.deSecConfigured)); }
    else setMessage(data.error ?? "Could not load DNS records.");
    setLoading(false);
  }
  useEffect(() => { void load(); }, [domainId]);

  async function addRecord(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch(`/api/domains/${domainId}/dns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, ttl: Number(form.ttl), priority: form.priority ? Number(form.priority) : null }) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error ?? "Could not add record.");
    else { setMessage(data.synced ? "DNS record added and synced." : "DNS record saved. deSEC sync will be available after configuration."); setForm({ type: "A", name: "@", content: "", ttl: "3600", priority: "" }); await load(); }
    setBusy(false);
  }

  async function removeRecord(id: string) {
    if (!confirm("Delete this DNS record?")) return;
    setBusy(true); setMessage("");
    const response = await fetch(`/api/domains/${domainId}/dns?recordId=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    setMessage(response.ok ? "DNS record deleted." : data.error ?? "Could not delete record.");
    await load(); setBusy(false);
  }

  return <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold text-gray-900">DNS Records</h2><p className="mt-1 text-xs text-gray-500">Manage A, CNAME, MX, TXT and other DNS records.</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{configured ? "deSEC connected" : "Local mode"}</span></div>
    <form onSubmit={addRecord} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <select value={form.type} onChange={e => setForm({...form, type:e.target.value})} className="rounded-md border border-gray-200 px-3 py-2 text-sm"><option>A</option><option>AAAA</option><option>CNAME</option><option>MX</option><option>TXT</option><option>NS</option></select>
      <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Name / @" className="rounded-md border border-gray-200 px-3 py-2 text-sm" required />
      <input value={form.content} onChange={e => setForm({...form,content:e.target.value})} placeholder="Content" className="rounded-md border border-gray-200 px-3 py-2 text-sm" required />
      <input value={form.ttl} onChange={e => setForm({...form,ttl:e.target.value})} type="number" min="60" max="86400" placeholder="TTL" className="rounded-md border border-gray-200 px-3 py-2 text-sm" required />
      <button disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{busy ? "Saving…" : "Add Record"}</button>
    </form>
    {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
    <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-gray-100 text-xs text-gray-400"><tr><th className="py-2">Type</th><th>Name</th><th>Content</th><th>TTL</th><th>Status</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="py-6 text-center text-gray-500">Loading…</td></tr> : records.length === 0 ? <tr><td colSpan={6} className="py-6 text-center text-gray-500">No DNS records yet.</td></tr> : records.map(record => <tr key={record.id} className="border-b border-gray-50"><td className="py-3 font-semibold">{record.type}</td><td>{record.name}</td><td className="max-w-xs truncate">{record.content}</td><td>{record.ttl}</td><td>{record.status}</td><td className="text-right"><button disabled={busy} onClick={() => void removeRecord(record.id)} className="text-xs font-medium text-red-600 hover:text-red-700">Delete</button></td></tr>)}</tbody></table></div>
  </div>;
}
