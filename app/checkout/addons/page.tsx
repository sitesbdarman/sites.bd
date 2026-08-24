import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AddonsSelectionContent } from "./addons-selection-content";

export default async function CheckoutAddonsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <DashboardLayout pageTitle="Checkout — Add-on Services" userEmail={user?.email ?? null}>
      <AddonsSelectionContent />
    </DashboardLayout>
  );
}
