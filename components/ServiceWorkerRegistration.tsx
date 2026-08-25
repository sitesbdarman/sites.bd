"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js so the site is installable (Add to Home Screen) and
 * gets basic offline resilience for already-visited pages. No UI — this
 * only runs the registration side effect. Silently no-ops on browsers
 * without service worker support.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failures (e.g. unsupported context) are non-critical.
    });
  }, []);

  return null;
}
