import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserManager } from "./user-manager";

export default async function AdminUsersPage() {
  await requireAdmin();
  const db = createAdminClient();
  const { data } = await db
    .from("profiles")
    .select("id,customer_id,full_name,email,mobile_number,role,profile_status,account_status,created_at")
    .order("created_at", { ascending: false });

  return <UserManager initialUsers={(data || []) as any} />;
}
