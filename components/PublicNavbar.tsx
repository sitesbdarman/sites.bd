"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "@/components/auth/ProfileMenu";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CartBadge } from "@/components/dashboard/CartBadge";
import { SiteLogo } from "@/components/SiteLogo";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { homeText, tr } from "@/lib/i18n/translations";

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
  const { language } = useLanguage();
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);

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

  // Branding rarely changes, so this only needs to run once per page load,
  // not on every pathname change.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/public-content", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { settings?: { logo_url?: string; site_name?: string } } | null) => {
        if (cancelled || !data) return;
        setLogoUrl(data.settings?.logo_url ?? null);
        setSiteName(data.settings?.site_name ?? null);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  // Lock body scroll while the mobile menu sheet is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  const links = [
    { href: "/", label: tr(homeText.nav.home, language) },
    { href: "/#features", label: tr(homeText.nav.features, language) },
    { href: "/pricing", label: tr(homeText.nav.pricing, language) },
    { href: "/domains/search", label: tr(homeText.nav.domainSearch, language) },
    { href: "/contact", label: tr(homeText.nav.contact, language) },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,.02)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-5 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2 font-display text-lg font-black tracking-tight text-slate-950 sm:text-2xl">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-transform group-hover:scale-105">
            <SiteLogo logoUrl={logoUrl} className="h-6 w-6" />
          </span>
          {siteName ? (
            <span className="whitespace-nowrap">{siteName}</span>
          ) : (
            <span className="whitespace-nowrap">SITES<span className="text-blue-600">.BD</span></span>
          )}
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-1 text-sm font-semibold lg:flex">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : link.href.startsWith("/#") ? pathname === "/" : pathname.startsWith(link.href.split("#")[0] || link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-4 py-2 transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <LanguageToggle className="hidden sm:flex" />
          <CartBadge />
          <ProfileMenu loggedIn={loggedIn} avatarUrl={avatarUrl} fullName={fullName} email={email} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:text-blue-600 active:scale-95 lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span className="relative flex h-4 w-5 flex-col items-center justify-center">
              <span className={`absolute block h-0.5 w-5 rounded-full bg-current transition-all duration-200 ${open ? "rotate-45" : "-translate-y-[6px]"}`} />
              <span className={`absolute block h-0.5 w-5 rounded-full bg-current transition-all duration-150 ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute block h-0.5 w-5 rounded-full bg-current transition-all duration-200 ${open ? "-rotate-45" : "translate-y-[6px]"}`} />
            </span>
          </button>
        </div>
      </div>

      <div
        id="public-mobile-menu"
        className={`grid overflow-hidden border-t border-slate-100 bg-white shadow-lg transition-[grid-template-rows] duration-200 ease-out lg:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-t-0"}`}
      >
        <div className="min-h-0">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : link.href.startsWith("/#") ? pathname === "/" : pathname.startsWith(link.href.split("#")[0] || link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"}`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <LanguageToggle />
              {!loggedIn && (
                <Link href="/login" className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-bold text-slate-700">
                  {language === "bn" ? "লগইন" : "Log in"}
                </Link>
              )}
              <Link href="/#claim" className="btn-signature flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white">
                {language === "bn" ? "ফ্রি সাবডোমেইন" : "Get Free Subdomain"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
