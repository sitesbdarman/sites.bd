import Link from "next/link";

interface ExpiryBannerDomain {
  domain_name: string;
  status: string;
  expires_at: string | null;
}

interface ExpiryBannerProps {
  domains: ExpiryBannerDomain[];
  /** Only warn about domains expiring within this many days. */
  withinDays?: number;
}

/**
 * Server-rendered banner warning about domains that are active but expire
 * soon. Pure function of the already-fetched domain list — no extra
 * request, so it's safe to drop into any page that already loads domains
 * (dashboard home, domains list).
 */
export function ExpiryBanner({ domains, withinDays = 30 }: ExpiryBannerProps) {
  // eslint-disable-next-line react-hooks/purity -- server component rendered fresh per request; "now" only needs to be roughly current, not memoized/deterministic.
  const now = Date.now();
  const soon = domains
    .filter((d) => d.status === "active" && d.expires_at)
    .map((d) => ({
      domain: d.domain_name,
      daysLeft: Math.ceil((new Date(d.expires_at as string).getTime() - now) / (24 * 60 * 60 * 1000)),
    }))
    .filter((d) => d.daysLeft >= 0 && d.daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (soon.length === 0) return null;

  const urgent = soon.some((d) => d.daysLeft <= 7);
  const headline =
    soon.length === 1
      ? `${soon[0]!.domain} expires in ${soon[0]!.daysLeft} day${soon[0]!.daysLeft === 1 ? "" : "s"}`
      : `${soon.length} domains are expiring within ${withinDays} days`;

  return (
    <div
      className={`mb-4 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        urgent ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <div>
        <p className={`font-bold ${urgent ? "text-red-800" : "text-amber-800"}`}>{headline}</p>
        <p className={`mt-1 text-sm ${urgent ? "text-red-700" : "text-amber-700"}`}>
          {soon.slice(0, 3).map((d) => d.domain).join(", ")}
          {soon.length > 3 ? `, +${soon.length - 3} more` : ""} — renew to avoid losing service.
        </p>
      </div>
      <Link
        href="/dashboard/domains"
        className={`shrink-0 rounded-xl px-5 py-3 text-center text-sm font-extrabold text-white transition ${
          urgent ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
        }`}
      >
        Renew now
      </Link>
    </div>
  );
}
