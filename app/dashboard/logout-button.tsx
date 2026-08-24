"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoutIcon } from "@/components/dashboard/icons";

interface LogoutButtonProps {
  /**
   * "full" is the original full-width solid button (used on its own).
   * "icon" is a compact icon-only button for tight spaces like the
   * dashboard header. Underlying signOut() logic is identical either way.
   */
  variant?: "full" | "icon";
}

/**
 * Logout action, reused across the dashboard (sidebar + header). Client
 * component because `supabase.auth.signOut()` is a browser action — it
 * clears the session via the existing browser client's cookie handling,
 * nothing manual here.
 */
export function LogoutButton({ variant = "full" }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    // Guards against duplicate clicks while a request is already in flight.
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError("Couldn't log you out. Please try again.");
        return;
      }

      // Session is now cleared from the normal Supabase session flow —
      // send the user to login and refresh so Server Components (and
      // proxy.ts on the next navigation) see the signed-out state.
      router.push("/login");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (variant === "icon") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={isLoggingOut ? "Logging out..." : "Log out"}
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
            />
          ) : (
            <LogoutIcon className="h-5 w-5" />
          )}
          <span className="sr-only">Log out</span>
        </button>
        {error && (
          <p role="alert" className="absolute right-0 top-full mt-1 w-40 text-right text-xs text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoggingOut && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
          />
        )}
        <LogoutIcon className="h-4 w-4" />
        {isLoggingOut ? "Logging out..." : "Log out"}
      </button>
    </div>
  );
}
