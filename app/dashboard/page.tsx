import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ExpiryBanner } from "@/components/dashboard/ExpiryBanner";
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
  address: { full_address?: string } | null;
  avatar_url: string | null;
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
        .select("full_name, email, mobile_number, address, avatar_url")
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
  let isAdmin = false;
  if (user) {
    try {
      const { data: roleProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle<{ role: string | null }>();
      isAdmin = ["admin","super_admin","finance","support_agent"].includes(roleProfile?.role ?? "");
    } catch { isAdmin = false; }
  }
  const mobileNumber = profile?.mobile_number?.trim() || null;
  const avatarUrl = profile?.avatar_url || null;

  const [domainsResult, invoicesResult, ticketsResult, servicesResult, expiringDomainsResult] = user ? await Promise.all([
    supabase.from("domains").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("customer_id", user.id).eq("status", "unpaid"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("customer_id", user.id).in("status", ["open", "pending"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", user.id).in("status", ["active", "processing"]),
    supabase.from("domains").select("domain_name, status, expires_at").eq("owner_id", user.id).eq("status", "active"),
  ]) : [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }, { data: [] }];
  const domainCount = domainsResult.count ?? 0;
  const invoiceCount = invoicesResult.count ?? 0;
  const ticketCount = ticketsResult.count ?? 0;
  const serviceCount = servicesResult.count ?? 0;
  const expiringDomains = expiringDomainsResult.data ?? [];

  // Full name is preferred; otherwise fall back to email. Never render
  // undefined/null/blank.
  const welcomeName = fullName || email || "there";
  const contactLine = [email, mobileNumber].filter(Boolean).join(" · ");

  return (
    <DashboardLayout
      pageTitle="Dashboard"
      userEmail={email}
      fullName={fullName}
      avatarUrl={avatarUrl}
    >
      <div className="flex flex-col gap-6">
        <ExpiryBanner domains={expiringDomains} />

        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Welcome back, {welcomeName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s an overview of your domains, services, invoices, and support tickets.
          </p>
          {contactLine && <p className="mt-1 text-xs text-gray-400">{contactLine}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Statistics cards — placeholder values only; structured so real
            counts can be dropped in later without changing the layout. */}
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-sky-700">Getting started</p><h3 className="mt-1 text-lg font-black text-slate-900">Set up your account</h3><p className="mt-1 text-sm text-slate-600">Complete the basics before ordering your first domain or service.</p></div><Link href="/domains/search" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white">Find a domain</Link></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><Link href="/profile" className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-800 hover:border-sky-200 hover:shadow-sm">1. Complete profile</Link><Link href="/domains/search" className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-800 hover:border-sky-200 hover:shadow-sm">2. Buy a domain</Link><Link href="/dashboard/domains" className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-800 hover:border-sky-200 hover:shadow-sm">3. Configure DNS</Link></div></div>

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
