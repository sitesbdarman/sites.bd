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
  const isCnameAtRoot = form.type === "CNAME" && (!form.name.trim() || form.name.trim() === "@");

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
    if (form.type === "CNAME" && (!form.name.trim() || form.name.trim() === "@")) {
      setFieldError("A CNAME cannot be used at the root (@). Use an A/AAAA record for the root, or use a subdomain such as www.");
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
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as RecordType, content: "" })}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="A">A</option>
            <option value="AAAA">AAAA</option>
            <option value="CNAME">CNAME</option>
            <option value="MX">MX</option>
            <option value="TXT">TXT</option>
            <option value="NS">NS</option><option value="SRV">SRV</option><option value="CAA">CAA</option><option value="HTTPS">HTTPS</option><option value="TLSA">TLSA</option>
          </select>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name / @"
            aria-label="Record name"
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder={info.placeholder}
            aria-label="Record content"
            className={`rounded-md border bg-white px-3 py-2 text-sm ${liveError ? "border-red-300" : "border-gray-200"}`}
            required
          />
          {isMx && (
            <input
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              type="number"
              min="0"
              max="65535"
              placeholder="Priority"
              aria-label="MX priority"
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
          )}
          <input
            value={form.ttl}
            onChange={(e) => setForm({ ...form, ttl: e.target.value })}
            type="number"
            min="60"
            max="86400"
            placeholder="TTL"
            aria-label="TTL (seconds)"
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            required
          />
          <button disabled={busy || isCnameAtRoot} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Saving…" : "Add Record"}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">{info.hint}</p>
        {isCnameAtRoot && <p className="mt-1 text-xs font-medium text-red-600">A CNAME cannot be used at the root (@). Use A/AAAA for the root or a subdomain such as www.</p>}
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
