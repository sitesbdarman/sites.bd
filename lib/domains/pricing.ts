import "server-only";
import { createHash } from "crypto";

export interface DomainPriceQuote {
  domain: string;
  price: number;
  currency: string;
  /** True if this is placeholder pricing rather than a real registry price. */
  isMock: boolean;
}

/**
 * DEVELOPMENT-ONLY placeholder pricing. No real registrar/pricing API is
 * consulted — price is derived deterministically from the domain's TLD
 * (plus a small hash-based variation) purely so the cart has something
 * stable to render, NOT because it reflects a real price. Mirrors the
 * same pattern as lib/domains/providers/mock-provider.ts.
 *
 * Replace with a real pricing source (registrar API, price list synced
 * from one, etc.) before this is used in production. Every caller must
 * keep computing price here server-side at add-to-cart time — never
 * trust a price the client sends.
 */
const BASE_PRICE_BY_TLD: Record<string, number> = {
  com: 12.99,
  net: 14.99,
  org: 13.99,
  io: 39.99,
  dev: 15.99,
  co: 24.99,
  app: 17.99,
};
const DEFAULT_BASE_PRICE = 19.99;
const DEFAULT_CURRENCY = "USD";

export function getDomainPriceQuote(domain: string): DomainPriceQuote {
  const normalized = domain.trim().toLowerCase();
  if (normalized.endsWith(".sites.bd")) return { domain: normalized, price: 0, currency: "BDT", isMock: false };
  const tld = normalized.split(".").pop() ?? "";
  const basePrice = BASE_PRICE_BY_TLD[tld] ?? DEFAULT_BASE_PRICE;

  // Arbitrary placeholder variation (0.00-0.99) just so the demo cart
  // doesn't show perfectly flat per-TLD prices — not a real price signal.
  const hash = createHash("sha256").update(domain).digest();
  const cents = hash[1]! % 100;
  const price = Math.round((basePrice + cents / 100) * 100) / 100;

  return { domain: normalized, price, currency: DEFAULT_CURRENCY, isMock: true };
}


export async function getLiveDomainPriceQuote(domain: string): Promise<DomainPriceQuote> {
  const normalized = domain.trim().toLowerCase();
  if (normalized.endsWith(".sites.bd")) return { domain: normalized, price: 0, currency: "BDT", isMock: false };
  const tld = normalized.split(".").pop() ?? "";
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const db = createAdminClient();
    const { data } = await db.from("domain_pricing").select("registration_price,currency").eq("tld", tld).eq("is_active", true).maybeSingle();
    if (data) return { domain: normalized, price: Number(data.registration_price || 0), currency: String(data.currency || "USD"), isMock: false };
  } catch {}
  return getDomainPriceQuote(normalized);
}
