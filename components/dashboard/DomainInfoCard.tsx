import type { Domain } from "@/lib/domains/queries";

interface DomainInfoCardProps {
  domain: Domain;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-2.5">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

/**
 * Shows only fields that actually exist on `public.domains`
 * (see database/0002_domains.sql). Purchase price, renewal price,
 * hosting type, verification status, and any linked hosting/service
 * record are not modeled in the schema yet, so they're intentionally
 * left out rather than shown as fake placeholders.
 */
export function DomainInfoCard({ domain }: DomainInfoCardProps) {
  const registered = formatDate(domain.registered_at);
  const expires = formatDate(domain.expires_at);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Domain Information</h2>
      <dl className="mt-2 divide-y divide-gray-100 sm:mt-1">
        <InfoRow label="Domain Name" value={domain.domain_name} />
        {registered && <InfoRow label="Registration Date" value={registered} />}
        {expires && <InfoRow label="Expiry Date" value={expires} />}
        <InfoRow label="Auto Renewal" value={domain.auto_renew ? "On" : "Off"} />
      </dl>
    </div>
  );
}
