import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

interface QuickActionProps {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/**
 * One tile in the dashboard's "quick actions" shortcut row — the handful
 * of things a customer does most often (buy a domain, order hosting, open
 * a ticket), surfaced above the fold instead of buried in the sidebar.
 */
export function QuickAction({ href, label, icon: Icon }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group flex flex-1 items-center gap-3 rounded-[--radius-surface] border border-gray-200 bg-white px-4 py-3.5 transition-colors hover:border-blue-300 active:scale-[.98]"
    >
      <Icon className="h-4.5 w-4.5 shrink-0 text-blue-600 transition-transform group-hover:scale-110" />
      <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{label}</span>
    </Link>
  );
}
