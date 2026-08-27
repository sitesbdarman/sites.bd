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
      className="group flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md active:scale-[.98]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{label}</span>
    </Link>
  );
}
