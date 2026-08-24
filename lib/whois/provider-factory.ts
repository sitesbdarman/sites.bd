import "server-only";
import type { WhoisProvider } from "./provider";
import { RdapWhoisProvider } from "./providers/rdap-provider";

export function getWhoisProvider(): WhoisProvider {
  return new RdapWhoisProvider();
}
