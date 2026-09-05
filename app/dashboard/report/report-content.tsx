"use client";

import { useState } from "react";
import Link from "next/link";

const REPORT_CATEGORIES = [
  "Bug / technical issue",
  "Billing or payment problem",
  "Abuse or inappropriate content",
  "Account or security concern",
  "Something else",
] as const;

/**
 * Lets any signed-in customer file a report from the dashboard sidebar.
 * Reuses the existing support-ticket pipeline (POST /api/tickets) instead of
 * a new table — the subject is tagged "[Report]" so it's easy to spot in
 * the customer's ticket list and in the admin support queue.
 */
export function ReportContent() {
  const [category, setCategory] = useState<(typeof REPORT_CATEGORIES)[number]>(REPORT_CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{ ticketNumber: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fullSubject = `[Report] ${category}${subject.trim() ? `: ${subject.trim()}` : ""}`;
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: fullSubject, message, priority: "high" }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setBusy(false);
      return;
    }
    setSubmitted({ ticketNumber: data.ticket.ticket_number });
    setSubject("");
    setMessage("");
    setBusy(false);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <h2 className="text-base font-semibold text-gray-900">Report submitted</h2>
        <p className="mt-2 text-sm text-gray-600">
          Thanks — our team has received your report as ticket{" "}
          <span className="font-semibold text-gray-900">{submitted.ticketNumber}</span> and will follow up soon.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/dashboard/tickets" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            View my tickets
          </Link>
          <button
            type="button"
            onClick={() => setSubmitted(null)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Submit another report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Spotted a bug, a billing issue, or something that needs our attention? Let us know below and our team
        will look into it.
      </p>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="report-category" className="mb-1 block text-sm font-medium text-gray-700">
              What is this about?
            </label>
            <select
              id="report-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof REPORT_CATEGORIES)[number])}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            >
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="report-subject" className="mb-1 block text-sm font-medium text-gray-700">
              Short summary
            </label>
            <input
              id="report-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Invoice #1234 charged twice"
              required
              minLength={3}
              maxLength={150}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label htmlFor="report-message" className="mb-1 block text-sm font-medium text-gray-700">
              Details
            </label>
            <textarea
              id="report-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what happened, including any relevant links, order numbers, or screenshots you can describe."
              required
              minLength={5}
              maxLength={5000}
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {busy ? "Submitting..." : "Submit report"}
          </button>
        </form>
      </div>
    </div>
  );
}
