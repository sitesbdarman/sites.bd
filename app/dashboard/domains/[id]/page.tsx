import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DomainInfoCard } from "@/components/dashboard/DomainInfoCard";
import { NameserverSection } from "@/components/dashboard/NameserverSection";
import { NameserverManager } from "@/components/dashboard/NameserverManager";
import { DnsManager } from "@/components/dashboard/DnsManager";
import { StatusBadge, type DashboardStatus } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { GlobeIcon } from "@/components/dashboard/icons";
import { getDomainById } from "@/lib/domains/queries";

interface DomainDetailsPageProps {
  params: Promise<{ id: string }>;
}

const BACK_LINK = (
  <Link
    href="/dashboard/domains"
    className="inline-flex w-fit items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
  >
    ← Back to My Domains
  </Link>
);

/**
 * Single domain's read-only details, scoped to the authenticated owner.
 *
 * Ownership is enforced in `getDomainById`: the query filters on both
 * the route's `id` AND `owner_id = user.id` (the session user, never a
 * client-supplied value), with RLS (`domains_select_own`) as the real
 * boundary underneath regardless. A domain that doesn't exist and a
 * domain that belongs to someone else are handled identically — both
 * render the same "not found" state, so the page never confirms or
 * denies another user's domain by its response.
 */
export default async function DomainDetailsPage({ params }: DomainDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <DashboardLayout pageTitle="Domain Details" userEmail={null}>
        <NotFoundState />
      </DashboardLayout>
    );
  }

  const { domain, status } = await getDomainById(supabase, id, user.id);

  if (status === "error") {
    return (
      <DashboardLayout pageTitle="Domain Details" userEmail={user.email ?? null}>
        <div className="flex flex-col gap-4">
          {BACK_LINK}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <EmptyState
              icon={GlobeIcon}
              message="We couldn't load this domain right now. Please try again shortly."
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (status === "not_found" || !domain) {
    return (
      <DashboardLayout pageTitle="Domain Details" userEmail={user.email ?? null}>
        <NotFoundState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Domain Details" userEmail={user.email ?? null}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {BACK_LINK}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
              {domain.domain_name}
            </h1>
            <StatusBadge status={domain.status as DashboardStatus} />
          </div>
        </div>

        <DomainInfoCard domain={domain} />

        <NameserverSection nameservers={[domain.nameserver1, domain.nameserver2, domain.nameserver3, domain.nameserver4].filter(Boolean) as string[]} />
        <NameserverManager domainId={domain.id} initial={[domain.nameserver1, domain.nameserver2, domain.nameserver3, domain.nameserver4].filter(Boolean) as string[]} />
        <DnsManager domainId={domain.id} />
      </div>
    </DashboardLayout>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col gap-4">
      {BACK_LINK}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <EmptyState icon={GlobeIcon} message="Domain not found." />
      </div>
    </div>
  );
}
