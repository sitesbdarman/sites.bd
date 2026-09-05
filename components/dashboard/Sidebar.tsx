"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { ChevronRightIcon, CloseIcon, DashboardIcon, FlagIcon, GlobeIcon, HomeIcon, InvoiceIcon, ServerIcon, TicketIcon } from "./icons";
import { SiteLogo } from "@/components/SiteLogo";

const COLLAPSE_STORAGE_KEY = "dashboard-sidebar-collapsed";

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
    { label: "Report a Problem", href: "/dashboard/report", icon: FlagIcon },
    { label: "Back to website", href: "/", icon: HomeIcon },
  ]},
];


interface SidebarProps {
  /** Mobile off-canvas open state. Ignored (always visible) on desktop. */
  open: boolean;
  onClose: () => void;
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/") return pathname === href;
  return pathname.startsWith(href);
}

function SidebarContent({
  pathname,
  onNavigate,
  onClose,
  logoUrl = null,
  siteName = null,
  collapsed = false,
  onToggleCollapse,
}: {
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
  logoUrl?: string | null;
  siteName?: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className={`flex h-[68px] shrink-0 items-center gap-2 border-b border-slate-100 ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        {/* Plain <a>, not next/link's <Link>: clicking the logo/site name should
            always do a full hard refresh straight to the public homepage. */}
        <a href="/" title="SITES.BD" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-gray-900">
          <SiteLogo logoUrl={logoUrl} className="h-6 w-6 shrink-0 text-blue-600" />
          {!collapsed && (siteName ? siteName : <>SITES<span className="text-blue-600">.BD</span></>)}
        </a>
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
            {!collapsed && <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">{group.label}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link key={`${group.label}-${item.label}`} href={item.href} onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center rounded-xl py-2.5 text-sm font-bold transition-colors ${
                      collapsed ? "justify-center px-2.5" : "gap-3 pl-4 pr-3"
                    } ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
                    {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-blue-600" aria-hidden="true" />}
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {onToggleCollapse && (
        <div className="hidden shrink-0 border-t border-gray-200 p-3 md:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 ${collapsed ? "justify-center" : ""}`}
          >
            <ChevronRightIcon className={`h-4.5 w-4.5 shrink-0 transition-transform ${collapsed ? "" : "rotate-180"}`} />
            {!collapsed && "Collapse"}
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable (e.g. privacy mode) — default to expanded.
    }
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore write failures; the toggle still works for this session.
      }
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public-content", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { settings?: { logo_url?: string; site_name?: string } } | null) => {
        if (cancelled || !data) return;
        setLogoUrl(data.settings?.logo_url ?? null);
        setSiteName(data.settings?.site_name ?? null);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {/* Desktop: persistent sidebar. sticky + h-screen keeps it pinned to the
          viewport while the page content scrolls, instead of scrolling away
          with the document; the nav's own overflow-y-auto handles the case
          where the link list itself is taller than the viewport. */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 self-start border-r border-slate-200/80 bg-white md:block ${
          collapsed ? "w-[76px]" : "w-[272px]"
        } ${hydrated ? "transition-[width] duration-150 ease-out" : ""}`}
      >
        <SidebarContent
          pathname={pathname}
          logoUrl={logoUrl}
          siteName={siteName}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
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
          <SidebarContent pathname={pathname} onNavigate={onClose} onClose={onClose} logoUrl={logoUrl} siteName={siteName} />
        </aside>
      </div>
    </>
  );
}
