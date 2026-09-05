"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellIcon } from "@/components/dashboard/icons";

interface DashboardNotification {
  id: string;
  title: string;
  detail: string;
  href: string;
  urgent: boolean;
}

// Kept in sync with the same-named constant in components/AccountMenu.tsx —
// both read/write this key so a notification dismissed from either place
// stays dismissed everywhere.
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

async function markReadOnServer(id: string) {
  if (!id.startsWith("custom-")) return; // derived notifications have no DB row to update
  await fetch("/api/dashboard/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id.replace(/^custom-/, "") }),
  }).catch(() => undefined);
}

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const dismissed = getDismissedIds();
        setNotifications((data.notifications ?? []).filter((n: DashboardNotification) => !dismissed.has(n.id)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function markOneRead(id: string) {
    addDismissedIds([id]);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await markReadOnServer(id);
  }

  async function markAllRead() {
    addDismissedIds(notifications.map((n) => n.id));
    const toSync = notifications;
    setNotifications([]);
    await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => undefined);
    await Promise.all(toSync.map((n) => markReadOnServer(n.id)));
  }

  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-black text-slate-950">All notifications</h2>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <BellIcon className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">You&rsquo;re all caught up.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.urgent ? "bg-red-500" : "bg-blue-400"}`} />
              <Link href={n.href} className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-900">{n.title}</span>
                <span className="block truncate text-xs text-gray-500">{n.detail}</span>
              </Link>
              <button
                type="button"
                onClick={() => markOneRead(n.id)}
                className="shrink-0 text-[11px] font-bold text-gray-400 hover:text-blue-600"
              >
                Mark read
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
