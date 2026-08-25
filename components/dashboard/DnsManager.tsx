"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RecordItem = { id: string; type: string; name: string; content: string; ttl: number; priority: number | null; status: string };
type RecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[0-9a-fA-F:]+$/;
const HOSTNAME_RE = /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*\.?$/;

const TYPE_INFO: Record<RecordType, { placeholder: string; hint: string; validate?: (v: string) => string | null }> = {
  A: {
    placeholder: "e.g. 192.0.2.10",
    hint: "Points this name to an IPv4 address.",
    validate: (v) => (IPV4_RE.test(v.trim()) ? null : "Enter a valid IPv4 address, e.g. 192.0.2.10."),
  },
  AAAA: {
    placeholder: "e.g. 2606:4700:4700::1111",
    hint: "Points this name to an IPv6 address.",
    validate: (v) => (IPV6_RE.test(v.trim()) && v.includes(":") ? null : "Enter a valid IPv6 address."),
  },
  CNAME: {
    placeholder: "e.g. yourapp.vercel-dns.com",
    hint: "Aliases this name to another hostname. Only one CNAME is allowed per name — adding a new one replaces the old one. Can't be used at the root (@); use A/AAAA there instead.",
    validate: (v) => (HOSTNAME_RE.test(v.trim()) ? null : "Enter a valid hostname, e.g. yourapp.vercel-dns.com."),
  },
  MX: {
    placeholder: "e.g. mail.example.com",
    hint: "Mail server hostname. Set the priority (lower number = tried first).",
    validate: (v) => (HOSTNAME_RE.test(v.trim()) ? null : "Enter a valid mail server hostname."),
  },
  TXT: {
    placeholder: "e.g. v=spf1 include:_spf.example.com ~all",
    hint: "Free-text value, often used for domain verification or SPF/DKIM.",
  },
  NS: {
    placeholder: "e.g. ns1.example.com",
    hint: "Delegates this subdomain to another nameserver.",
    validate: (v) => (HOSTNAME_RE.test(v.trim()) ? null : "Enter a valid nameserver hostname."),
  },
};

export function DnsManager({ domainId }: { domainId: string }) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "A" as RecordType, name: "@", content: "", ttl: "3600", priority: "10" });

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/domains/${domainId}/dns`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) { setRecords(data.records ?? []); setConfigured(Boolean(data.deSecConfigured)); }
    else setFeedback({ kind: "error", text: data.error ?? "Could not load DNS records." });
    setLoading(false);
  }, [domainId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load for this domain; re-runs only when the domain changes.
    void load();
  }, [load]);

  const info = TYPE_INFO[form.type];
  const isMx = form.type === "MX";
  const isApexName = form.name.trim() === "@" || form.name.trim() === "";
  const isApexCname = form.type === "CNAME" && isApexName;

  const liveError = useMemo(() => {
    if (isApexCname) return "A CNAME can't be used at the root domain (@) — that name always needs NS records for the domain to work. Use an A or AAAA record for the root, or add the CNAME on a subdomain (e.g. `www`) instead.";
    if (!form.content.trim() || !info.validate) return null;
    return info.validate(form.content);
  }, [form.content, info, isApexCname]);

  async function addRecord(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setFieldError(null);

    if (isApexCname) {
      setFieldError("A CNAME can't be used at the root domain (@). Use an A or AAAA record for the root, or move this CNAME to a subdomain.");
      return;
    }

    const validationError = info.validate?.(form.content);
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    if (isMx) {
      const priorityNum = Number(form.priority);
      if (!Number.isInteger(priorityNum) || priorityNum < 0 || priorityNum > 65535) {
        setFieldError("Priority must be a whole number between 0 and 65535.");
        return;
      }
    }

    setBusy(true);
    const response = await fetch(`/api/domains/${domainId}/dns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        name: form.name,
        content: form.content,
        ttl: Number(form.ttl),
        priority: isMx ? Number(form.priority) : null,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setFeedback({ kind: "error", text: data.error ?? "Could not add record." });
    } else {
      setFeedback({
        kind: "success",
        text: data.synced ? "DNS record added and synced." : "DNS record saved. deSEC sync will be available after configuration.",
      });
      setForm({ type: "A", name: "@", content: "", ttl: "3600", priority: "10" });
      await load();
    }
    setBusy(false);
  }

  async function removeRecord(id: string) {
    if (!confirm("Delete this DNS record?")) return;
    setBusy(true);
    setFeedback(null);
    const response = await fetch(`/api/domains/${domainId}/dns?recordId=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    setFeedback(response.ok ? { kind: "success", text: "DNS record deleted." } : { kind: "error", text: data.error ?? "Could not delete record." });
    await load();
    setBusy(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">DNS Records</h2>
          <p className="mt-1 text-xs text-gray-500">Manage A, CNAME, MX, TXT and other DNS records.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          {configured ? "deSEC connected" : "Local mode"}
        </span>
      </div>

      <form onSubmit={addRecord} className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-4">
        <div className={`grid gap-3 sm:grid-cols-2 ${isMx ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}>
          <div>
            <label htmlFor="dns-type" className="mb-1 block text-xs font-semibold text-gray-600">Type</label>
            <div className="relative">
              <select
                id="dns-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as RecordType, content: "" })}
                className="w-full min-w-[100px] appearance-none rounded-md border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm leading-normal"
              >
                <option value="A">A</option>
                <option value="AAAA">AAAA</option>
                <option value="CNAME">CNAME</option>
                <option value="MX">MX</option>
                <option value="TXT">TXT</option>
                <option value="NS">NS</option>
              </select>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">
                <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div>
            <label htmlFor="dns-name" className="mb-1 block text-xs font-semibold text-gray-600">Name</label>
            <input
              id="dns-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="@"
              aria-label="Record name"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>
          <div className={isMx ? "" : "sm:col-span-2 lg:col-span-1"}>
            <label htmlFor="dns-content" className="mb-1 block text-xs font-semibold text-gray-600">Value</label>
            <input
              id="dns-content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={info.placeholder}
              aria-label="Record content"
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm ${liveError ? "border-red-300" : "border-gray-200"}`}
              required
            />
          </div>
          {isMx && (
            <div>
              <label htmlFor="dns-priority" className="mb-1 block text-xs font-semibold text-gray-600">Priority</label>
              <input
                id="dns-priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                type="number"
                min="0"
                max="65535"
                placeholder="10"
                aria-label="MX priority"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="dns-ttl" className="mb-1 block text-xs font-semibold text-gray-600">TTL (sec)</label>
            <input
              id="dns-ttl"
              value={form.ttl}
              onChange={(e) => setForm({ ...form, ttl: e.target.value })}
              type="number"
              min="60"
              max="86400"
              placeholder="3600"
              aria-label="TTL (seconds)"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex items-end">
            <button disabled={busy || isApexCname} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {busy ? "Saving…" : "Add Record"}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">{info.hint}</p>
        {(fieldError || liveError) && (
          <p className="mt-1 text-xs font-medium text-red-600">{fieldError ?? liveError}</p>
        )}
      </form>

      {feedback && (
        <div
          role={feedback.kind === "error" ? "alert" : undefined}
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            feedback.kind === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-gray-100 text-xs text-gray-400">
            <tr>
              <th className="py-2">Type</th>
              <th>Name</th>
              <th>Content</th>
              <th>Priority</th>
              <th>TTL</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-6 text-center text-gray-500">Loading…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="py-6 text-center text-gray-500">No DNS records yet.</td></tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="border-b border-gray-50">
                  <td className="py-3 font-semibold">{record.type}</td>
                  <td>{record.name}</td>
                  <td className="max-w-xs truncate">{record.content}</td>
                  <td>{record.priority ?? "—"}</td>
                  <td>{record.ttl}</td>
                  <td>{record.status}</td>
                  <td className="text-right">
                    <button disabled={busy} onClick={() => void removeRecord(record.id)} className="text-xs font-medium text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
