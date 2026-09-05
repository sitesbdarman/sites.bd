import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NotificationsContent } from "./notifications-content";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <DashboardLayout pageTitle="Notifications" userEmail={user?.email ?? null}>
      <NotificationsContent />
    </DashboardLayout>
  );
}
