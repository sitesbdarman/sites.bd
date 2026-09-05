"use client";

import { useState } from "react";

/**
 * Notification preference toggles. Not yet wired to the
 * notification_preferences table — see the note below the button.
 * Extracted out of the settings page so the page itself can be an async
 * server component (it now also renders the profile form, which needs
 * server-fetched data).
 */
export function NotificationPreferences() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="rounded-[--radius-surface] border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-black text-slate-950">Notification preferences</h2>
      <p className="mt-1 text-sm text-slate-500">Choose what you want to hear from us and how.</p>

      <div className="mt-5 space-y-4">
        <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
          <span>
            <span className="block font-bold text-slate-900">In-app notifications</span>
            <span className="text-sm text-slate-500">Show important updates inside your dashboard.</span>
          </span>
          <input type="checkbox" defaultChecked className="h-5 w-5" />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
          <span>
            <span className="block font-bold text-slate-900">Email notifications</span>
            <span className="text-sm text-slate-500">Order, payment, ticket and domain reminders.</span>
          </span>
          <input type="checkbox" defaultChecked className="h-5 w-5" />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
          <span>
            <span className="block font-bold text-slate-900">Promotions</span>
            <span className="text-sm text-slate-500">Occasional offers and discounts.</span>
          </span>
          <input type="checkbox" className="h-5 w-5" />
        </label>
      </div>

      <button onClick={() => setSaved(true)} className="mt-6 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-500">
        Save preferences
      </button>
      {saved && (
        <p className="mt-3 text-sm font-semibold text-emerald-600">
          Preferences saved locally. Connect these controls to the notification_preferences table for persistence.
        </p>
      )}
    </div>
  );
}
