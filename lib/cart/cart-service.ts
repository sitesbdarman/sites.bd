import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkDomainsAvailability } from "@/lib/domains/search-service";
import { getLiveDomainPriceQuote } from "@/lib/domains/pricing";
import { addCartItem, type CartItem } from "./queries";

/** Cart/claim service layer: API route -> here -> queries/provider. Keeps
 * availability re-verification and pricing in one place so both the
 * normal "Claim" flow and the guest-cart merge flow use the exact same
 * checks rather than two slightly different copies. */

export const DEFAULT_VALIDITY_YEARS = 1;

export type ClaimDomainStatus = "added" | "duplicate" | "unavailable" | "error";

export interface ClaimDomainResult {
  status: ClaimDomainStatus;
  item: CartItem | null;
}

/**
 * Adds one domain to a signed-in user's cart.
 *
 * Never trusts the client beyond the domain string itself: availability
 * is re-checked here (a domain shown as "available" in an earlier search
 * response isn't trusted to still be available) and price is always
 * (re)computed server-side from lib/domains/pricing.ts — never taken from
 * request input.
 */
export async function claimDomainForUser(
  supabase: SupabaseClient,
  userId: string,
  domain: string,
): Promise<ClaimDomainResult> {
  const availability = await checkDomainsAvailability([domain]);
  const result = availability.results[0];

  if (!result || !result.available) {
    return { status: "unavailable", item: null };
  }

  const quote = await getLiveDomainPriceQuote(domain);
  const added = await addCartItem(
    supabase,
    userId,
    domain,
    quote.price,
    quote.currency,
    DEFAULT_VALIDITY_YEARS,
  );

  if (added.status === "added") {
    return { status: "added", item: added.item };
  }
  if (added.status === "duplicate") {
    return { status: "duplicate", item: null };
  }
  return { status: "error", item: null };
}

export interface MergeGuestCartResult {
  mergedCount: number;
  skippedCount: number;
}

/**
 * Merges a guest's pre-login domain list into their now-authenticated
 * cart. Reuses claimDomainForUser for every domain so merge goes through
 * the exact same availability + pricing + duplicate-prevention path as a
 * normal claim — nothing about arriving via the guest cart skips a check.
 */
export async function mergeGuestCartIntoAccount(
  supabase: SupabaseClient,
  userId: string,
  guestDomains: string[],
): Promise<MergeGuestCartResult> {
  let mergedCount = 0;
  let skippedCount = 0;

  for (const domain of guestDomains) {
    const result = await claimDomainForUser(supabase, userId, domain);
    if (result.status === "added") {
      mergedCount += 1;
    } else {
      skippedCount += 1;
    }
  }

  return { mergedCount, skippedCount };
}
