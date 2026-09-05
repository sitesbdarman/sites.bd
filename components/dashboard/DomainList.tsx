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
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as Domain["status"] | "all")
          }
          aria-label="Filter domains by status"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto"
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
          <div className="hidden overflow-hidden rounded-[--radius-surface] border border-gray-200 md:block">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Domain
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Registered
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Auto-renew
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((domain) => (
                  <DomainRow key={domain.id} domain={domain} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
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
    <tr className="group cursor-pointer transition hover:bg-blue-50/60">
      <td className="whitespace-nowrap p-0">
        <Link href={`/dashboard/domains/${domain.id}`} className="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold text-gray-900 group-hover:text-blue-700">
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
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-1.5 group-hover:text-blue-700"
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
    <Link
      href={`/dashboard/domains/${domain.id}`}
      className="group block rounded-[--radius-surface] border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300 active:scale-[.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
            <GlobeIcon className="h-4.5 w-4.5" />
          </span>
          <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-700">{domain.domain_name}</p>
        </div>
        <StatusBadge status={domain.status as DashboardStatus} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-gray-400">Registered</dt>
          <dd className="mt-0.5 text-gray-600">{registered ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Expires</dt>
          <dd className="mt-0.5 flex items-center gap-2 text-gray-600">
            {expires ?? "—"}
            <ExpiryChip expiresAt={domain.expires_at} status={domain.status} />
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">Auto-renew</dt>
          <dd className="mt-0.5 text-gray-600">{domain.auto_renew ? "On" : "Off"}</dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:gap-1.5 group-hover:text-blue-700">
        View info
        <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
