import "server-only";
import type { DomainAvailability, DomainProvider } from "../provider";
import { fetchRdapDomain } from "@/lib/rdap/client";

export class RdapDomainProvider implements DomainProvider {
  readonly name = "rdap";
  readonly isMock = false;

  async checkAvailability(domains: string[]): Promise<DomainAvailability[]> {
    return Promise.all(domains.map(async (domain) => {
      try {
        const record = await fetchRdapDomain(domain);
        return {
          domain,
          available: record === null,
          status: record === null ? "available" : "unavailable",
        } as DomainAvailability;
      } catch {
        return { domain, available: false, status: "unknown" } as DomainAvailability;
      }
    }));
  }
}
