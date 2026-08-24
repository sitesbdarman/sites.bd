import "server-only";
import { cookies } from "next/headers";
import { singleDomainSchema } from "@/lib/validation/domains";

/**
 * Pre-login cart persistence for guests.
 *
 * Stores only a deduped list of validated domain name strings in an
 * httpOnly cookie — no ids, no prices, nothing sensitive. Price is always
 * (re)computed server-side at merge time from lib/domains/pricing.ts, and
 * availability is re-checked at merge time too — the cookie is never
 * trusted as anything more than "domains this browser wants to claim".
 */
const GUEST_CART_COOKIE = "guest_cart";
const MAX_GUEST_CART_ITEMS = 20;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function parseGuestCartCookie(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const domains: string[] = [];
    for (const value of parsed) {
      if (typeof value !== "string") continue;
      const result = singleDomainSchema.safeParse(value);
      if (result.success && !domains.includes(result.data)) {
        domains.push(result.data);
      }
    }
    return domains.slice(0, MAX_GUEST_CART_ITEMS);
  } catch {
    return [];
  }
}

export async function getGuestCartDomains(): Promise<string[]> {
  const store = await cookies();
  return parseGuestCartCookie(store.get(GUEST_CART_COOKIE)?.value);
}

export type AddToGuestCartResult =
  | { ok: true; domains: string[] }
  | { ok: false; reason: "duplicate" | "cart_full"; domains: string[] };

export async function addToGuestCart(domain: string): Promise<AddToGuestCartResult> {
  const store = await cookies();
  const current = parseGuestCartCookie(store.get(GUEST_CART_COOKIE)?.value);

  if (current.includes(domain)) {
    return { ok: false, reason: "duplicate", domains: current };
  }

  if (current.length >= MAX_GUEST_CART_ITEMS) {
    return { ok: false, reason: "cart_full", domains: current };
  }

  const updated = [...current, domain];
  store.set(GUEST_CART_COOKIE, JSON.stringify(updated), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return { ok: true, domains: updated };
}

export async function clearGuestCart(): Promise<void> {
  const store = await cookies();
  store.delete(GUEST_CART_COOKIE);
}
