import Link from "next/link";
import type { ReactNode } from "react";
import { StatusBadge, type DashboardStatus } from "./StatusBadge";

interface RecentRowProps {
  href: string;
  title: string;
  /** Small text under the title — e.g. plan name, invoice total, ticket subject. */
  subtitle?: string;
  status?: DashboardStatus;
  /** Right-aligned extra text, e.g. a formatted date. */
  meta?: ReactNode;
}

/**
 * A single clickable row inside a dashboard "Recent ..." SectionCard.
 * Kept intentionally plain (title + subtitle + status + meta) so it reads
 * the same for domains, services, invoices, and tickets.
 */
export function RecentRow({ href, title, subtitle, status, meta }: RecentRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition hover:bg-gray-50 active:scale-[.99]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
        {subtitle && <p className="truncate text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {meta && <span className="text-xs text-gray-400">{meta}</span>}
        {status && <StatusBadge status={status} />}
      </div>
    </Link>
  );
}
