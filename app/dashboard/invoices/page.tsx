import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InvoiceIcon } from "@/components/dashboard/icons";
import { InvoicesList } from "@/components/dashboard/InvoicesList";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: invoices, error } = user
    ? await supabase.from("invoices").select("id,invoice_number,status,currency,total,created_at,due_at").eq("customer_id", user.id).order("created_at", { ascending: false })
    : { data: [], error: null };

  return (
    <DashboardLayout pageTitle="My Invoices" userEmail={user?.email ?? null}>
      {error ? (
        <div className="overflow-hidden rounded-[--radius-surface] border border-gray-200 bg-white">
          <EmptyState icon={InvoiceIcon} message="We couldn't load your invoices right now." />
        </div>
      ) : (
        <InvoicesList invoices={invoices ?? []} />
      )}
    </DashboardLayout>
  );
}
