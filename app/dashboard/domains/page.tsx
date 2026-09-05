import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DomainList } from "@/components/dashboard/DomainList";
import { ExpiryBanner } from "@/components/dashboard/ExpiryBanner";
import { GlobeIcon } from "@/components/dashboard/icons";
import { getUserDomains } from "@/lib/domains/queries";
import Link from "next/link";

/**
 * Authenticated user's full domain list. Ownership is enforced two ways:
 * the query below is scoped to the signed-in user's id (from the server
 * session, never a client-supplied value), and RLS
 * (`domains_select_own`, auth.uid() = owner_id) is the real boundary
 * that applies regardless.
 */
export default async function DomainsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let domains: Awaited<ReturnType<typeof getUserDomains>>["data"] = [];
  let hasError = false;

  if (user) {
    const result = await getUserDomains(supabase, user.id);
    domains = result.data;
    hasError = result.error;
  }

  return (
    <DashboardLayout pageTitle="My Domains" userEmail={user?.email ?? null}>
      <ExpiryBanner domains={domains} />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-bold text-gray-900">Need another domain?</h2><p className="mt-1 text-sm text-gray-600">Search and purchase a new domain or get a free SITES.BD subdomain.</p></div>
        <Link href="/domains/search" className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-extrabold text-white transition hover:bg-blue-700">+ Buy / Add New Domain</Link>
      </div>
      <div className="surface overflow-hidden p-3 sm:p-5">
        {hasError ? (
          <EmptyState
            icon={GlobeIcon}
            message="We couldn't load your domains right now. Please try again shortly."
          />
        ) : (
          <DomainList domains={domains} />
        )}
      </div>
    </DashboardLayout>
  );
}
