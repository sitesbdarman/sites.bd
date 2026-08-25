"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type IconName = "grid" | "users" | "domains" | "orders" | "tickets" | "coupon" | "pricing" | "bell" | "chart" | "content" | "audit" | "settings";
const nav = [
  ["/admin", "Overview", "ওভারভিউ", "grid"], ["/admin/users", "Customers", "কাস্টমার", "users"], ["/admin/domains", "Domains", "ডোমেইন", "domains"], ["/admin/orders", "Orders & Payments", "অর্ডার ও পেমেন্ট", "orders"], ["/admin/tickets", "Support", "সাপোর্ট", "tickets"], ["/admin/coupons", "Coupons", "কুপন", "coupon"], ["/admin/pricing", "Pricing", "প্রাইসিং", "pricing"], ["/admin/notifications", "Notifications", "নোটিফিকেশন", "bell"], ["/admin/reports", "Reports", "রিপোর্ট", "chart"], ["/admin/content", "Content", "কনটেন্ট", "content"], ["/admin/audit", "Audit Log", "অডিট লগ", "audit"], ["/admin/settings", "Settings", "সেটিংস", "settings"],
] as const;

function Icon({ name }: { name: IconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, viewBox: "0 0 24 24" };
  const paths: Record<IconName, ReactNode> = {
    grid:<><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    users:<><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 4.13a3 3 0 0 1 0 5.74"/></>,
    domains:<><circle cx="12" cy="12" r="8.5"/><path d="M3.8 12h16.4M12 3.5c2.2 2.4 3.2 5.2 3.2 8.5S14.2 18.1 12 20.5C9.8 18.1 8.8 15.3 8.8 12S9.8 5.9 12 3.5Z"/></>,
    orders:<><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></>,
    tickets:<><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v2a2 2 0 1 0 0 5v2a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-2a2 2 0 1 0 0-5z"/><path d="M9 9h6M9 13h4"/></>,
    coupon:<><path d="M4 7h16v4a2 2 0 1 0 0 4v2H4v-2a2 2 0 1 0 0-4z"/><path d="M12 7v10"/></>,
    pricing:<><path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    bell:<><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    chart:<><path d="M4 19V5M4 19h16"/><path d="m7 15 3-4 3 2 5-6"/></>,
    content:<><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    audit:<><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></>,
    settings:<><circle cx="12" cy="12" r="3.5"/><path d="M19 13.5a2 2 0 0 0 .4 1.8l.1.1-1.5 1.5-.1-.1a2 2 0 0 0-1.8-.4 2 2 0 0 0-1.2 1.5V20h-2v-.1a2 2 0 0 0-1.2-1.5 2 2 0 0 0-1.8.4l-.1.1-1.5-1.5.1-.1a2 2 0 0 0 .4-1.8 2 2 0 0 0-1.5-1.2H6v-2h.1A2 2 0 0 0 7.6 11a2 2 0 0 0-.4-1.8l-.1-.1L8.6 7.6l.1.1a2 2 0 0 0 1.8.4A2 2 0 0 0 11.7 6V5.9h2V6a2 2 0 0 0 1.2 1.5 2 2 0 0 0 1.8-.4l.1-.1 1.5 1.5-.1.1a2 2 0 0 0-.4 1.8A2 2 0 0 0 19.3 12h.1v2h-.1A2 2 0 0 0 19 13.5Z"/></>,
  };
  return <svg {...common} className="h-5 w-5">{paths[name]}</svg>;
}

export function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const { language } = useLanguage();
  return <div className={mobile ? "flex gap-2 overflow-x-auto pb-1" : "space-y-1"}>
    {nav.map(([href, en, bn, icon]) => {
      const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
      return <Link key={href} href={href} className={`${mobile ? "whitespace-nowrap" : "w-full"} group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/10" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sky-300 transition group-hover:bg-sky-400/15"><Icon name={icon as IconName} /></span>{language === "bn" ? bn : en}</Link>;
    })}
    {!mobile && <div className="pt-3"><LanguageToggle /></div>}
  </div>;
}
