"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Domain } from "@/lib/domains/queries";
import { StatusBadge, type DashboardStatus } from "./StatusBadge";
import { EmptyState } from "./EmptyState";
import { GlobeIcon, SearchIcon, ChevronRightIcon } from "./icons";

interface DomainListProps {
  domains: Domain[];
}

const STATUS_FILTERS: Array<{ label: string; value: Domain["status"] | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Expired", value: "expired" },
  { label: "Suspended", value: "suspended" },
];

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(value: string | null): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

/** Small colored "X days left" chip — only rendered when a domain is genuinely close to expiring. */
function ExpiryChip({ expiresAt, status }: { expiresAt: string | null; status: string }) {
  if (status !== "active") return null;
  const days = daysUntil(expiresAt);
  if (days === null || days < 0 || days > 30) return null;
  const urgent = days <= 7;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
        urgent ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {days === 0 ? "Expires today" : `${days}d left`}
    </span>
  );
}

/**
 * Client-side search + status filter over a domain list that was already
 * loaded server-side. Deliberately simple: no server round-trips, no new
 * API — just filtering an array already in memory, per the "keep this
 * simple for the current stage" scope for this page.
 */
export function DomainList({ domains }: DomainListProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Domain["status"] | "all">("all");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return domains.filter((domain) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        domain.domain_name.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || domain.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [domains, query, statusFilter]);

  if (domains.length === 0) {
    return (
      <EmptyState
        icon={GlobeIcon}
        message="You don't have any domains yet."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search domains…"
            aria-label="Search domains by name"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as Domain["status"] | "all")
          }
          aria-label="Filter domains by status"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:w-auto"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={GlobeIcon} message="No domains found." />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Domain
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Registered
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Auto-renew
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((domain) => (
                  <DomainRow key={domain.id} domain={domain} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {filtered.map((domain) => (
              <DomainCard key={domain.id} domain={domain} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DomainRow({ domain }: { domain: Domain }) {
  const registered = formatDate(domain.registered_at);
  const expires = formatDate(domain.expires_at);

  return (
    <tr className="group cursor-pointer transition hover:bg-blue-50/40">
      <td className="whitespace-nowrap p-0">
        <Link href={`/dashboard/domains/${domain.id}`} className="flex items-center gap-2 px-4 py-3.5 text-sm font-black text-slate-900 group-hover:text-blue-700">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
            <GlobeIcon className="h-4 w-4" />
          </span>
          {domain.domain_name}
        </Link>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5">
        <Link href={`/dashboard/domains/${domain.id}`} className="block">
          <StatusBadge status={domain.status as DashboardStatus} />
        </Link>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
        <Link href={`/dashboard/domains/${domain.id}`} className="block">{registered ?? "—"}</Link>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
        <Link href={`/dashboard/domains/${domain.id}`} className="flex items-center gap-2">
          {expires ?? "—"}
          <ExpiryChip expiresAt={domain.expires_at} status={domain.status} />
        </Link>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
        <Link href={`/dashboard/domains/${domain.id}`} className="block">{domain.auto_renew ? "On" : "Off"}</Link>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right">
        <Link
          href={`/dashboard/domains/${domain.id}`}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-black text-blue-600 group-hover:bg-blue-50 group-hover:text-blue-700"
        >
          View info
          <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </td>
    </tr>
  );
}

function DomainCard({ domain }: { domain: Domain }) {
  const registered = formatDate(domain.registered_at);
  const expires = formatDate(domain.expires_at);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <GlobeIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/dashboard/domains/${domain.id}`} className="block truncate text-[15px] font-black text-slate-950 hover:text-blue-700">
            {domain.domain_name}
          </Link>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
            Registered: {registered ?? "—"}
          </p>
        </div>
        <StatusBadge status={domain.status as DashboardStatus} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="min-w-0 text-xs text-gray-500">
          <span className="text-gray-400">Expires:</span> {expires ?? "—"}
          <ExpiryChip expiresAt={domain.expires_at} status={domain.status} />
        </div>
        <Link
          href={`/dashboard/domains/${domain.id}`}
          className="shrink-0 rounded-lg bg-slate-950 px-3.5 py-2 text-xs font-black text-white hover:bg-slate-800"
        >
          Manage <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
