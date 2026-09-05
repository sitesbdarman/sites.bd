import Link from "next/link";
import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  /** Optional "View All" link — only rendered when a destination is given. */
  viewAllHref?: string;
  children: ReactNode;
}

/**
 * A titled card used for the dashboard's "Recent ..." sections. Content
 * (an EmptyState today, a real list later) is passed as children.
 *
 * Uses the shared `.surface` primitive — a hairline border, no shadow —
 * and a bottom rule under the header instead of relying on spacing alone
 * to separate title from content.
 */
export function SectionCard({ title, viewAllHref, children }: SectionCardProps) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs font-medium text-blue-600 hover:text-blue-700">
            View all
          </Link>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
