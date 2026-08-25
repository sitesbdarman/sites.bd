import { assertSameOrigin } from "@/lib/security/csrf";
import { clientKey, checkAuthRateLimit } from "@/lib/security/auth-rate-limit";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ email: z.string().email(), password: z.string().min(1).max(256) });

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const rate = checkAuthRateLimit(clientKey(request, "login"), 10);
  if (!rate.allowed) return NextResponse.json({ error: "Too many login attempts. Please wait and try again.", retryAfterSeconds: rate.retryAfterSeconds }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email.trim().toLowerCase(), password: parsed.data.password });
    if (error) return NextResponse.json({ error: error.message, code: error.code ?? null }, { status: 401 });
    if (!data.session) return NextResponse.json({ error: "Login failed. Please try again." }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not reach the authentication service." }, { status: 500 });
  }
}
