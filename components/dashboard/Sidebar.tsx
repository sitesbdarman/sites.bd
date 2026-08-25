"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { LogoutButton } from "@/app/dashboard/logout-button";
import { CloseIcon, DashboardIcon, GlobeIcon, InvoiceIcon, ServerIcon, TicketIcon } from "./icons";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "My Domains", href: "/dashboard/domains", icon: GlobeIcon },
  { label: "My Services", href: "/dashboard/services", icon: ServerIcon },
  { label: "My Invoices", href: "/dashboard/invoices", icon: InvoiceIcon },
  { label: "Support Tickets", href: "/dashboard/tickets", icon: TicketIcon },
  { label: "Settings", href: "/profile", icon: DashboardIcon },
];

interface SidebarProps {
  /** Mobile off-canvas open state. Ignored (always visible) on desktop. */
  open: boolean;
  onClose: () => void;
}

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function SidebarContent({
  pathname,
  onNavigate,
  onClose,
}: {
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-5">
        <span className="text-lg font-bold tracking-tight text-gray-900">DomainHost</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:hidden"
          >
            <CloseIcon className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">Home</Link>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-gray-200 p-3">
        <LogoutButton variant="full" />
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile: off-canvas sidebar + backdrop */}
      <div className={`fixed inset-0 z-40 md:hidden ${open ? "" : "pointer-events-none"}`}>
        <div
          onClick={onClose}
          aria-hidden="true"
          className={`absolute inset-0 bg-gray-900/40 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-white shadow-xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent pathname={pathname} onNavigate={onClose} onClose={onClose} />
        </aside>
      </div>
    </>
  );
}
