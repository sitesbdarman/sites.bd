import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Minimal Supabase connectivity check.
 *
 * Intentionally exposes NOTHING beyond a boolean-ish status:
 * - no row data
 * - no counts
 * - no error internals beyond a generic message
 *
 * This exists to confirm the app can reach Supabase, not to be a
 * general-purpose diagnostics endpoint.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      {
        status: "not_configured",
        message: "Supabase environment variables are not set.",
      },
      { status: 200 },
    );
  }

  try {
    const supabase = await createClient();
    // HEAD + count avoids returning any row data.
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { status: "error", message: "Could not reach Supabase." },
        { status: 200 },
      );
    }

    return NextResponse.json({ status: "connected" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Could not reach Supabase." },
      { status: 200 },
    );
  }
}
