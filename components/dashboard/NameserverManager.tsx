"use client";

import { useMemo, useState } from "react";

const HOSTNAME_RE = /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*\.[a-zA-Z]{2,}$/;

interface NameserverManagerProps {
  domainId: string;
  initial: string[];
}

export function NameserverManager({ domainId, initial }: NameserverManagerProps) {
  const [values, setValues] = useState<string[]>(() => {
    const padded = [...initial, "", "", "", ""].slice(0, Math.max(4, initial.length));
    return padded;
  });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const trimmed = useMemo(() => values.map((v) => v.trim()), [values]);
  const filledCount = trimmed.filter(Boolean).length;

  const rowError = useMemo(() => {
    return trimmed.map((v) => {
      if (!v) return null;
      return HOSTNAME_RE.test(v) ? null : "Enter a valid hostname, e.g. ns1.yourprovider.com.";
    });
  }, [trimmed]);

  const hasFieldErrors = rowError.some(Boolean);
  const notEnough = filledCount < 2;

  function updateValue(index: number, value: string) {
    setValues((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function addField() {
    if (values.length >= 8) return;
    setValues((prev) => [...prev, ""]);
  }

  function removeField(index: number) {
    setValues((prev) => (prev.length <= 4 ? prev.map((v, i) => (i === index ? "" : v)) : prev.filter((_, i) => i !== index)));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);

    const nameservers = trimmed.filter(Boolean);
    if (nameservers.length < 2) {
      setFeedback({ kind: "error", text: "Enter at least two nameservers before saving." });
      return;
    }
    if (hasFieldErrors) {
      setFeedback({ kind: "error", text: "Fix the highlighted nameserver(s) before saving." });
      return;
    }

    setBusy(true);
    const response = await fetch(`/api/domains/${domainId}/nameservers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameservers }),
    });
    const data = await response.json();
    setFeedback(
      response.ok
        ? { kind: "success", text: "Nameservers saved. Propagation can take up to 24-48 hours." }
        : { kind: "error", text: data.error ?? "Could not save nameservers." }
    );
    setBusy(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Nameservers</h2>
        <p className="mt-1 text-xs text-gray-500">
          Enter at least two nameservers supplied by your DNS or hosting provider (e.g. <span className="font-mono">ns1.yourprovider.com</span>).
        </p>
      </div>

      <form onSubmit={save} className="mt-4 space-y-3">
        {values.map((value, i) => (
          <div key={i}>
            <label htmlFor={`ns-${i}`} className="mb-1 block text-xs font-semibold text-gray-600">
              Nameserver {i + 1}
              {i < 2 && <span className="ml-1 text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
              <input
                id={`ns-${i}`}
                value={value}
                onChange={(e) => updateValue(i, e.target.value)}
                placeholder={i === 0 ? "ns1.yourprovider.com" : i === 1 ? "ns2.yourprovider.com" : "Optional"}
                aria-label={`Nameserver ${i + 1}`}
                className={`block w-full rounded-md border bg-white px-3 py-2 text-sm ${
                  rowError[i] ? "border-red-300" : "border-gray-200"
                }`}
              />
              {values.length > 4 || (i >= 2 && value) ? (
                <button
                  type="button"
                  onClick={() => removeField(i)}
                  aria-label={`Remove nameserver ${i + 1}`}
                  className="shrink-0 rounded-md border border-gray-200 px-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600"
                >
                  ✕
                </button>
              ) : null}
            </div>
            {rowError[i] && <p className="mt-1 text-xs font-medium text-red-600">{rowError[i]}</p>}
          </div>
        ))}

        {values.length < 8 && (
          <button
            type="button"
            onClick={addField}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            + Add another nameserver
          </button>
        )}

        <div className="pt-2">
          <button
            disabled={busy || notEnough || hasFieldErrors}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Saving…" : "Save Nameservers"}
          </button>
          {notEnough && (
            <p className="mt-2 text-xs text-gray-500">Add at least 2 nameservers to enable saving.</p>
          )}
        </div>

        {feedback && (
          <div
            role={feedback.kind === "error" ? "alert" : undefined}
            className={`rounded-md px-3 py-2 text-sm ${
              feedback.kind === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </form>
    </div>
  );
}
