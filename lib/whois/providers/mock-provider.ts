import "server-only";
import { createHash } from "crypto";
import type { WhoisLookupResult, WhoisProvider } from "../provider";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * DEVELOPMENT-ONLY placeholder provider. No real WHOIS/RDAP server is
 * consulted — the record is derived deterministically from the domain
 * string itself purely so the UI has something stable to render, NOT
 * because it reflects a real registrant. `isMock: true` lets every caller
 * (API route, page) know to label this as placeholder data rather than
 * present it as a real WHOIS lookup.
 *
 * Replace with a real provider (an RDAP client, a WHOIS API vendor, etc.)
 * that implements the same WhoisProvider interface — see
 * lib/whois/provider-factory.ts — before this is used in production.
 */
export class MockWhoisProvider implements WhoisProvider {
  readonly name = "mock";
  readonly isMock = true;

  async lookup(domain: string): Promise<WhoisLookupResult> {
    const hash = createHash("sha256").update(domain).digest();

    // Deterministic placeholder dates: "registered" 1-10 years ago,
    // "expiring" 0-2 years from now. Arbitrary — not real registry data.
    const yearsAgo = 1 + (hash[1]! % 10);
    const daysUntilExpiry = (hash[2]! % 730) - 90;
    const now = Date.now();
    const registrationDate = new Date(now - yearsAgo * 365 * DAY_MS).toISOString();
    const expiryDate = new Date(now + daysUntilExpiry * DAY_MS).toISOString();

    return {
      status: "found",
      record: {
        domain,
        registrantFullName: "Mock Registrant (placeholder data)",
        registrantEmail: "mock-registrant@example-mock.test",
        registrationDate,
        expiryDate,
      },
    };
  }
}
