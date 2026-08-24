import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  GlobeIcon,
  InboxIcon,
  InvoiceIcon,
  ServerIcon,
  TicketIcon,
} from "@/components/dashboard/icons";

/**
 * Shape of the columns this page reads from `public.profiles` (see
 * database/0001_foundation.sql). Kept minimal/local since
 * types/database.ts is still the untyped placeholder pending real
 * `supabase gen types` output — not hand-written full generated types.
 */
interface ProfileInfo {
  full_name: string | null;
  email: string;
  mobile_number: string | null;
}

/**
 * Dashboard home. This is only the UI foundation — every stat below is a
 * safe placeholder value and every section shows an honest empty state.
 * No domain/service/invoice/ticket data is queried yet; that's a later
 * phase once those tables/queries exist.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS on public.profiles only allows a user to select their own row
  // (auth.uid() = id), so this is already scoped to the signed-in user —
  // no explicit .eq("id", ...) filter is required to keep it safe, but it
  // narrows the query intent explicitly and avoids relying on RLS alone.
  let profile: ProfileInfo | null = null;
  if (user) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, mobile_number")
        .eq("id", user.id)
        .maybeSingle<ProfileInfo>();

      // No row (registration doesn't create one yet) and genuine query
      // failures are both handled the same way: fall back below rather
      // than surfacing a raw error or crashing the page.
      if (!error) {
        profile = data;
      }
    } catch {
      profile = null;
    }
  }

  const fullName = profile?.full_name?.trim() || null;
  const email = user?.email ?? null;
  const mobileNumber = profile?.mobile_number?.trim() || null;

  const [domainsResult, invoicesResult, ticketsResult, servicesResult] = user ? await Promise.all([
    supabase.from("domains").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("customer_id", user.id).eq("status", "unpaid"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("customer_id", user.id).in("status", ["open", "pending"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", user.id).in("status", ["active", "processing"]),
  ]) : [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }];
  const domainCount = domainsResult.count ?? 0;
  const invoiceCount = invoicesResult.count ?? 0;
  const ticketCount = ticketsResult.count ?? 0;
  const serviceCount = servicesResult.count ?? 0;

  // Full name is preferred; otherwise fall back to email. Never render
  // undefined/null/blank.
  const welcomeName = fullName || email || "there";
  const contactLine = [email, mobileNumber].filter(Boolean).join(" · ");

  return (
    <DashboardLayout pageTitle="Dashboard" userEmail={email}>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Welcome back, {welcomeName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s an overview of your domains, services, invoices, and support tickets.
          </p>
          {contactLine && <p className="mt-1 text-xs text-gray-400">{contactLine}</p>}
        </div>

        {/* Statistics cards — placeholder values only; structured so real
            counts can be dropped in later without changing the layout. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Domains" value={domainCount} icon={GlobeIcon} description="Domains registered to your account" />
          <StatCard title="Active Services" value={serviceCount} icon={ServerIcon} description="Hosting and other active services" />
          <StatCard title="Pending Invoices" value={invoiceCount} icon={InvoiceIcon} description="Invoices awaiting payment" />
          <StatCard title="Open Support Tickets" value={ticketCount} icon={TicketIcon} description="Tickets awaiting a reply" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard title="Recent Domains" viewAllHref="/dashboard/domains">
            <EmptyState icon={GlobeIcon} message="Your registered domains will appear here." />
          </SectionCard>

          <SectionCard title="Recent Services" viewAllHref="/dashboard/services">
            <EmptyState icon={ServerIcon} message="Your active services will appear here." />
          </SectionCard>

          <SectionCard title="Recent Invoices" viewAllHref="/dashboard/invoices">
            <EmptyState icon={InvoiceIcon} message="Your invoices will appear here." />
          </SectionCard>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <InboxIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-gray-900">Need help?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Our support team can help with domains, hosting, billing, and more.
                </p>
                <Link
                  href="/dashboard/tickets"
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  Create Support Ticket
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
