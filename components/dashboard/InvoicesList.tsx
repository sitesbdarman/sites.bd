"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InvoiceIcon } from "@/components/dashboard/icons";
import { StatusBadge, type DashboardStatus } from "@/components/dashboard/StatusBadge";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  currency: string;
  total: number | string;
  created_at: string;
  due_at: string | null;
}

const STATUS_OPTIONS = ["all", "unpaid", "paid", "cancelled", "refunded"];

/** Maps this table's raw invoice-status strings onto StatusBadge's shared status set. */
function toStatus(value: string): DashboardStatus {
  if (value === "unpaid") return "pending";
  if (value === "cancelled" || value === "refunded") return "closed";
  const known: DashboardStatus[] = ["active", "pending", "processing", "expired", "suspended", "paid", "overdue", "closed"];
  return (known as string[]).includes(value) ? (value as DashboardStatus) : "pending";
}

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesQuery = q.length === 0 || inv.invoice_number.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, query, statusFilter]);

  if (invoices.length === 0) {
    return (
      <div className="overflow-hidden rounded-[--radius-surface] border border-gray-200 bg-white">
        <EmptyState icon={InvoiceIcon} message="You don't have any invoices yet." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search invoices…"
          aria-label="Search invoices"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter invoices by status"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-auto"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[--radius-surface] border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          No invoices match your search.
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-[--radius-surface] border border-gray-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-medium text-gray-500">
                  <tr className="border-b border-gray-200">
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        <Link className="text-blue-600 hover:underline" href={`/dashboard/invoices/${invoice.id}`}>
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{new Date(invoice.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-gray-900">
                        {invoice.currency} {Number(invoice.total).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={toStatus(invoice.status)} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        {invoice.status === "unpaid" && (
                          <Link
                            href={`/checkout/payment?invoice=${invoice.id}`}
                            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                          >
                            Pay Now
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((invoice) => (
              <div key={invoice.id} className="rounded-[--radius-surface] border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="truncate text-sm font-semibold text-blue-600">
                    {invoice.invoice_number}
                  </Link>
                  <StatusBadge status={toStatus(invoice.status)} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-gray-400">Date</dt>
                    <dd className="mt-0.5 text-gray-600">{new Date(invoice.created_at).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Amount</dt>
                    <dd className="mt-0.5 font-semibold text-gray-900">{invoice.currency} {Number(invoice.total).toFixed(2)}</dd>
                  </div>
                </dl>
                {invoice.status === "unpaid" && (
                  <Link
                    href={`/checkout/payment?invoice=${invoice.id}`}
                    className="mt-3 inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    Pay Now
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
