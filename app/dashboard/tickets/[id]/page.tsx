import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { TicketReplyBox } from "@/components/dashboard/TicketReplyBox";
import { StatusBadge, type DashboardStatus } from "@/components/dashboard/StatusBadge";

const KNOWN_STATUSES: DashboardStatus[] = ["active", "pending", "processing", "expired", "suspended", "paid", "overdue", "closed"];
function toStatus(value: string | null | undefined): DashboardStatus {
  return (KNOWN_STATUSES as string[]).includes(value ?? "") ? (value as DashboardStatus) : "pending";
}

export default async function TicketDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: ticket } = await db.from("support_tickets").select("*").eq("id", id).eq("customer_id", user.id).maybeSingle();
  if (!ticket) notFound();
  const { data: replies } = await db
    .from("support_ticket_replies")
    .select("id,message,is_admin,created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  return (
    <DashboardLayout pageTitle="Ticket Details" userEmail={user.email ?? null}>
      <Link href="/dashboard/tickets" className="text-sm font-bold text-blue-600 hover:text-blue-700">← Support Tickets</Link>
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400">{ticket.ticket_number}</p>
            <h1 className="mt-1 text-xl font-black text-gray-900">{ticket.subject}</h1>
          </div>
          <StatusBadge status={toStatus(ticket.status)} />
        </div>
        <div className="mt-6 space-y-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-bold text-gray-500">Original request</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{ticket.message}</p>
          </div>
          {(replies || []).map((r) => (
            <div key={r.id} className={`rounded-xl p-4 ${r.is_admin ? "bg-blue-50" : "bg-gray-50"}`}>
              <p className="text-xs font-bold text-gray-500">{r.is_admin ? "Support" : "You"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{r.message}</p>
            </div>
          ))}
        </div>
      </div>
      {ticket.status !== "closed" && <TicketReplyBox ticketId={id} />}
    </DashboardLayout>
  );
}
