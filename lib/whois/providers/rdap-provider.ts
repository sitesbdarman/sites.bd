import "server-only";
import type { WhoisProvider, WhoisLookupResult } from "../provider";
import { fetchRdapDomain, type RdapEntity } from "@/lib/rdap/client";

function getVcardValue(entity: RdapEntity | undefined, field: string): string | null {
  const entries = entity?.vcardArray?.[1] ?? [];
  const item = entries.find((entry) => entry[0] === field);
  const value = item?.[3] ?? item?.[1];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function findEntity(entities: RdapEntity[] | undefined, role: string): RdapEntity | undefined {
  return entities?.find((entity) => entity.roles?.includes(role));
}

function eventDate(events: Array<{ eventAction?: string; eventDate?: string }> | undefined, action: string): string | null {
  return events?.find((event) => event.eventAction === action)?.eventDate ?? null;
}

export class RdapWhoisProvider implements WhoisProvider {
  readonly name = "rdap";
  readonly isMock = false;

  async lookup(domain: string): Promise<WhoisLookupResult> {
    try {
      const rdap = await fetchRdapDomain(domain);
      if (!rdap) return { status: "not_found", record: null };

      const registrant = findEntity(rdap.entities, "registrant");
      const admin = findEntity(rdap.entities, "administrative");
      const contact = registrant ?? admin;

      return {
        status: "found",
        record: {
          domain: rdap.ldhName?.toLowerCase() ?? domain,
          registrantFullName: getVcardValue(contact, "fn"),
          registrantEmail: getVcardValue(contact, "email"),
          registrationDate: eventDate(rdap.events, "registration"),
          expiryDate: eventDate(rdap.events, "expiration"),
        },
      };
    } catch {
      return { status: "error", record: null };
    }
  }
}
