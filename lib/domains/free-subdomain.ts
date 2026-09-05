import "server-only";
import { createDomain, isDeSecConfigured, upsertDnsRecord, DESEC_NAMESERVERS } from "@/lib/desec/client";
import type { DomainRegistrationOutcome } from "./registrar";

export const SITES_BD_ROOT = "sites.bd";

export function isFreeSitesBdSubdomain(domainName: string): boolean {
  return domainName.trim().toLowerCase().endsWith(`.${SITES_BD_ROOT}`);
}

/**
 * Actually provisions a free SITES.BD subdomain in deSEC, instead of just
 * recording it in our own database:
 *  1. creates it as its own zone (POST /domains/), and
 *  2. delegates to that zone from the `sites.bd` zone with NS records,
 * so the subdomain is real and resolvable the moment the order completes.
 * Falls back to `pending` (matching every other DNS write in this app —
 * see lib/desec/client.ts) if deSEC isn't configured or the calls fail.
 */
export async function provisionFreeSubdomain(domainName: string, now: string): Promise<DomainRegistrationOutcome> {
  if (!isDeSecConfigured()) {
    return { status: "pending", registeredAt: null, note: "DNS provider not configured yet; subdomain saved locally only." };
  }
  try {
    await createDomain(domainName);
    for (const nameserver of DESEC_NAMESERVERS) {
      await upsertDnsRecord({ domain: SITES_BD_ROOT, type: "NS", name: domainName, content: nameserver, ttl: 3600 });
    }
    return { status: "active", registeredAt: now };
  } catch (error) {
    return {
      status: "pending",
      registeredAt: null,
      note: error instanceof Error ? `deSEC provisioning failed: ${error.message}` : "deSEC provisioning failed.",
    };
  }
}
