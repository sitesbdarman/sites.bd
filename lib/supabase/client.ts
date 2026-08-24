/**
 * Browser Supabase client.
 *
 * Safe to import from Client Components. Uses only the public URL and
 * anon key, both of which are intended to be exposed to the browser.
 *
 * Do NOT add the service-role key to this file.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Set these in .env.local (see .env.local.example).",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
