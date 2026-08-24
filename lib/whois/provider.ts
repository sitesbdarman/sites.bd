import "server-only";

/**
 * Deliberately narrow — only the fields this project is allowed to show
 * (see app/domains/whois). A real WHOIS/RDAP response has far more (address,
 * phone, nameservers, registrar internals, abuse/tech contacts...); the
 * provider is responsible for reducing to this shape so nothing broader
 * ever reaches the API response or the client.
 */
export interface WhoisRecord {
  domain: string;
  registrantFullName: string | null;
  registrantEmail: string | null;
  /** ISO 8601 date string, or null if unknown/redacted. */
  registrationDate: string | null;
  /** ISO 8601 date string, or null if unknown/redacted. */
  expiryDate: string | null;
}

export type WhoisLookupStatus = "found" | "not_found" | "error";

export interface WhoisLookupResult {
  status: WhoisLookupStatus;
  record: WhoisRecord | null;
}

/**
 * Abstraction over "look up WHOIS/registration info for a domain". Swap the
 * implementation returned by getWhoisProvider() (lib/whois/provider-factory.ts)
 * for a real WHOIS/RDAP client without touching the API route or page —
 * both only depend on this interface.
 */
export interface WhoisProvider {
  /** Human-readable identifier, surfaced in logs/errors — never shown to end users. */
  readonly name: string;
  /** True if results are placeholder data rather than a real WHOIS/RDAP lookup. */
  readonly isMock: boolean;
  lookup(domain: string): Promise<WhoisLookupResult>;
}
