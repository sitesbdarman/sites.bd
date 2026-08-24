import type { BillingCycle, HostingPlanType } from "./plans";

/**
 * The hosting choice made in Checkout Step 1, carried forward to later
 * checkout steps (add-ons, review, payment — not built yet). Persisted in
 * sessionStorage rather than a new DB table since no checkout/order record
 * exists at this stage; this is scoped to the current browser tab only.
 */
export interface HostingSelection {
  type: HostingPlanType;
  planId: string;
  planName: string;
  price: number;
  billingCycle: BillingCycle;
  /** Only present when type === "custom". */
  custom?: {
    nameServer: string;
    ipAddress: string;
  };
}

const STORAGE_KEY = "checkout.hosting";

export function saveHostingSelection(selection: HostingSelection): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}

export function loadHostingSelection(): HostingSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HostingSelection) : null;
  } catch {
    return null;
  }
}
