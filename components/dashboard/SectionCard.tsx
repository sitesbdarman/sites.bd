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
 */
export function SectionCard({ title, viewAllHref, children }: SectionCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
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
