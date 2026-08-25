"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ServerIcon } from "@/components/dashboard/icons";

interface ServiceOrder {
  id: string;
  order_number: string;
  status: string;
  hosting_plan_name: string | null;
  hosting_billing_cycle: string | null;
  hosting_price: number | string;
  created_at: string;
}

const STATUS_OPTIONS = ["all", "active", "processing", "completed", "cancelled", "failed", "pending_payment"];

export function ServicesList({ orders }: { orders: ServiceOrder[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesQuery =
        q.length === 0 ||
        (o.hosting_plan_name ?? "").toLowerCase().includes(q) ||
        o.order_number.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <EmptyState icon={ServerIcon} message="You don't have any hosting services yet." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services…"
          aria-label="Search services"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter services by status"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-auto"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-500">
          No services match your search.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((order) => (
            <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">Order {order.order_number}</p>
                  <h2 className="mt-1 text-base font-semibold text-gray-900">
                    <a className="text-blue-600 hover:underline" href={`/dashboard/services/${order.id}`}>
                      {order.hosting_plan_name}
                    </a>
                  </h2>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {order.status}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Billing</p>
                  <p className="mt-1 text-gray-700">{order.hosting_billing_cycle ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Price</p>
                  <p className="mt-1 text-gray-700">BDT {Number(order.hosting_price).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
