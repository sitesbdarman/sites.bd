"use client";
import { useState } from "react";

export function NameserverManager({ domainId, initial }: { domainId: string; initial: string[] }) {
  const [values, setValues] = useState([...initial, "", "", "", ""].slice(0, 4));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const filledCount = values.map((v) => v.trim()).filter(Boolean).length;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const nameservers = values.map((v) => v.trim()).filter(Boolean);
    const r = await fetch(`/api/domains/${domainId}/nameservers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameservers }),
    });
    const d = await r.json();
    setIsError(!r.ok);
    setMessage(r.ok ? "Nameservers saved successfully." : (d.error ?? "Could not save nameservers."));
    setBusy(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900">Nameservers</h2>
          <p className="mt-1 text-xs text-gray-500">Use at least two valid nameservers from your DNS or hosting provider.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${filledCount >= 2 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          {filledCount} of 4 set
        </span>
      </div>

      <form onSubmit={save} className="mt-5 rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((value, i) => (
            <div key={i}>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Nameserver {i + 1}
                {i < 2 && <span className="ml-1 text-red-500">*</span>}
              </label>
              <input
                value={value}
                onChange={(e) => setValues((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={i === 0 ? "e.g. ns1.vercel-dns.com" : i === 1 ? "e.g. ns2.vercel-dns.com" : "Optional"}
                required={i < 2}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Saving…" : "Save Nameservers"}
          </button>
          {message && (
            <p role={isError ? "alert" : undefined} className={`text-sm font-medium ${isError ? "text-red-600" : "text-green-700"}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
