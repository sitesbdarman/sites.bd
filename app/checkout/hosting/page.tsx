import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { HostingSelectionContent } from "./hosting-selection-content";

/**
 * /checkout/hosting is already in proxy.ts's PROTECTED_PREFIXES (via
 * "/checkout"), so an unauthenticated request never reaches this component
 * — it's redirected to /login first, same as /cart. `user` is only read
 * here for the header's display email.
 */
export default async function CheckoutHostingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <DashboardLayout pageTitle="Checkout — Hosting Selection" userEmail={user?.email ?? null}>
      <HostingSelectionContent />
    </DashboardLayout>
  );
}
