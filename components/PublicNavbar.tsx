"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "@/components/auth/ProfileMenu";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CartBadge } from "@/components/dashboard/CartBadge";

interface PublicNavbarProps {
  loggedIn?: boolean;
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
}

interface ProfileResponse {
  authenticated: boolean;
  profile?: {
    avatar_url?: string | null;
    full_name?: string | null;
    email?: string | null;
  } | null;
}

export function PublicNavbar({ loggedIn: initialLoggedIn = false, avatarUrl: initialAvatar = null, fullName: initialName = null, email: initialEmail = null }: PublicNavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProfileResponse | null) => {
        if (cancelled || !data) return;
        setLoggedIn(Boolean(data.authenticated));
        setAvatarUrl(data.profile?.avatar_url ?? null);
        setFullName(data.profile?.full_name ?? null);
        setEmail(data.profile?.email ?? null);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [pathname]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/#features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/domains/search", label: "Domain Search" },
    { href: "/domains/search", label: "Order" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/70 bg-white/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center gap-3 px-4 py-3 sm:px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-blue-600 sm:text-2xl">
          <span aria-hidden="true">🌐</span>
          <span>SITES<span className="text-gray-900">.BD</span></span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-5 text-sm font-semibold lg:flex">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : link.href.startsWith("/#") ? pathname === "/" : pathname.startsWith(link.href.split("#")[0] || link.href);
            return (
              <Link key={link.href} href={link.href} className={`rounded-lg px-2.5 py-2 transition hover:bg-blue-50 hover:text-blue-700 ${active ? "text-blue-600" : "text-gray-700"}`}>
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageToggle className="hidden sm:flex" />
          <CartBadge />
          <ProfileMenu loggedIn={loggedIn} avatarUrl={avatarUrl} fullName={fullName} email={email} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 active:scale-95 lg:hidden"
          >
            <span className="sr-only">Open menu</span>
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div id="public-mobile-menu" className="border-t border-gray-100 bg-white px-4 py-3 shadow-lg lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-blue-700">
                {link.label}
              </Link>
            ))}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <LanguageToggle />
              <Link href="/cart" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">Open Cart</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
