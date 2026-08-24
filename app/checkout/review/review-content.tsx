"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatBDT, type HostingPlanType } from "@/lib/hosting/plans";
import { loadHostingSelection, type HostingSelection } from "@/lib/hosting/selection";
import { loadAddonsSelection } from "@/lib/hosting/addons-selection";

interface ReviewCartItem {
  id: string;
  domain_name: string;
  price: number;
  currency: string;
  validity_years: number;
}

interface ReviewHosting {
  type: string;
  planId: string;
  planName: string;
  price: number;
  billingCycle: string;
  custom?: { nameServer: string; ipAddress: string };
}

interface ReviewAddon {
  id: string;
  name: string;
  price: number;
}

interface ReviewTotals {
  domainTotal: number;
  hostingPrice: number;
  addonsTotal: number;
  finalTotal: number;
}

interface ReviewResponse {
  success: boolean;
  errors?: string[];
  cart?: ReviewCartItem[];
  hosting?: ReviewHosting | null;
  addons?: ReviewAddon[];
  totals?: ReviewTotals;
  error?: string;
}

type LoadState = "loading" | "error" | "invalid" | "valid";

function formatDomainPrice(item: ReviewCartItem): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: item.currency }).format(
      item.price,
    );
  } catch {
    return `${item.currency} ${item.price.toFixed(2)}`;
  }
}

export function ReviewContent() {
  const [state, setState] = useState<LoadState>("loading");
  const [errors, setErrors] = useState<string[]>([]);
  const [cart, setCart] = useState<ReviewCartItem[]>([]);
  const [hosting, setHosting] = useState<ReviewHosting | null>(null);
  const [addons, setAddons] = useState<ReviewAddon[]>([]);
  const [totals, setTotals] = useState<ReviewTotals | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceId, setInvoiceId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReview() {
      setState("loading");

      const savedHosting: HostingSelection | null = loadHostingSelection();
      const savedAddons = loadAddonsSelection();

      if (!savedHosting) {
        if (!cancelled) {
          setErrors(["No hosting plan selected. Please complete Step 1 first."]);
          setState("invalid");
        }
        return;
      }

      try {
        const response = await fetch("/api/checkout/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hosting: {
              type: savedHosting.type,
              planId: savedHosting.planId,
              custom: savedHosting.custom,
            },
            addonIds: savedAddons?.addonIds ?? [],
          }),
        });
        const data: ReviewResponse = await response.json();

        if (cancelled) return;

        if (!response.ok && response.status !== 200) {
          setErrors([data.error ?? "Couldn't validate your order. Please try again."]);
          setState("error");
          return;
        }

        setCart(data.cart ?? []);
        setHosting(data.hosting ?? null);
        setAddons(data.addons ?? []);
        setTotals(data.totals ?? null);

        if (!data.success) {
          setErrors(data.errors ?? ["Some checkout data is invalid."]);
          setState("invalid");
        } else {
          setErrors([]);
          setState("valid");
        }
      } catch {
        if (!cancelled) {
          setErrors(["Couldn't reach the server. Please try again."]);
          setState("error");
        }
      }
    }

    loadReview();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-16">
        <span
          aria-hidden="true"
          className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
        />
        <p className="text-sm text-gray-500">Validating your order...</p>
      </div>
    );
  }

  const canConfirm = state === "valid" && termsAccepted && !confirmed && !confirming;

  async function confirmOrder() {
    if (!canConfirm) return;
    setConfirming(true);
    setConfirmError("");
    try {
      const response = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hosting: hosting ? { type: hosting.type as HostingPlanType, planId: hosting.planId, custom: hosting.custom } : undefined,
          addonIds: addons.map((addon) => addon.id),
          termsAccepted: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setConfirmError(data.error ?? "Could not create your order.");
        return;
      }
      setOrderNumber(data.order.orderNumber);
      setInvoiceId(data.invoiceId ?? "");
      setConfirmed(true);
      if (data.nextStep === "payment" && data.invoiceId) {
        window.location.href = `/checkout/payment?invoice=${encodeURIComponent(data.invoiceId)}`;
      }
    } catch {
      setConfirmError("Could not reach the server. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Step 3 of 4</p>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">Order review</h1>
        <p className="mt-1 text-sm text-gray-500">
          Double-check everything before confirming your order.
        </p>
      </div>

      {(state === "error" || state === "invalid") && errors.length > 0 && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ul className="list-inside list-disc">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Domains */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Domain(s)</h2>
        {cart.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No domains in cart.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {cart.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{item.domain_name}</p>
                  <p className="text-xs text-gray-500">Validity: {item.validity_years} year</p>
                </div>
                <span className="shrink-0 font-medium text-gray-900">{formatDomainPrice(item)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Hosting */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Hosting</h2>
        {hosting ? (
          <div className="mt-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-gray-900">{hosting.planName}</p>
              {hosting.custom && (
                <p className="text-xs text-gray-500">
                  NS: {hosting.custom.nameServer} · IP: {hosting.custom.ipAddress}
                </p>
              )}
            </div>
            <span className="font-medium text-gray-900">{formatBDT(hosting.price)}</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">No hosting plan selected.</p>
        )}
      </section>

      {/* Add-ons */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Add-on services</h2>
        {addons.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No additional services selected.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {addons.map((addon) => (
              <li key={addon.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">{addon.name}</span>
                <span className="font-medium text-gray-900">
                  {addon.price > 0 ? formatBDT(addon.price) : "Custom"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Totals */}
      {totals && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Price summary</h2>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Domain price</dt>
              <dd className="text-gray-900">{formatBDT(totals.domainTotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Hosting price</dt>
              <dd className="text-gray-900">{formatBDT(totals.hostingPrice)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Add-on total</dt>
              <dd className="text-gray-900">{formatBDT(totals.addonsTotal)}</dd>
            </div>
          </dl>
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-sm font-medium text-gray-700">Final Total</span>
            <span className="text-lg font-semibold text-gray-900">{formatBDT(totals.finalTotal)}</span>
          </div>
        </section>
      )}

      {/* Terms */}
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          disabled={confirmed}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
        />
        <span>I have read and accept the Terms &amp; Conditions.</span>
      </label>

      {confirmed && (
        <div
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          {orderNumber ? `Order ${orderNumber} has been created successfully.` : "Your order has been created successfully."}
        </div>
      )}

      {confirmError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {confirmError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <Link
          href="/checkout/addons"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Back
        </Link>
        <button
          type="button"
          onClick={confirmOrder}
          disabled={!canConfirm}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {confirming ? "Creating Order..." : confirmed ? "Order Created" : "Confirm Order"}
        </button>
      </div>
    </div>
  );
}
