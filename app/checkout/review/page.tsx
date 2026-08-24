import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ReviewContent } from "./review-content";

export default async function CheckoutReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <DashboardLayout pageTitle="Checkout — Order Review" userEmail={user?.email ?? null}>
      <ReviewContent />
    </DashboardLayout>
  );
}
