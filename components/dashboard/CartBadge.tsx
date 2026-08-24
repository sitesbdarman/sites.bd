"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CartIcon } from "./icons";

interface CartCountResponse {
  success: boolean;
  items?: unknown[];
}

/**
 * Small cart icon + item-count badge for the dashboard header. Fetches
 * the count from the real cart (GET /api/cart also merges any pending
 * guest cart on first call after login) rather than tracking count
 * separately — one source of truth. Fails silently (badge just shows no
 * count) since this is a convenience indicator, not critical UI.
 */
export function CartBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCount() {
      try {
        const response = await fetch("/api/cart");
        if (!response.ok) return;
        const data: CartCountResponse = await response.json();
        if (!cancelled && data.success) {
          setCount(Array.isArray(data.items) ? data.items.length : 0);
        }
      } catch {
        // Ignore — badge just stays without a count.
      }
    }

    loadCount();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/cart"
      title="Cart"
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
    >
      <CartIcon className="h-5 w-5" />
      <span className="sr-only">Cart{count ? ` (${count} items)` : ""}</span>
      {count !== null && count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-none text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
