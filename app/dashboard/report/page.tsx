import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ReportContent } from "./report-content";

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <DashboardLayout pageTitle="Report a Problem" userEmail={user?.email ?? null}>
      <ReportContent />
    </DashboardLayout>
  );
}
