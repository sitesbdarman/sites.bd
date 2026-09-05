import "server-only";

const BASE_URL = process.env.DESEC_BASE_URL || "https://desec.io/api/v1";

function getToken() {
  const token = process.env.DESEC_API_TOKEN?.trim();
  return token || null;
}

function apiPath(domain: string, subname: string, type: string) {
  const normalizedSubname = subname || "@";
  return `/domains/${encodeURIComponent(domain)}/rrsets/${encodeURIComponent(normalizedSubname)}/${encodeURIComponent(type)}/`;
}

async function deSecFetch(path: string, init?: RequestInit) {
  const token = getToken();
  if (!token) throw new Error("deSEC is not configured yet.");

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!response.ok) {
    throw new Error(`deSEC API request failed (${response.status}): ${describeDeSecError(data) ?? String(text || response.statusText)}`);
  }
  return data;
}

// deSEC returns DRF-style validation errors, e.g.
// {"records":["Must be a list."]} or {"non_field_errors":["RRset already exists."]}.
// Flattening these into one readable sentence is much friendlier in the UI
// than the raw JSON blob the customer saw before ("non_field_errors": [...]).
function describeDeSecError(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const messages: string[] = [];
  for (const [field, value] of Object.entries(data as Record<string, unknown>)) {
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    messages.push(field === "non_field_errors" ? text : `${field}: ${text}`);
  }
  return messages.length ? messages.join(" ") : null;
}

export function isDeSecConfigured() {
  return Boolean(getToken());
}

// deSEC serves every zone in an account from the same two authoritative
// nameservers, regardless of the domain — there is no per-domain NS to look
// up after creation. See https://desec.readthedocs.io.
export const DESEC_NAMESERVERS = ["ns1.desec.io", "ns2.desec.org"];

// Creates a new zone in the deSEC account (POST /domains/). Used when a
// domain needs its own zone — e.g. a free SITES.BD subdomain, which is
// delegated to from the `sites.bd` zone via NS records (see
// lib/domains/free-subdomain.ts). A zone that already exists is treated as
// success rather than an error, since provisioning is retried on failure.
export async function createDomain(name: string) {
  try {
    return await deSecFetch(`/domains/`, {
      method: "POST",
      body: JSON.stringify({ name: name.trim().toLowerCase() }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("this field must be unique")) return null;
    throw error;
  }
}

export type DeSecRRset = {
  name: string;
  subname?: string;
  type: string;
  ttl: number;
  records: string[];
};

function toSubname(domain: string, name: string) {
  const cleanDomain = domain.trim().replace(/\.$/, "").toLowerCase();
  const cleanName = name.trim().replace(/\.$/, "");
  if (!cleanName || cleanName === "@" || cleanName.toLowerCase() === cleanDomain) return "@";
  const suffix = `.${cleanDomain}`;
  if (cleanName.toLowerCase().endsWith(suffix)) {
    return cleanName.slice(0, -suffix.length) || "@";
  }
  return cleanName;
}

function fromSubname(domain: string, subname: string) {
  const cleanDomain = domain.trim().replace(/\.$/, "");
  if (!subname || subname === "@") return cleanDomain;
  return `${subname}.${cleanDomain}`;
}

// deSEC (like any RFC 1035-compliant DNS API) requires each TXT record's
// RDATA to be given as a quoted character-string, e.g. `"some value"`. A
// bare `vc-domain-verify=...` is rejected with the exact 400 the customer
// hit ("Data for TXT records must be given using quotation marks."). We
// keep the *unquoted* value in Supabase (what the user typed / sees in the
// UI) and only quote it right before it goes to deSEC, then unquote it
// again when reading records back for display.
function quoteTxtValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) return trimmed;
  const escaped = trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function unquoteTxtValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return trimmed;
}

// deSEC requires hostname-type targets (CNAME/MX/NS) to be given as a
// fully-qualified domain name with a trailing dot, e.g. `mail.example.com.`
// — a bare `mail.example.com` (what most users naturally type) is rejected.
// We normalize it here rather than making the user remember the dot.
function canonicalizeHost(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

// Builds the exact record string deSEC expects on the wire for a given
// record type, given the (unmodified, user-facing) content stored in our
// own `dns_records` table plus — for MX — the priority.
function toProviderContent(type: string, content: string, priority?: number | null): string {
  switch (type) {
    case "TXT":
      return quoteTxtValue(content);
    case "CNAME":
    case "NS":
      return canonicalizeHost(content);
    case "MX":
      return `${priority ?? 10} ${canonicalizeHost(content)}`;
    default:
      return content.trim();
  }
}

export async function listDnsRecords(domain: string) {
  const data = await deSecFetch(`/domains/${encodeURIComponent(domain)}/rrsets/`);
  const rrsets = Array.isArray(data) ? data as DeSecRRset[] : [];
  return rrsets.flatMap((rrset) => rrset.records.map((content, index) => {
    const isMx = rrset.type === "MX";
    const [prio, ...hostParts] = isMx ? content.split(/\s+/) : [];
    return {
      id: `${rrset.type}:${rrset.subname || "@"}:${index}`,
      type: rrset.type,
      name: fromSubname(domain, rrset.subname || ""),
      content: rrset.type === "TXT" ? unquoteTxtValue(content) : isMx ? hostParts.join(" ") : content,
      ttl: rrset.ttl,
      priority: isMx ? Number(prio) || null : null,
      status: "active",
      providerRecordId: `${rrset.type}:${rrset.subname || "@"}:${index}`,
    };
  }));
}

export async function upsertDnsRecord(input: {
  domain: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number | null;
}) {
  const subname = toSubname(input.domain, input.name);
  const path = apiPath(input.domain, subname, input.type);
  const providerContent = toProviderContent(input.type, input.content, input.priority);

  // RFC 1034/1035 rule: a CNAME RRset cannot coexist with any other RRset
  // at the same owner name. This check prevents the opaque deSEC 400 that
  // otherwise appears when, for example, `database` already has A/MX/TXT.
  const allResponse = await fetch(`${BASE_URL}/domains/${encodeURIComponent(input.domain)}/rrsets/`, {
    headers: { Authorization: `Token ${getToken()}` },
    cache: "no-store",
  });
  if (!allResponse.ok) {
    const text = await allResponse.text();
    throw new Error(`deSEC API request failed (${allResponse.status}): ${text}`);
  }
  const allData = await allResponse.json() as DeSecRRset[];
  const sameName = allData.filter((rrset) => (rrset.subname || "@") === subname);
  const existingOtherTypes = sameName.filter((rrset) => rrset.type !== input.type);
  const existingCname = sameName.find((rrset) => rrset.type === "CNAME");

  if (input.type === "CNAME" && existingOtherTypes.length) {
    const types = Array.from(new Set(existingOtherTypes.map((rrset) => rrset.type))).join(", ");
    throw new Error(
      `CNAME conflict at \`${subname === "@" ? "@" : subname}\`. Existing ${types} record(s) use this name. Remove or replace the conflicting record(s) first; system TXT/NS records are protected.`
    );
  }

  if (input.type !== "CNAME" && existingCname) {
    throw new Error(
      `This name already has a CNAME record. A ${input.type} record cannot be added alongside CNAME. Remove the existing CNAME first.`
    );
  }

  const existingResponse = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Token ${getToken()}` },
    cache: "no-store",
  });

  if (existingResponse.ok) {
    const existing = await existingResponse.json() as DeSecRRset;
    const records = input.type === "CNAME"
      ? [providerContent]
      : Array.from(new Set([...(existing.records || []), providerContent]));
    return deSecFetch(path, {
      method: "PUT",
      body: JSON.stringify({
        subname: subname === "@" ? "" : subname,
        type: input.type,
        ttl: input.ttl,
        records,
      }),
    });
  }

  if (existingResponse.status !== 404) {
    const text = await existingResponse.text();
    throw new Error(`deSEC API request failed (${existingResponse.status}): ${text}`);
  }

  return deSecFetch(`/domains/${encodeURIComponent(input.domain)}/rrsets/`, {
    method: "POST",
    body: JSON.stringify({
      subname: subname === "@" ? "" : subname,
      type: input.type,
      ttl: input.ttl,
      records: [providerContent],
    }),
  });
}

export async function deleteDnsRecord(input: {
  domain: string;
  type: string;
  name: string;
  content: string;
  priority?: number | null;
}) {
  const subname = toSubname(input.domain, input.name);
  const path = apiPath(input.domain, subname, input.type);
  const providerContent = toProviderContent(input.type, input.content, input.priority);
  const existingResponse = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Token ${getToken()}` },
    cache: "no-store",
  });
  if (existingResponse.status === 404) return null;
  if (!existingResponse.ok) {
    const text = await existingResponse.text();
    throw new Error(`deSEC API request failed (${existingResponse.status}): ${text}`);
  }

  const existing = await existingResponse.json() as DeSecRRset;
  const remaining = (existing.records || []).filter((record) => record !== providerContent);

  if (remaining.length === 0) {
    return deSecFetch(path, { method: "DELETE" });
  }

  return deSecFetch(path, {
    method: "PUT",
    body: JSON.stringify({
      subname: subname === "@" ? "" : subname,
      type: input.type,
      ttl: existing.ttl,
      records: remaining,
    }),
  });
}
