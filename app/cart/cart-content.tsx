"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { GlobeIcon, TrashIcon } from "@/components/dashboard/icons";

interface CartItem {
  id: string;
  domain_name: string;
  price: number;
  currency: string;
  validity_years: number;
  created_at: string;
}

interface CartGetResponse {
  success: boolean;
  items?: CartItem[];
  total?: number;
  error?: string;
}

interface CartDeleteResponse {
  success: boolean;
  error?: string;
}

type LoadState = "loading" | "error" | "loaded";

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

export function CartContent() {
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Bumped by the "Try again" button to re-run the load effect below.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      setState("loading");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/cart");
        const data: CartGetResponse = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.success) {
          setState("error");
          setErrorMessage(data.error ?? "Couldn't load your cart. Please try again.");
          return;
        }

        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setState("loaded");
      } catch {
        if (!cancelled) {
          setState("error");
          setErrorMessage("Couldn't reach the server. Please check your connection and try again.");
        }
      }
    }

    loadCart();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function handleRemove(itemId: string) {
    if (removingId) {
      return;
    }

    setRemovingId(itemId);
    setNotice(null);

    try {
      const response = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      const data: CartDeleteResponse = await response.json();

      if (!response.ok || !data.success) {
        setNotice(data.error ?? "Couldn't remove that item. Please try again.");
        return;
      }

      setItems((prev) => {
        const removed = prev.find((item) => item.id === itemId);
        if (removed) {
          setTotal((prevTotal) => Math.round((prevTotal - removed.price) * 100) / 100);
        }
        return prev.filter((item) => item.id !== itemId);
      });
      setNotice("Item removed from your cart.");
    } catch {
      setNotice("Couldn't reach the server. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-16">
        <span
          aria-hidden="true"
          className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
        />
        <p className="text-sm text-gray-500">Loading your cart...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {errorMessage}{" "}
        <button
          type="button"
          onClick={() => setReloadKey((prev) => prev + 1)}
          className="font-medium underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={GlobeIcon}
        message="Your cart is empty. Search for a domain to get started."
        action={
          <Link
            href="/domains/search"
            className="mt-2 inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Find a domain
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <div
          role="status"
          className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700"
        >
          {notice}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{item.domain_name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {item.validity_years} {item.validity_years === 1 ? "year" : "years"} registration
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900">
                {formatPrice(item.price, item.currency)}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={removingId === item.id}
                title="Remove"
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removingId === item.id ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
                  />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
                <span className="sr-only">Remove {item.domain_name} from cart</span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-gray-700">Total</span>
        <span className="text-lg font-semibold text-gray-900">
          {formatPrice(total, items[0]?.currency ?? "USD")}
        </span>
      </div>

      <Link
        href="/checkout/hosting"
        className="inline-flex items-center justify-center self-end rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        Continue to Checkout
      </Link>
    </div>
  );
}
