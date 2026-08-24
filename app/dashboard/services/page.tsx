import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ServerIcon } from "@/components/dashboard/icons";

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orders, error } = user
    ? await supabase.from("orders").select("id,order_number,status,hosting_plan_name,hosting_billing_cycle,hosting_price,created_at").eq("customer_id", user.id).not("hosting_plan_id", "is", null).order("created_at", { ascending: false })
    : { data: [], error: null };

  return <DashboardLayout pageTitle="My Services" userEmail={user?.email ?? null}>
    <div className="grid gap-4 md:grid-cols-2">
      {error ? <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-5"><EmptyState icon={ServerIcon} message="We couldn't load your services right now." /></div> : !orders?.length ? <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-5"><EmptyState icon={ServerIcon} message="You don't have any hosting services yet." /></div> : orders.map((order) => <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-gray-400">Order {order.order_number}</p><h2 className="mt-1 text-base font-semibold text-gray-900">{order.hosting_plan_name}</h2></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{order.status}</span></div><div className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><p className="text-xs text-gray-400">Billing</p><p className="mt-1 text-gray-700">{order.hosting_billing_cycle ?? "N/A"}</p></div><div><p className="text-xs text-gray-400">Price</p><p className="mt-1 text-gray-700">BDT {Number(order.hosting_price).toFixed(2)}</p></div></div></div>)}
    </div>
  </DashboardLayout>;
}
