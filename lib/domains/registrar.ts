import "server-only";

export interface DomainRegistrationOutcome {
  status: "active" | "pending";
  registeredAt: string | null;
  /** Admin-facing explanation, shown in the admin panel — never surfaced to the customer as-is. */
  note?: string;
}

/**
 * Abstraction over "actually register this domain with a real registrar".
 * Swap the implementation returned by getDomainRegistrar()
 * (lib/domains/registrar-factory.ts) for a reseller API (ResellerClub, Enom,
 * OpenSRS, Namecheap Reseller, etc.) once one is configured, without
 * touching checkout, payment approval, or the admin panel — they only
 * depend on this interface. Mirrors lib/domains/provider.ts.
 */
export interface DomainRegistrar {
  /** Human-readable identifier, surfaced in logs/errors — never shown to end users. */
  readonly name: string;
  /** True once a real registrar API is wired in; false for the manual placeholder. */
  readonly isAutomatic: boolean;
  registerDomain(domainName: string, now: string): Promise<DomainRegistrationOutcome>;
}
