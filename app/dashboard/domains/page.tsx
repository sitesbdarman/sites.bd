import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DomainList } from "@/components/dashboard/DomainList";
import { GlobeIcon } from "@/components/dashboard/icons";
import { getUserDomains } from "@/lib/domains/queries";

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
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
