"use client";
import { useMemo, useState } from "react";

export function TicketsContent({ tickets }: { tickets: Array<{ id: string; ticket_number: string; subject: string; status: string; priority: string; created_at: string }> }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState(tickets);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(""); const res = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, message, priority }) }); const data = await res.json(); if (!res.ok || !data.success) { setError(data.error ?? "Something went wrong."); setBusy(false); return; } setItems([{ id: crypto.randomUUID(), ticket_number: data.ticket.ticket_number, subject, status: data.ticket.status, priority, created_at: new Date().toISOString() }, ...items]); setSubject(""); setMessage(""); setPriority("normal"); setOpen(false); setBusy(false); }
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((t) => {
      const matchesQuery = q.length === 0 || t.subject.toLowerCase().includes(q) || t.ticket_number.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);
  return <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets…" aria-label="Search tickets" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-56" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter tickets by status" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-auto">
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <button onClick={() => setOpen(true)} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Create Support Ticket</button>
    </div>
    {open && <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-base font-semibold text-gray-900">Create Support Ticket</h2><form onSubmit={submit} className="mt-4 space-y-4"><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500" /><div className="grid gap-4 sm:grid-cols-2"><select value={priority} onChange={e => setPriority(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue..." required rows={6} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500" />{error && <p className="text-sm text-red-600">{error}</p>}<div className="flex gap-2"><button disabled={busy} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "Creating..." : "Submit Ticket"}</button><button type="button" onClick={() => setOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm">Cancel</button></div></form></div>}
    {!items.length ? <div className="rounded-xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-500">You don&apos;t have any support tickets yet.</div> : filtered.length === 0 ? <div className="rounded-xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-500">No tickets match your search.</div> : <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Ticket</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th></tr></thead><tbody className="divide-y divide-gray-100">{filtered.map(t => <tr key={t.id}><td className="px-5 py-4 font-medium text-gray-900">{t.ticket_number}</td><td className="px-5 py-4 text-gray-700"><a className="text-blue-600 hover:underline" href={`/dashboard/tickets/${t.id}`}>{t.subject}</a></td><td className="px-5 py-4 capitalize text-gray-500">{t.priority}</td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{t.status}</span></td><td className="px-5 py-4 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>}
  </div>;
}
