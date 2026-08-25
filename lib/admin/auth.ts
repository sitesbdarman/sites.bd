import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRole = "admin" | "super_admin" | "support_agent" | "finance";
export type AdminPermission =
  | "admin:all"
  | "customers:read"
  | "customers:write"
  | "tickets:read"
  | "tickets:write"
  | "orders:read"
  | "orders:write"
  | "payments:read"
  | "payments:write"
  | "pricing:read"
  | "pricing:write"
  | "coupons:read"
  | "coupons:write"
  | "domains:read"
  | "domains:write"
  | "reports:read"
  | "settings:read"
  | "settings:write"
  | "notifications:write"
  | "audit:read";

const PERMISSIONS: Record<AdminRole, Set<AdminPermission>> = {
  admin: new Set(["admin:all"]),
  super_admin: new Set(["admin:all"]),
  support_agent: new Set(["customers:read", "tickets:read", "tickets:write", "notifications:write"]),
  finance: new Set([
    "customers:read",
    "orders:read",
    "orders:write",
    "payments:read",
    "payments:write",
    "coupons:read",
    "coupons:write",
    "reports:read",
    "notifications:write",
  ]),
};

export function hasPermission(role: string | null | undefined, permission: AdminPermission) {
  if (!role || !(role in PERMISSIONS)) return false;
  const set = PERMISSIONS[role as AdminRole];
  return set.has("admin:all") || set.has(permission);
}

export async function requireAdmin(permission?: AdminPermission) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name, email, customer_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.role || !["admin","super_admin","support_agent","finance"].includes(profile.role) || (permission && !hasPermission(profile.role, permission))) redirect("/dashboard");
  return { user, profile, admin };
}

export async function assertAdminApi(permission?: AdminPermission) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, admin: null, profile: null, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role,full_name,email,customer_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.role || !["admin","super_admin","support_agent","finance"].includes(profile.role) || (permission && !hasPermission(profile.role, permission))) {
    return { user, admin: null, profile, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, admin, profile, response: null };
}
