"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DashboardIcon,
  UserIcon,
  GlobeIcon,
  InvoiceIcon,
  TicketIcon,
  PercentIcon,
  TakaIcon,
  BellIcon,
  ChartIcon,
  DocIcon,
  ClipboardIcon,
  SettingsIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/dashboard/icons";

export const adminNav = [
  { href: "/admin", label: "Overview", Icon: DashboardIcon },
  { href: "/admin/users", label: "Customers", Icon: UserIcon },
  { href: "/admin/domains", label: "Domains", Icon: GlobeIcon },
  { href: "/admin/orders", label: "Orders & Payments", Icon: InvoiceIcon },
  { href: "/admin/tickets", label: "Support", Icon: TicketIcon },
  { href: "/admin/coupons", label: "Coupons", Icon: PercentIcon },
  { href: "/admin/pricing", label: "Pricing", Icon: TakaIcon },
  { href: "/admin/catalog", label: "Service Catalog", Icon: GlobeIcon },
  { href: "/admin/notifications", label: "Notifications", Icon: BellIcon },
  { href: "/admin/reports", label: "Reports", Icon: ChartIcon },
  { href: "/admin/content", label: "Content", Icon: DocIcon },
  { href: "/admin/audit", label: "Audit Log", Icon: ClipboardIcon },
  { href: "/admin/integrations", label: "Integrations", Icon: SettingsIcon },
  { href: "/admin/settings", label: "Settings", Icon: SettingsIcon },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** Desktop sidebar nav — used inside the fixed <aside>. */
export function AdminSidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 px-4 py-5">
      {adminNav.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-lg py-2.5 pl-4 pr-3 text-sm font-semibold transition-colors active:scale-[.98] ${
              active ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {active && (
              <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-sky-400" aria-hidden="true" />
            )}
            <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-sky-300" : "text-slate-400"}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile: hamburger button in the header + a slide-in drawer with an overlay. */
export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="admin-mobile-drawer"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:text-sky-600 active:scale-95 lg:hidden"
      >
        <span className="sr-only">Open admin menu</span>
        <MenuIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div
            id="admin-mobile-drawer"
            role="dialog"
            aria-modal="true"
            className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-slate-950 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <div>
                <div className="text-lg font-black tracking-tight font-display">SITES<span className="text-sky-400">.BD</span></div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Admin Control Center</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95"
              >
                <span className="sr-only">Close menu</span>
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-4 py-5">
              {adminNav.map(({ href, label, Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-lg py-2.5 pl-4 pr-3 text-sm font-semibold transition-colors active:scale-[.98] ${
                      active ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-sky-400" aria-hidden="true" />
                    )}
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-sky-300" : "text-slate-400"}`} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
