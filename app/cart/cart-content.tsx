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

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-[--radius-surface] border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Order</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Your cart</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-4 first:pt-1">
                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-900">{item.domain_name}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.validity_years} {item.validity_years === 1 ? "year" : "years"} registration · Renewal pricing shown before checkout</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{formatPrice(item.price, item.currency)}</span>
                  <button type="button" onClick={() => handleRemove(item.id)} disabled={removingId === item.id} title="Remove"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-60">
                    {removingId === item.id ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" /> : <TrashIcon className="h-4 w-4" />}
                    <span className="sr-only">Remove {item.domain_name} from cart</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="h-fit rounded-[--radius-surface] border border-gray-200 bg-white p-5 lg:sticky lg:top-20">
          <h2 className="text-base font-black text-gray-900">Order Summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            {items.map(item => <div key={item.id} className="flex justify-between gap-3"><span className="truncate text-gray-600">{item.domain_name}</span><span className="font-semibold">{formatPrice(item.price, item.currency)}</span></div>)}
            <div className="flex justify-between border-t border-gray-100 pt-3 text-gray-500"><span>Subtotal</span><span>{formatPrice(total, items[0]?.currency ?? "USD")}</span></div>
            <div className="flex justify-between text-gray-500"><span>Tax / fees</span><span>Calculated at checkout</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-black text-gray-900"><span>Total</span><span>{formatPrice(total, items[0]?.currency ?? "USD")}</span></div>
          </div>
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">Secure checkout. Any applicable taxes or payment fees are shown before you place the order.</p>
          <Link href="/checkout/hosting" className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800">Continue to Checkout →</Link>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 p-3 shadow-[0_-10px_30px_-20px_rgba(15,23,42,.35)] backdrop-blur md:hidden">
        <Link href="/checkout/hosting" className="flex min-h-11 items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-black text-white">Checkout · {formatPrice(total, items[0]?.currency ?? "USD")} →</Link>
      </div>
    </div>
  );
}
