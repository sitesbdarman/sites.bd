"use client";

import { useState } from "react";

interface VerificationItem {
  id: string;
  userId: string;
  customerId: string | null;
  fullName: string | null;
  email: string | null;
  docType: string;
  status: string;
  submittedAt: string;
  fileUrl: string | null;
}

function ReviewRow({ item, onDone }: { item: VerificationItem; onDone: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showReasonFor, setShowReasonFor] = useState<"reject" | null>(null);
  const [reason, setReason] = useState("");

  async function act(action: "approve" | "reject") {
    if (action === "reject" && showReasonFor !== "reject") {
      setShowReasonFor("reject");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verifications/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action, reason: action === "reject" ? reason.trim() : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      onDone(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-slate-500">Customer</span>
          <p className="font-semibold">{item.fullName || item.email || item.customerId || item.userId}</p>
        </div>
        <div>
          <span className="text-slate-500">Document type</span>
          <p className="font-semibold uppercase">{item.docType}</p>
        </div>
        <div>
          <span className="text-slate-500">Submitted</span>
          <p className="font-semibold">{new Date(item.submittedAt).toLocaleString()}</p>
        </div>
        <div>
          <span className="text-slate-500">File</span>
          {item.fileUrl ? (
            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="block font-semibold text-blue-600 hover:underline">
              View document
            </a>
          ) : (
            <p className="font-semibold text-slate-400">Unavailable</p>
          )}
        </div>
      </div>

      {showReasonFor === "reject" && (
        <div className="mt-3">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejecting (shown to the customer)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button disabled={busy} onClick={() => act("approve")} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          Approve
        </button>
        <button disabled={busy} onClick={() => act("reject")} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {showReasonFor === "reject" ? "Confirm reject" : "Reject"}
        </button>
      </div>
    </div>
  );
}

export function VerificationReviewList({ initialItems }: { initialItems: VerificationItem[] }) {
  const [items, setItems] = useState(initialItems);

  return (
    <div className="rounded-[--radius-surface] border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-black">Pending submissions</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No verification requests waiting for review.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <ReviewRow key={item.id} item={item} onDone={(id) => setItems((xs) => xs.filter((x) => x.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}
