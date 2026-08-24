import "server-only";
import { getWhoisProvider } from "./provider-factory";
import type { WhoisLookupStatus, WhoisRecord } from "./provider";

export interface WhoisLookupOutcome {
  status: WhoisLookupStatus;
  record: WhoisRecord | null;
  isMock: boolean;
  providerName: string;
}

/**
 * WHOIS service layer: page -> API route -> here -> provider. Keeps the
 * provider swap-out isolated behind one call, same shape as
 * lib/domains/search-service.ts, so the API route never talks to a
 * provider directly.
 *
 * Caching note: intentionally not cached yet (kept lightweight per this
 * step's scope). If added later, this is the right seam for it — wrap
 * provider.lookup() here so the API route and provider stay untouched.
 */
export async function lookupWhois(domain: string): Promise<WhoisLookupOutcome> {
  const provider = getWhoisProvider();
  const { status, record } = await provider.lookup(domain);

  return {
    status,
    record,
    isMock: provider.isMock,
    providerName: provider.name,
  };
}
