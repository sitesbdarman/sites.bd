import "server-only";
import type { DomainRegistrar } from "./registrar";
import { ManualDomainRegistrar } from "./registrars/manual-registrar";

export function getDomainRegistrar(): DomainRegistrar {
  // TODO: once a reseller API (ResellerClub, Enom, OpenSRS, Namecheap
  // Reseller, etc.) is integrated, return that implementation here instead
  // — no other caller needs to change, see lib/domains/registration-service.ts.
  return new ManualDomainRegistrar();
}
