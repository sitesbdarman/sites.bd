"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/domains/search", label: "Search", icon: "⌕" },
  { href: "/dashboard/domains", label: "Domains", icon: "◎" },
  { href: "/cart", label: "Cart", icon: "◴" },
  { href: "/dashboard", label: "Account", icon: "◉" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout") || pathname.startsWith("/login") || pathname.startsWith("/register")) return null;
  return (
    <nav aria-label="Mobile navigation" className="mobile-bottom-nav lg:hidden">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return <Link key={item.href} href={item.href} className={active ? "is-active" : ""}>
          <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
        </Link>;
      })}
    </nav>
  );
}
