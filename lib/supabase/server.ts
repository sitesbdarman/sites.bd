/**
 * Server Supabase client.
 *
 * For use in Server Components, Route Handlers, and Server Actions.
 * Reads/writes the user's session via cookies and enforces RLS as the
 * signed-in user (or anonymous role if no session). Uses only the
 * public URL and anon key — never the service-role key.
 *
 * This file imports "next/headers" and must only be used on the server.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Set these in .env.local (see .env.local.example).",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component without a mutable response —
          // safe to ignore as long as middleware refreshes the session.
        }
      },
    },
  });
}
