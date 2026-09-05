import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ExpiryBanner } from "@/components/dashboard/ExpiryBanner";
import { RecentRow } from "@/components/dashboard/RecentRow";
import { QuickAction } from "@/components/dashboard/QuickAction";
import type { DashboardStatus } from "@/components/dashboard/StatusBadge";
import {
  GlobeIcon,
  InboxIcon,
  InvoiceIcon,
  ServerIcon,
  TicketIcon,
  SearchIcon,
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

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Narrows a free-form DB status string to one StatusBadge recognizes, defaulting to "pending". */
function toStatus(value: string | null | undefined): DashboardStatus {
  const known: DashboardStatus[] = ["active", "pending", "processing", "expired", "suspended", "paid", "overdue", "closed"];
  return (known as string[]).includes(value ?? "") ? (value as DashboardStatus) : "pending";
}

/**
 * Dashboard home. Stat cards and "Recent ..." sections are both backed by
 * the same query per resource (a single `select(..., { count: "exact" })`
 * with a `limit`), so the count in the stat card and the rows shown below
 * it always agree with each other.
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
  const mobileNumber = profile?.mobile_number?.trim() || null;
  const avatarUrl = profile?.avatar_url || null;

  const RECENT_LIMIT = 5;

  const [domainsResult, invoicesUnpaidResult, ticketsOpenResult, servicesResult, expiringDomainsResult, recentDomainsResult, recentInvoicesResult, recentTicketsResult] = user ? await Promise.all([
    supabase.from("domains").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("customer_id", user.id).eq("status", "unpaid"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("customer_id", user.id).in("status", ["open", "pending"]),
    supabase.from("orders").select("id, order_number, status, hosting_plan_name, hosting_billing_cycle, hosting_price, currency, created_at", { count: "exact" }).eq("customer_id", user.id).in("status", ["active", "processing"]).order("created_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("domains").select("domain_name, status, expires_at").eq("owner_id", user.id).eq("status", "active"),
    supabase.from("domains").select("id, domain_name, status, expires_at").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("invoices").select("id, invoice_number, status, total, currency, created_at").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("support_tickets").select("id, ticket_number, subject, status, created_at").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(RECENT_LIMIT),
  ]) : [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0, data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const domainCount = domainsResult.count ?? 0;
  const invoiceCount = invoicesUnpaidResult.count ?? 0;
  const ticketCount = ticketsOpenResult.count ?? 0;
  const serviceCount = servicesResult.count ?? 0;
  const expiringDomains = expiringDomainsResult.data ?? [];
  const recentDomains = recentDomainsResult.data ?? [];
  const recentServices = servicesResult.data ?? [];
  const recentInvoices = recentInvoicesResult.data ?? [];
  const recentTickets = recentTicketsResult.data ?? [];

  // Full name is preferred; otherwise fall back to email. Never render
  // undefined/null/blank.
  const welcomeName = fullName || email || "there";
  const contactLine = [email, mobileNumber].filter(Boolean).join(" · ");

  // Only nudge brand-new accounts — once there's at least one domain or
  // service, the "getting started" checklist is no longer useful and just
  // pushes real data further down the page.
  const showGettingStarted = domainCount === 0 && serviceCount === 0;

  return (
    <DashboardLayout
      pageTitle="Dashboard"
      userEmail={email}
      fullName={fullName}
      avatarUrl={avatarUrl}
    >
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6">
        <ExpiryBanner domains={expiringDomains} />

        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Welcome back, {welcomeName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Here&apos;s an overview of your domains, services, invoices, and support tickets.
          </p>
          {contactLine && <p className="mt-1 text-xs text-gray-400">{contactLine}</p>}
        </div>

        {/* Quick actions — the handful of things a customer does most
            often, surfaced above the fold instead of buried in the sidebar. */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <QuickAction href="/domains/search" label="Buy a domain" icon={SearchIcon} />
          <QuickAction href="/#claim" label="Claim free .sites.bd" icon={GlobeIcon} />
          <QuickAction href="/pricing" label="Order hosting" icon={ServerIcon} />
          <QuickAction href="/dashboard/tickets" label="Open a ticket" icon={TicketIcon} />
          <QuickAction href="/dashboard/invoices" label="View invoices" icon={InvoiceIcon} />
        </div>

        {showGettingStarted && (
          <div className="rounded-[--radius-surface] border border-sky-100 bg-sky-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Getting started</p>
                <h3 className="mt-1 text-lg font-black text-slate-900">Set up your account</h3>
                <p className="mt-1 text-sm text-slate-600">Complete the basics before ordering your first domain or service.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Link href="/profile" className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-800 hover:border-sky-200 hover:bg-sky-50">1. Complete profile</Link>
              <Link href="/domains/search" className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-800 hover:border-sky-200 hover:bg-sky-50">2. Buy a domain</Link>
              <Link href="/dashboard/domains" className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-800 hover:border-sky-200 hover:bg-sky-50">3. Configure DNS</Link>
            </div>
          </div>
        )}

        {/* Statistics cards. Each count comes from the same query used for
            the matching "Recent ..." section below, so they can't drift. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Domains" value={domainCount} icon={GlobeIcon} description="Domains registered to your account" tone="blue" />
          <StatCard title="Active Services" value={serviceCount} icon={ServerIcon} description="Hosting and other active services" tone="emerald" />
          <StatCard title="Pending Invoices" value={invoiceCount} icon={InvoiceIcon} description="Invoices awaiting payment" tone="amber" />
          <StatCard title="Open Support Tickets" value={ticketCount} icon={TicketIcon} description="Tickets awaiting a reply" tone="violet" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard title="Recent Domains" viewAllHref="/dashboard/domains">
            {recentDomains.length === 0 ? (
              <EmptyState
                icon={GlobeIcon}
                message="Your registered domains will appear here."
              />
            ) : (
              <div className="-mx-1">
                {recentDomains.map((d) => (
                  <RecentRow
                    key={d.id}
                    href={`/dashboard/domains/${d.id}`}
                    title={d.domain_name}
                    status={toStatus(d.status)}
                    meta={d.expires_at ? `Expires ${formatDate(d.expires_at)}` : undefined}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent Services" viewAllHref="/dashboard/services">
            {recentServices.length === 0 ? (
              <EmptyState
                icon={ServerIcon}
                message="Your active services will appear here."
                action={
                  <Link href="/pricing" className="mt-1 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700">
                    Browse hosting plans
                  </Link>
                }
              />
            ) : (
              <div className="-mx-1">
                {recentServices.map((s) => (
                  <RecentRow
                    key={s.id}
                    href={`/dashboard/services/${s.id}`}
                    title={s.hosting_plan_name || s.order_number || "Service"}
                    subtitle={s.hosting_billing_cycle ? `Billed ${s.hosting_billing_cycle}` : undefined}
                    status={toStatus(s.status)}
                    meta={s.hosting_price ? `${s.currency ?? "BDT"} ${Number(s.hosting_price).toFixed(2)}` : undefined}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent Invoices" viewAllHref="/dashboard/invoices">
            {recentInvoices.length === 0 ? (
              <EmptyState icon={InvoiceIcon} message="Your invoices will appear here." />
            ) : (
              <div className="-mx-1">
                {recentInvoices.map((inv) => (
                  <RecentRow
                    key={inv.id}
                    href={`/dashboard/invoices/${inv.id}`}
                    title={inv.invoice_number || "Invoice"}
                    status={toStatus(inv.status)}
                    meta={`${inv.currency ?? "BDT"} ${Number(inv.total ?? 0).toFixed(2)}`}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {recentTickets.length === 0 ? (
            <div className="rounded-[--radius-surface] border border-gray-200 bg-white p-5">
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
          ) : (
            <SectionCard title="Recent Support Tickets" viewAllHref="/dashboard/tickets">
              <div className="-mx-1">
                {recentTickets.map((t) => (
                  <RecentRow
                    key={t.id}
                    href={`/dashboard/tickets/${t.id}`}
                    title={t.subject || t.ticket_number || "Ticket"}
                    subtitle={t.ticket_number}
                    status={toStatus(t.status)}
                    meta={formatDate(t.created_at)}
                  />
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
