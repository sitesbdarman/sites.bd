"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ServerIcon } from "@/components/dashboard/icons";
import { StatusBadge, type DashboardStatus } from "@/components/dashboard/StatusBadge";

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

/** Maps this table's raw order-status strings onto StatusBadge's shared status set. */
function toStatus(value: string): DashboardStatus {
  if (value === "completed") return "closed";
  if (value === "failed") return "overdue";
  if (value === "cancelled") return "suspended";
  if (value === "pending_payment") return "pending";
  const known: DashboardStatus[] = ["active", "pending", "processing", "expired", "suspended", "paid", "overdue", "closed"];
  return (known as string[]).includes(value) ? (value as DashboardStatus) : "pending";
}

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
      <div className="rounded-[--radius-surface] border border-gray-200 bg-white p-5">
        <EmptyState
          icon={ServerIcon}
          message="You don't have any hosting services yet."
          action={
            <Link href="/pricing" className="mt-1 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700">
              Browse hosting plans
            </Link>
          }
        />
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
        <div className="rounded-[--radius-surface] border border-gray-200 bg-white p-5 text-center text-sm text-gray-500">
          No services match your search.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/services/${order.id}`}
              className="rounded-[--radius-surface] border border-gray-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">Order {order.order_number}</p>
                  <h2 className="mt-1 text-base font-semibold text-blue-600">
                    {order.hosting_plan_name || "Service"}
                  </h2>
                </div>
                <StatusBadge status={toStatus(order.status)} />
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
