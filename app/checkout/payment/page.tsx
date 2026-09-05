import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PaymentContent } from "./payment-content";
import { CheckoutProgress } from "@/components/CheckoutProgress";

export default async function CheckoutPaymentPage({ searchParams }: { searchParams: Promise<{ invoice?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  if (!params.invoice) redirect("/dashboard/invoices");

  return (
    <DashboardLayout pageTitle="Checkout — Payment" userEmail={user.email ?? null}>
      <div className="mx-auto w-full max-w-[1120px] space-y-5">
        <CheckoutProgress current={4} />
        <PaymentContent invoiceId={params.invoice} />
      </div>
    </DashboardLayout>
  );
}
