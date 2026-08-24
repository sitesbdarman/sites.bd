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
    const detail = typeof data === "object" && data !== null
      ? JSON.stringify(data)
      : String(data || response.statusText);
    throw new Error(`deSEC API request failed (${response.status}): ${detail}`);
  }
  return data;
}

export function isDeSecConfigured() {
  return Boolean(getToken());
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

export async function listDnsRecords(domain: string) {
  const data = await deSecFetch(`/domains/${encodeURIComponent(domain)}/rrsets/`);
  const rrsets = Array.isArray(data) ? data as DeSecRRset[] : [];
  return rrsets.flatMap((rrset) => rrset.records.map((content, index) => ({
    id: `${rrset.type}:${rrset.subname || "@"}:${index}`,
    type: rrset.type,
    name: fromSubname(domain, rrset.subname || ""),
    content,
    ttl: rrset.ttl,
    priority: rrset.type === "MX" ? Number(content.split(/\s+/, 1)[0]) || null : null,
    status: "active",
    providerRecordId: `${rrset.type}:${rrset.subname || "@"}:${index}`,
  })));
}

export async function upsertDnsRecord(input: {
  domain: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
}) {
  const subname = toSubname(input.domain, input.name);
  const path = apiPath(input.domain, subname, input.type);

  const existingResponse = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Token ${getToken()}` },
    cache: "no-store",
  });

  if (existingResponse.ok) {
    const existing = await existingResponse.json() as DeSecRRset;
    const records = Array.from(new Set([...(existing.records || []), input.content]));
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
      records: [input.content],
    }),
  });
}

export async function deleteDnsRecord(input: {
  domain: string;
  type: string;
  name: string;
  content: string;
}) {
  const subname = toSubname(input.domain, input.name);
  const path = apiPath(input.domain, subname, input.type);
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
  const remaining = (existing.records || []).filter((record) => record !== input.content);

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
