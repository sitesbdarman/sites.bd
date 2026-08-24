import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CartContent } from "./cart-content";

/**
 * /cart is already in proxy.ts's PROTECTED_PREFIXES, so an unauthenticated
 * request never reaches this component — it's redirected to /login first.
 * `user` is only read here for the header's display email; all real data
 * loading/mutation happens client-side in CartContent against
 * /api/cart(/[itemId]), which independently re-verifies the session.
 */
export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <DashboardLayout pageTitle="Cart" userEmail={user?.email ?? null}>
      <CartContent />
    </DashboardLayout>
  );
}
