"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { LogoutButton } from "@/app/dashboard/logout-button";
import { CloseIcon, DashboardIcon, GlobeIcon, HomeIcon, InvoiceIcon, ServerIcon, SettingsIcon, TicketIcon } from "./icons";
import { BrandMark } from "@/components/BrandMark";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: DashboardIcon }] },
  { label: "Domains", items: [
    { label: "My Domains", href: "/dashboard/domains", icon: GlobeIcon },
    { label: "Search Domain", href: "/domains/search", icon: GlobeIcon },
    { label: "Transfers", href: "/dashboard/domains/transfers", icon: GlobeIcon },
  ]},
  { label: "Hosting", items: [
    { label: "My Hosting", href: "/dashboard/services", icon: ServerIcon },
  ]},
  { label: "Email", items: [
    { label: "Email Accounts", href: "/dashboard/email", icon: InvoiceIcon },
    { label: "Email Forwarding", href: "/dashboard/email/forwarding", icon: InvoiceIcon },
  ]},
  { label: "Free .sites.bd", items: [
    { label: "My Subdomains", href: "/dashboard/subdomains", icon: GlobeIcon },
    { label: "Claim Subdomain", href: "/#claim", icon: GlobeIcon },
  ]},
  { label: "Billing", items: [
    { label: "Cart", href: "/cart", icon: InvoiceIcon },
    { label: "Orders", href: "/dashboard/orders", icon: InvoiceIcon },
    { label: "Invoices", href: "/dashboard/invoices", icon: InvoiceIcon },
  ]},
  { label: "Support", items: [
    { label: "Tickets", href: "/dashboard/tickets", icon: TicketIcon },
    { label: "Knowledge Base", href: "/support/knowledge-base", icon: TicketIcon },
  ]},
  { label: "Account", items: [
    { label: "Profile", href: "/profile", icon: SettingsIcon },
    { label: "Security", href: "/dashboard/settings", icon: SettingsIcon },
    { label: "Notifications", href: "/dashboard/settings", icon: SettingsIcon },
  ]},
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
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[68px] shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-5">
        <span className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-gray-900">
          <BrandMark className="h-6 w-6 text-blue-600" />
          SITES<span className="text-blue-600">.BD</span>
        </span>
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

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link key={`${group.label}-${item.label}`} href={item.href} onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-xl py-2.5 pl-4 pr-3 text-sm font-bold transition-colors ${
                      active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}>
                    {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-blue-600" aria-hidden="true" />}
                    <Icon className="h-4.5 w-4.5 shrink-0" />{item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-gray-200 p-3">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900">
          <HomeIcon className="h-5 w-5 shrink-0" />
          Back to website
        </Link>
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
      <aside className="hidden w-[272px] shrink-0 border-r border-slate-200/80 bg-white md:block">
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
          className={`absolute inset-y-0 left-0 w-80 max-w-[86vw] bg-white shadow-2xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent pathname={pathname} onNavigate={onClose} onClose={onClose} />
        </aside>
      </div>
    </>
  );
}
