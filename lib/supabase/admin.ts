/**
 * Admin Supabase client (service-role key).
 *
 * SERVER-ONLY. This client bypasses Row Level Security entirely.
 *
 * - Never import this file from a Client Component.
 * - Never import this file from any module that is also imported by
 *   client code.
 * - Only use it in trusted server contexts (Route Handlers, Server
 *   Actions, admin-only operations) that have already verified the
 *   caller's identity and authorization.
 *
 * The "server-only" import below causes a build-time error if this
 * module is ever pulled into a client bundle.
 */
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "The admin client must only run on the server with these set.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
