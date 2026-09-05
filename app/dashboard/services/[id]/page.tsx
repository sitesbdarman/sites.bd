import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge, type DashboardStatus } from "@/components/dashboard/StatusBadge";

const KNOWN_STATUSES: DashboardStatus[] = ["active", "pending", "processing", "expired", "suspended", "paid", "overdue", "closed"];
function toStatus(value: string | null | undefined): DashboardStatus {
  return (KNOWN_STATUSES as string[]).includes(value ?? "") ? (value as DashboardStatus) : "pending";
}

export default async function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: order } = await db.from("orders").select("*").eq("id", id).eq("customer_id", user.id).maybeSingle();
  if (!order) notFound();
  const { data: messages } = await db
    .from("service_messages")
    .select("id,message,is_admin,created_at")
    .eq("order_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const canCancel = ["pending_payment", "processing"].includes(order.status);

  return (
    <DashboardLayout pageTitle="Service Details" userEmail={user.email ?? null}>
      <Link href="/dashboard/services" className="text-sm font-bold text-blue-600 hover:text-blue-700">← My Services</Link>
      <div className="mt-4 rounded-[--radius-surface] border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400">{order.order_number}</p>
            <h1 className="mt-1 text-xl font-black text-gray-900">{order.hosting_plan_name || "Service"}</h1>
          </div>
          <StatusBadge status={toStatus(order.status)} />
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-gray-400">Billing</dt>
            <dd className="mt-1 font-semibold text-gray-900">{order.hosting_billing_cycle || "One time"}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Price</dt>
            <dd className="mt-1 font-semibold text-gray-900">{order.currency} {Number(order.total).toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Auto renewal</dt>
            <dd className="mt-1 font-semibold text-gray-900">Not configured</dd>
          </div>
        </dl>
      </div>

      {canCancel && (
        <form action={`/api/orders/${id}/cancel`} method="post" className="mt-4">
          <button type="submit" className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 active:scale-[.98]">
            Cancel Order
          </button>
        </form>
      )}

      <div className="mt-5 rounded-[--radius-surface] border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-gray-900">Service Messages</h2>
        <div className="mt-4 space-y-3">
          {!messages?.length ? (
            <p className="text-sm text-gray-500">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`rounded-xl p-3 text-sm ${m.is_admin ? "bg-blue-50" : "bg-gray-50"}`}>
                <div className="text-xs font-bold text-gray-500">{m.is_admin ? "Support" : "You"}</div>
                <p className="mt-1 whitespace-pre-wrap text-gray-700">{m.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
