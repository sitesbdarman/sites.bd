import "server-only";
import type { DomainRegistrationOutcome } from "./registrar";
import { getDomainRegistrar } from "./registrar-factory";
import { isFreeSitesBdSubdomain, provisionFreeSubdomain } from "./free-subdomain";

/**
 * Actually provisions a purchased domain instead of just inserting a
 * `domains` row and calling it done:
 *  - free `*.sites.bd` subdomains are created for real in deSEC
 *  - every other domain is handed to the configured registrar (currently a
 *    manual placeholder — see lib/domains/registrar-factory.ts)
 * Call this once per domain name, right before inserting/updating its
 * `domains` row, and use the returned status/registeredAt/note instead of
 * hardcoding `status: "active"`.
 */
export async function provisionDomain(domainName: string, now: string): Promise<DomainRegistrationOutcome> {
  if (isFreeSitesBdSubdomain(domainName)) {
    return provisionFreeSubdomain(domainName, now);
  }
  return getDomainRegistrar().registerDomain(domainName, now);
}
