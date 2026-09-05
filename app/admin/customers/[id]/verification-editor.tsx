"use client";
import { useState } from "react";

const STATUS_STYLES: Record<string, string> = {
  verified: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
  unverified: "bg-slate-100 text-slate-600",
};

export function VerificationEditor({ id, initialStatus }: { id: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  async function apply(next: "verified" | "unverified" | "rejected") {
    if (next === "rejected" && !showReason) {
      setShowReason(true);
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/customers/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, reason: next === "rejected" ? reason.trim() : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update verification status.");
      setStatus(next);
      setShowReason(false);
      setReason("");
      setMsg(next === "verified" ? "Customer marked as verified." : next === "rejected" ? "Customer marked as rejected." : "Customer reset to unverified.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not update verification status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[--radius-surface] border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-bold text-slate-500">Identity verification</div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.unverified}`}>
          {status}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Overrides the customer&apos;s account verification directly — use this for customers verified over phone, in
        person, or otherwise, without waiting for a document upload.
      </p>

      {showReason && (
        <div className="mt-3">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejecting (shown to the customer)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          disabled={busy || status === "verified"}
          onClick={() => apply("verified")}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Mark as verified
        </button>
        <button
          disabled={busy || status === "rejected"}
          onClick={() => apply("rejected")}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {showReason ? "Confirm reject" : "Reject"}
        </button>
        <button
          disabled={busy || status === "unverified"}
          onClick={() => apply("unverified")}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
        >
          Reset to unverified
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-slate-500">{msg}</p>}
    </div>
  );
}
