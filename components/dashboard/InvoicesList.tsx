"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InvoiceIcon } from "@/components/dashboard/icons";

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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-gray-500">No invoices match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((invoice) => (
                  <tr key={invoice.id}>
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
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          invoice.status === "paid"
                            ? "bg-green-50 text-green-700"
                            : invoice.status === "cancelled"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
