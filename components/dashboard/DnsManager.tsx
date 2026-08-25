"use client";

import { useEffect, useMemo, useState } from "react";

type RecordItem = { id: string; type: string; name: string; content: string; ttl: number; priority: number | null; status: string };
type RecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA" | "HTTPS" | "TLSA";

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
    hint: "Aliases this name to another hostname. Only one CNAME is allowed per name — adding a new one replaces the old one.",
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
  SRV: {
    placeholder: "e.g. 10 5 443 target.example.com.",
    hint: "Format: priority weight port target. Keep the target as a hostname.",
  },
  CAA: {
    placeholder: 'e.g. 0 issue "letsencrypt.org"',
    hint: "Certificate Authority Authorization value.",
  },
  HTTPS: {
    placeholder: 'e.g. 1 . alpn="h2,h3"',
    hint: "HTTPS service binding record for advanced configurations.",
  },
  TLSA: {
    placeholder: "e.g. 3 1 1 <certificate-hash>",
    hint: "TLSA certificate association record for DANE.",
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

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/domains/${domainId}/dns`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) { setRecords(data.records ?? []); setConfigured(Boolean(data.deSecConfigured)); }
    else setFeedback({ kind: "error", text: data.error ?? "Could not load DNS records." });
    setLoading(false);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load for this domain; re-runs only when the domain changes.
    void load();
  }, [domainId]);

  const info = TYPE_INFO[form.type];
  const isMx = form.type === "MX";

  const liveError = useMemo(() => {
    if (!form.content.trim() || !info.validate) return null;
    return info.validate(form.content);
  }, [form.content, info]);

  async function addRecord(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setFieldError(null);

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
          <h2 className="text-base font-bold text-gray-900">DNS Records</h2>
          <p className="mt-1 text-xs text-gray-500">Manage A, CNAME, MX, TXT and other DNS records for this domain.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          {configured ? "● deSEC connected" : "● Local mode"}
        </span>
      </div>

      <form onSubmit={addRecord} className="mt-5 rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">
        <p className="mb-4 text-sm font-semibold text-gray-800">Add a new record</p>
        <div className={`grid gap-4 sm:grid-cols-2 ${isMx ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Record Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as RecordType, content: "" })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="A">A — IPv4 address</option>
              <option value="AAAA">AAAA — IPv6 address</option>
              <option value="CNAME">CNAME — Alias</option>
              <option value="MX">MX — Mail server</option>
              <option value="TXT">TXT — Text value</option>
              <option value="NS">NS — Nameserver</option>
              <option value="SRV">SRV — Service</option>
              <option value="CAA">CAA — Cert authority</option>
              <option value="HTTPS">HTTPS — Service binding</option>
              <option value="TLSA">TLSA — DANE</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Name / Host</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="@ for root, or www"
              aria-label="Record name"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
            <p className="mt-1 text-[11px] text-gray-400">Use &quot;@&quot; for the root domain, or a subdomain like &quot;www&quot;.</p>
          </div>

          <div className={isMx ? "" : "sm:col-span-2 lg:col-span-1"}>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Value</label>
            <input
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={info.placeholder}
              aria-label="Record content"
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 ${liveError ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"}`}
              required
            />
          </div>

          {isMx && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Priority</label>
              <input
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                type="number"
                min="0"
                max="65535"
                placeholder="10"
                aria-label="MX priority"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">TTL (seconds)</label>
            <select
              value={form.ttl}
              onChange={(e) => setForm({ ...form, ttl: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="300">5 minutes</option>
              <option value="1800">30 minutes</option>
              <option value="3600">1 hour (recommended)</option>
              <option value="14400">4 hours</option>
              <option value="86400">24 hours</option>
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">{info.hint}</p>
        {(fieldError || liveError) && (
          <p role="alert" className="mt-1 text-xs font-medium text-red-600">{fieldError ?? liveError}</p>
        )}

        <div className="mt-4">
          <button disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Saving…" : "+ Add Record"}
          </button>
        </div>
      </form>

      {feedback && (
        <div
          role={feedback.kind === "error" ? "alert" : undefined}
          className={`mt-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
            feedback.kind === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-gray-800">Current records</p>
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Value</th>
                <th className="px-3 py-2.5">Priority</th>
                <th className="px-3 py-2.5">TTL</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="py-6 text-center text-gray-500">Loading…</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center text-gray-500">No DNS records yet. Add your first record above.</td></tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-3 font-semibold text-gray-900">{record.type}</td>
                    <td className="px-3 py-3 text-gray-700">{record.name}</td>
                    <td className="max-w-xs truncate px-3 py-3 text-gray-700">{record.content}</td>
                    <td className="px-3 py-3 text-gray-500">{record.priority ?? "—"}</td>
                    <td className="px-3 py-3 text-gray-500">{record.ttl}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${record.status === "active" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
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
    </div>
  );
}
