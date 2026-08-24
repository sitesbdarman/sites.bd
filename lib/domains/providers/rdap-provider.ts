import "server-only";
import type { DomainAvailability, DomainProvider } from "../provider";
import { fetchRdapDomain } from "@/lib/rdap/client";
import { createAdminClient } from "@/lib/supabase/admin";

export class RdapDomainProvider implements DomainProvider {
  readonly name = "rdap";
  readonly isMock = false;

  async checkAvailability(domains: string[]): Promise<DomainAvailability[]> {
    const normalized = domains.map((d) => d.trim().toLowerCase());
    const sitesDomains = normalized.filter((d) => d.endsWith(".sites.bd"));
    let taken = new Set<string>();
    if (sitesDomains.length) {
      const db = createAdminClient();
      const { data } = await db.from("domains").select("domain_name").in("domain_name", sitesDomains);
      taken = new Set((data ?? []).map((row) => String(row.domain_name).toLowerCase()));
    }

    return Promise.all(normalized.map(async (domain) => {
      // SITES.BD subdomains are controlled locally and are always free;
      // availability is based on our own domain table, not public RDAP.
      if (domain.endsWith(".sites.bd")) {
        const available = !taken.has(domain);
        return { domain, available, status: available ? "available" : "unavailable" };
      }
      try {
        const record = await fetchRdapDomain(domain);
        return { domain, available: record === null, status: record === null ? "available" : "unavailable" } as DomainAvailability;
      } catch {
        return { domain, available: false, status: "unknown" } as DomainAvailability;
      }
    }));
  }
}
