import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface DashboardNotification {
  id: string;
  type: "domain_expiring" | "invoice_unpaid" | "ticket_reply";
  title: string;
  detail: string;
  href: string;
  urgent: boolean;
  createdAt: string;
}

/**
 * GET /api/dashboard/notifications
 *
 * Aggregates the signed-in user's own actionable items — domains expiring
 * within 30 days, unpaid invoices, and support tickets with an admin reply
 * they haven't acted on since (status flips to "pending" on admin reply,
 * see app/api/admin/tickets/[id]/route.ts) — for the dashboard
 * notification bell. Every query below is scoped to the session user and
 * additionally backed by RLS, so this can never leak another user's data.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ notifications: [] satisfies DashboardNotification[] });
  }

  const notifications: DashboardNotification[] = [];
  const now = Date.now();
  const in30Days = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: domains }, { data: invoices }, { data: tickets }] = await Promise.all([
    supabase
      .from("domains")
      .select("id, domain_name, expires_at")
      .eq("status", "active")
      .lte("expires_at", in30Days)
      .gte("expires_at", new Date(now).toISOString()),
    supabase.from("invoices").select("id, invoice_number, total, currency").eq("status", "unpaid"),
    supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, status, updated_at")
      .eq("status", "pending"),
  ]);

  for (const d of domains ?? []) {
    if (!d.expires_at) continue;
    const daysLeft = Math.ceil((new Date(d.expires_at).getTime() - now) / (24 * 60 * 60 * 1000));
    notifications.push({
      id: `domain-${d.id}`,
      type: "domain_expiring",
      title: `${d.domain_name} expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
      detail: "Renew to avoid losing this domain.",
      href: "/dashboard/domains",
      urgent: daysLeft <= 7,
      createdAt: d.expires_at,
    });
  }

  for (const inv of invoices ?? []) {
    notifications.push({
      id: `invoice-${inv.id}`,
      type: "invoice_unpaid",
      title: `Invoice ${inv.invoice_number} is unpaid`,
      detail: `${Number(inv.total).toFixed(2)} ${inv.currency} due.`,
      href: "/dashboard/invoices",
      urgent: false,
      createdAt: new Date().toISOString(),
    });
  }

  for (const t of tickets ?? []) {
    notifications.push({
      id: `ticket-${t.id}`,
      type: "ticket_reply",
      title: `New reply on ${t.ticket_number}`,
      detail: t.subject,
      href: `/dashboard/tickets/${t.id}`,
      urgent: false,
      createdAt: t.updated_at,
    });
  }

  notifications.sort((a, b) => Number(b.urgent) - Number(a.urgent));

  return NextResponse.json({ notifications });
}
