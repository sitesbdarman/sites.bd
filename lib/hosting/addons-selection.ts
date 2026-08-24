/**
 * The add-on choice made in Checkout Step 2, carried forward to later
 * checkout steps (review, payment — not built yet). Persisted in
 * sessionStorage, same as hosting/selection.ts, scoped to the current tab.
 */
export interface AddonsSelection {
  /** Empty array means "No Additional Service". */
  addonIds: string[];
}

const STORAGE_KEY = "checkout.addons";

export function saveAddonsSelection(selection: AddonsSelection): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}

export function loadAddonsSelection(): AddonsSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AddonsSelection) : null;
  } catch {
    return null;
  }
}
