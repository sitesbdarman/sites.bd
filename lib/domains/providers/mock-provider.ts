import "server-only";
import { createHash } from "crypto";
import type { DomainAvailability, DomainProvider } from "../provider";

/**
 * DEVELOPMENT-ONLY placeholder provider. No real registry/registrar is
 * consulted — availability is derived deterministically from the domain
 * string itself purely so the UI has something stable to render, NOT
 * because it reflects reality. `isMock: true` lets every caller (API
 * route, UI) know to label results as placeholder data rather than
 * present them as real availability.
 *
 * Replace with a real provider (RDAP lookup, registrar API, etc.) that
 * implements the same DomainProvider interface — see
 * lib/domains/provider-factory.ts — before this is used in production.
 */
export class MockDomainProvider implements DomainProvider {
  readonly name = "mock";
  readonly isMock = true;

  async checkAvailability(domains: string[]): Promise<DomainAvailability[]> {
    return domains.map((domain) => {
      const hash = createHash("sha256").update(domain).digest();
      // Arbitrary placeholder split (~35% "available") just to vary the
      // demo UI — not a real probability of anything.
      const available = hash[0]! % 20 < 7;
      return {
        domain,
        available,
        status: available ? "available" : "unavailable",
      };
    });
  }
}
