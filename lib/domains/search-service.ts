import "server-only";
import { getDomainProvider } from "./provider-factory";
import type { DomainAvailability } from "./provider";

export type DomainSearchResult = DomainAvailability;

export interface DomainSearchOutcome {
  results: DomainSearchResult[];
  isMock: boolean;
  providerName: string;
}

/**
 * Domain service layer: UI -> API route -> here -> provider. Keeps the
 * provider swap-out isolated behind one call so the API route never talks
 * to a provider directly.
 */
export async function checkDomainsAvailability(
  domains: string[],
): Promise<DomainSearchOutcome> {
  const provider = getDomainProvider();
  const results = await provider.checkAvailability(domains);

  return {
    results,
    isMock: provider.isMock,
    providerName: provider.name,
  };
}
