import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ServerIcon } from "@/components/dashboard/icons";
import { ServicesList } from "@/components/dashboard/ServicesList";

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orders, error } = user
    ? await supabase.from("orders").select("id,order_number,status,hosting_plan_name,hosting_billing_cycle,hosting_price,created_at").eq("customer_id", user.id).not("hosting_plan_id", "is", null).order("created_at", { ascending: false })
    : { data: [], error: null };

  return <DashboardLayout pageTitle="My Services" userEmail={user?.email ?? null}>
    {error ? (
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <EmptyState icon={ServerIcon} message="We couldn't load your services right now." />
      </div>
    ) : (
      <ServicesList orders={orders ?? []} />
    )}
  </DashboardLayout>;
}
