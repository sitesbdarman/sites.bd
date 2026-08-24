import "server-only";

export type RdapEntity = {
  roles?: string[];
  vcardArray?: [string, Array<[string, string, ...unknown[]]>];
};

export type RdapResponse = {
  ldhName?: string;
  status?: string[];
  events?: Array<{ eventAction?: string; eventDate?: string }>;
  entities?: RdapEntity[];
  nameservers?: Array<{ ldhName?: string }>;
};

type Bootstrap = { services: Array<[string[], string[]]> };

let bootstrapPromise: Promise<Bootstrap> | null = null;

async function getBootstrap(): Promise<Bootstrap> {
  if (!bootstrapPromise) {
    bootstrapPromise = fetch("https://data.iana.org/rdap/dns.json", {
      next: { revalidate: 86400 },
      headers: { Accept: "application/rdap+json, application/json" },
    }).then(async (response) => {
      if (!response.ok) throw new Error(`RDAP bootstrap failed: ${response.status}`);
      return response.json() as Promise<Bootstrap>;
    });
  }
  return bootstrapPromise;
}

function getTld(domain: string): string {
  const labels = domain.toLowerCase().split(".").filter(Boolean);
  return labels.at(-1) ?? "";
}

export async function getRdapBaseUrl(domain: string): Promise<string | null> {
  const bootstrap = await getBootstrap();
  const tld = getTld(domain);
  for (const [tlds, urls] of bootstrap.services) {
    if (tlds.map((value) => value.toLowerCase()).includes(tld)) {
      return urls[0] ?? null;
    }
  }
  return null;
}

export async function fetchRdapDomain(domain: string): Promise<RdapResponse | null> {
  const base = await getRdapBaseUrl(domain);
  if (!base) return null;
  const url = `${base.replace(/\/$/, "")}/domain/${encodeURIComponent(domain)}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/rdap+json, application/json" },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`RDAP domain lookup failed: ${response.status}`);
  return response.json() as Promise<RdapResponse>;
}
