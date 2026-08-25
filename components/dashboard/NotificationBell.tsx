"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface DashboardNotification {
  id: string;
  type: "domain_expiring" | "invoice_unpaid" | "ticket_reply";
  title: string;
  detail: string;
  href: string;
  urgent: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 60_000;

/**
 * Bell icon + dropdown showing the signed-in user's own actionable items
 * (expiring domains, unpaid invoices, ticket replies) pulled from
 * /api/dashboard/notifications. Polls periodically so a reply or a
 * newly-crossed expiry threshold shows up without a full page reload.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/dashboard/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setNotifications(data.notifications ?? []);
      } catch {
        // Silent — the bell just shows nothing new until the next poll.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const urgentCount = notifications.filter((n) => n.urgent).length;
  const count = notifications.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0 ? `${count} notifications` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span
            className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
              urgentCount > 0 ? "bg-red-500" : "bg-blue-500"
            }`}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-md bg-gray-100" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">You&rsquo;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2 px-4 py-3 transition hover:bg-gray-50"
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          n.urgent ? "bg-red-500" : "bg-blue-400"
                        }`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">{n.title}</span>
                        <span className="block truncate text-xs text-gray-500">{n.detail}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
