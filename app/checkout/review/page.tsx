import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ReviewContent } from "./review-content";
import { CheckoutProgress } from "@/components/CheckoutProgress";

export default async function CheckoutReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <DashboardLayout pageTitle="Checkout — Order Review" userEmail={user?.email ?? null}>
      <div className="mx-auto w-full max-w-[1120px] space-y-5">
        <CheckoutProgress current={3} />
        <ReviewContent />
      </div>
    </DashboardLayout>
  );
}
