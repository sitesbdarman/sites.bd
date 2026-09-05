"use client";
import { useMemo, useState } from "react";

type Domain = {
  id: string;
  domain_name: string;
  status: string;
  auto_renew: boolean;
  registered_at: string | null;
  expires_at: string | null;
  owner_id: string;
};

type Owner = { id: string; customer_id: string; email: string; full_name: string | null };

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  suspended: "bg-red-50 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};

export function DomainManager({ initialDomains, owners, defaultOwnerId }: { initialDomains: Domain[]; owners: Owner[]; defaultOwnerId?: string }) {
  const [domains, setDomains] = useState(initialDomains);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ownerId: defaultOwnerId || "", domainName: "", status: "active", autoRenew: false, expiresAt: "" });
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredDomains = useMemo(() => domains.filter(d => (!query || `${d.domain_name} ${d.owner_id}`.toLowerCase().includes(query.toLowerCase())) && (statusFilter === "all" || d.status === statusFilter)), [domains, query, statusFilter]);

  function ownerLabel(id: string) {
    const o = owners.find((x) => x.id === id);
    return o ? `${o.customer_id} — ${o.email}` : id;
  }

  async function createDomain() {
    setError("");
    if (!form.ownerId) return setError("Select a customer.");
    if (!form.domainName.trim()) return setError("Enter a domain name.");
    setCreating(true);
    try {
      const r = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: form.ownerId,
          domainName: form.domainName.trim(),
          status: form.status,
          autoRenew: form.autoRenew,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || "Could not add the domain.");
      setDomains([d.domain, ...domains]);
      setForm({ ...form, domainName: "", expiresAt: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the domain.");
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(d: Domain, status: string) {
    setBusyId(d.id);
    try {
      const r = await fetch(`/api/admin/domains/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const res = await r.json();
      if (r.ok && res.success) setDomains(domains.map((x) => (x.id === d.id ? res.domain : x)));
      else setError(res.error || "Could not update the domain.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeDomain(d: Domain) {
    if (!confirm(`Remove ${d.domain_name} from this customer's account? This cannot be undone.`)) return;
    setBusyId(d.id);
    try {
      const r = await fetch(`/api/admin/domains/${d.id}`, { method: "DELETE" });
      const res = await r.json();
      if (r.ok && res.success) setDomains(domains.filter((x) => x.id !== d.id));
      else setError(res.error || "Could not remove the domain.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Domains</h1>
      <p className="mt-1 text-sm text-gray-500">Assign a domain to any customer, or suspend / expire / remove an existing one.</p>

      <div className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Add domain to a customer</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select className="rounded-md border px-3 py-2 lg:col-span-2" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
            <option value="">Select customer…</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.customer_id} — {o.email}
              </option>
            ))}
          </select>
          <input className="rounded-md border px-3 py-2" placeholder="example.com" value={form.domainName} onChange={(e) => setForm({ ...form, domainName: e.target.value })} />
          <select className="rounded-md border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>
          <input className="rounded-md border px-3 py-2" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} title="Expiry date (optional)" />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={form.autoRenew} onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })} />
          Auto renewal enabled
        </label>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button disabled={creating} onClick={createDomain} className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {creating ? "Adding…" : "Add Domain"}
        </button>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-4"><div className="grid gap-3 sm:grid-cols-2"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search domain or owner ID" className="rounded-xl border px-4 py-3"/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="rounded-xl border px-4 py-3"><option value="all">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="expired">Expired</option></select></div></div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              {["Domain", "Owner", "Status", "Auto Renew", "Registered", "Expires", "Actions"].map((x) => (
                <th key={x} className="px-5 py-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredDomains.map((d) => (
              <tr key={d.id}>
                <td className="px-5 py-4 font-medium">{d.domain_name}</td>
                <td className="px-5 py-4 text-xs">{ownerLabel(d.owner_id)}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[d.status] || "bg-gray-100 text-gray-600"}`}>{d.status}</span>
                </td>
                <td className="px-5 py-4">{d.auto_renew ? "Yes" : "No"}</td>
                <td className="px-5 py-4">{d.registered_at ? new Date(d.registered_at).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-4">{d.expires_at ? new Date(d.expires_at).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {d.status !== "active" && (
                      <button disabled={busyId === d.id} onClick={() => updateStatus(d, "active")} className="rounded border px-3 py-1 disabled:opacity-50">
                        Activate
                      </button>
                    )}
                    {d.status !== "suspended" && (
                      <button disabled={busyId === d.id} onClick={() => updateStatus(d, "suspended")} className="rounded border border-amber-200 px-3 py-1 text-amber-700 disabled:opacity-50">
                        Suspend
                      </button>
                    )}
                    {d.status !== "expired" && (
                      <button disabled={busyId === d.id} onClick={() => updateStatus(d, "expired")} className="rounded border border-gray-200 px-3 py-1 text-gray-600 disabled:opacity-50">
                        Mark Expired
                      </button>
                    )}
                    <button disabled={busyId === d.id} onClick={() => removeDomain(d)} className="rounded border border-red-200 px-3 py-1 text-red-600 disabled:opacity-50">
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {domains.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                  No domains yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
