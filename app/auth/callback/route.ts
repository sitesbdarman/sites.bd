import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * OAuth callback for Supabase's PKCE flow (Google login). Exchanges the
 * `code` query param for a session (setting the auth cookies via the
 * request-scoped server client), then makes sure a `profiles` row exists
 * for the signed-in user before routing them onward.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("OAuth code exchange failed:", exchangeError);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("profile_status")
    .eq("id", user.id)
    .maybeSingle();

  let profileStatus = profile?.profile_status as string | undefined;

  if (!profile) {
    // First time this Google account has signed in — bootstrap a profile
    // row the same way the OTP registration flow does. customer_id is
    // auto-assigned by the database trigger.
    const { error: insertError } = await admin.from("profiles").insert({
      id: user.id,
      email: user.email,
    });

    if (insertError) {
      console.error("Failed to bootstrap profile for Google user:", insertError);
      return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
    }

    profileStatus = "pending";
  }

  const destination = profileStatus === "complete" ? "/dashboard" : "/profile-completion";
  return NextResponse.redirect(`${origin}${destination}`);
}
