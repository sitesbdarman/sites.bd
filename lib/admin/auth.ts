import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role, full_name, email, customer_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  return { user, profile };
}

export async function assertAdminApi() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, admin: null, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { user, admin: null, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, admin, response: null };
}
