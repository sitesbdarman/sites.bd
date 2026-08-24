import "server-only";
import type { DomainProvider } from "./provider";
import { RdapDomainProvider } from "./providers/rdap-provider";

export function getDomainProvider(): DomainProvider {
  return new RdapDomainProvider();
}
