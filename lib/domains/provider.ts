import "server-only";

export type DomainAvailabilityStatus = "available" | "unavailable" | "unknown";

export interface DomainAvailability {
  domain: string;
  available: boolean;
  status: DomainAvailabilityStatus;
}

/**
 * Abstraction over "can this domain be registered right now". Swap the
 * implementation returned by getDomainProvider() (lib/domains/provider-factory.ts)
 * for a real registrar/availability API (RDAP, a registrar's REST API, etc.)
 * without touching the API route, service layer, or UI — all of them only
 * depend on this interface.
 */
export interface DomainProvider {
  /** Human-readable identifier, surfaced in logs/errors — never shown to end users. */
  readonly name: string;
  /** True if results are placeholder data rather than a real registry lookup. */
  readonly isMock: boolean;
  checkAvailability(domains: string[]): Promise<DomainAvailability[]>;
}
