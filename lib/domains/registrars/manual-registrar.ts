import "server-only";
import type { DomainRegistrar, DomainRegistrationOutcome } from "../registrar";

/**
 * No reseller/registrar API is configured yet, so a purchased domain can't
 * actually be registered here. The order still succeeds — the domain is
 * saved as `pending` and an admin registers it manually (see the Domains
 * admin panel), then flips it to `active`. Once a real registrar is wired
 * up in lib/domains/registrar-factory.ts, this class is simply swapped out
 * and the same purchases become automatic.
 */
export class ManualDomainRegistrar implements DomainRegistrar {
  readonly name = "manual";
  readonly isAutomatic = false;

  async registerDomain(_domainName: string, _now: string): Promise<DomainRegistrationOutcome> {
    return {
      status: "pending",
      registeredAt: null,
      note: "Awaiting manual registration by admin — no registrar API is configured yet.",
    };
  }
}
