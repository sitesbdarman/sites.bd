"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BellIcon,
  CartIcon,
  DashboardIcon,
  LogoutIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/dashboard/icons";

interface DashboardNotification {
  id: string;
  title: string;
  detail: string;
  href: string;
  urgent: boolean;
}

// Domain/invoice/ticket notifications are derived from live data (no is_read
// column to persist against), so "mark all read" has to remember their ids
// itself or they'd reappear on the next poll/focus refetch. Kept small and
// capped so it can't grow forever.
const DISMISSED_KEY = "sitesbd:dismissed-notifications";
const DISMISSED_CAP = 200;

function getDismissedIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function addDismissedIds(ids: string[]) {
  try {
    const merged = Array.from(new Set([...getDismissedIds(), ...ids])).slice(-DISMISSED_CAP);
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(merged));
  } catch {
    // Storage unavailable — dismissed notifications just won't persist across refetches.
  }
}

interface AccountMenuProps {
  loggedIn: boolean;
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  /** Shows the name/email next to the avatar on wider screens. Off by default in the compact dashboard header. */
  showLabel?: boolean;
}

/**
 * Single entry point for everything that used to live as separate icons in
 * the header (notification bell, cart, logout). Clicking the avatar opens
 * one dropdown with all of it, so the header only ever shows one control.
 */
export function AccountMenu({ loggedIn, avatarUrl, fullName, email, showLabel = false }: AccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [identityStatus, setIdentityStatus] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;

    async function loadAll() {
      try {
        const [notifRes, cartRes, accessRes, verifyRes] = await Promise.all([
          fetch("/api/dashboard/notifications").then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch("/api/cart").then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch("/api/account/access").then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch("/api/profile/verification").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (cancelled) return;
        if (notifRes) {
          const dismissed = getDismissedIds();
          const fresh: DashboardNotification[] = (notifRes.notifications ?? []).filter(
            (n: DashboardNotification) => !dismissed.has(n.id)
          );
          setNotifications(fresh);
        }
        if (cartRes?.success) setCartCount(Array.isArray(cartRes.items) ? cartRes.items.length : 0);
        if (accessRes) setIsAdmin(Boolean(accessRes.isAdmin));
        if (verifyRes) setIdentityStatus(verifyRes.status ?? "unverified");
      } catch {
        // Silent — menu just shows without badges until next open/poll.
      }
    }

    loadAll();
    const interval = setInterval(loadAll, 60_000);
    const refreshCart = () => { void loadAll(); };
    window.addEventListener("sitesbd:cart-updated", refreshCart);
    window.addEventListener("focus", refreshCart);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("sitesbd:cart-updated", refreshCart);
      window.removeEventListener("focus", refreshCart);
    };
  }, [loggedIn]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className="flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:scale-[.98] sm:h-11"
      >
        <UserIcon className="h-4.5 w-4.5" />
        Login
      </Link>
    );
  }

  const notifCount = notifications.length;
  const urgentCount = notifications.filter((n) => n.urgent).length;
  const displayName = fullName || email || "Account";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Account menu for ${displayName}`}
        className={`group flex min-w-0 items-center gap-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-[.98] ${
          showLabel ? "border border-gray-200 bg-white py-1.5 pl-1.5 pr-2 shadow-sm hover:border-blue-300 hover:shadow-md" : ""
        }`}
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-50 to-blue-100 text-blue-600 shadow-inner ring-2 ring-white transition group-hover:ring-blue-100 sm:h-11 sm:w-11">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar can come from Cloudinary or Supabase Storage
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-5 w-5 transition group-hover:scale-105 sm:h-6 sm:w-6" />
          )}
          {notifCount > 0 && (
            <span
              className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold text-white ${
                urgentCount > 0 ? "bg-red-500" : "bg-blue-500"
              }`}
            >
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </span>
        {showLabel && (
          <span className="hidden min-w-0 max-w-[7rem] sm:block sm:max-w-[12rem]">
            <span className="block truncate text-xs font-bold text-gray-800 sm:text-sm">{displayName}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[92vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-gray-900">{fullName || "Your account"}</p>
            {email && <p className="truncate text-xs text-gray-500">{email}</p>}
          </div>

          <div className="max-h-56 overflow-y-auto border-b border-gray-100">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Notifications</p>
              {notifCount > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    addDismissedIds(notifications.map((n) => n.id));
                    setNotifications([]);
                    await fetch("/api/dashboard/notifications", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ all: true }),
                    }).catch(() => undefined);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifCount === 0 ? (
              <p className="px-4 pb-3 text-xs text-gray-400">You&rsquo;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.slice(0, 5).map((n) => (
                  <li key={n.id}>
                    <Link href={n.href} onClick={() => setOpen(false)} className="flex items-start gap-2 px-4 py-2.5 hover:bg-gray-50">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.urgent ? "bg-red-500" : "bg-blue-400"}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-gray-900">{n.title}</span>
                        <span className="block truncate text-[11px] text-gray-500">{n.detail}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-gray-100 px-4 py-2 text-center text-[11px] font-bold text-blue-600 hover:bg-gray-50 hover:text-blue-700"
            >
              View all notifications
            </Link>
          </div>

          <div className="py-1.5">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <DashboardIcon className="h-4.5 w-4.5 text-gray-400" /> Dashboard
            </Link>
            <Link href="/cart" onClick={() => setOpen(false)} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <span className="flex items-center gap-3"><CartIcon className="h-4.5 w-4.5 text-gray-400" /> Cart</span>
              {cartCount !== null && cartCount > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">{cartCount}</span>
              )}
            </Link>
            <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <SettingsIcon className="h-4.5 w-4.5 text-gray-400" /> Settings
            </Link>
            <Link href="/dashboard/settings#identity-verification" onClick={() => setOpen(false)} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <span className="flex items-center gap-3"><ShieldIcon className="h-4.5 w-4.5 text-gray-400" /> Verify account</span>
              {identityStatus === "verified" && <span className="text-[11px] font-bold text-emerald-600">Verified</span>}
              {identityStatus === "pending" && <span className="text-[11px] font-bold text-amber-600">Pending</span>}
              {identityStatus === "rejected" && <span className="text-[11px] font-bold text-red-600">Rejected</span>}
              {identityStatus === "unverified" && <span className="text-[11px] font-bold text-gray-400">Required</span>}
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <ShieldIcon className="h-4.5 w-4.5 text-gray-400" /> Admin panel
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 py-1.5">
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <LogoutIcon className="h-4.5 w-4.5" /> {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
