/**
 * Supabase session refresh + route protection for Proxy (see project root
 * `proxy.ts`).
 *
 * Refreshes the user's auth session on every matched request/navigation so
 * Server Components always see a valid, non-expired session, then applies
 * two guards:
 *  - unauthenticated users are redirected away from protected app routes
 *  - authenticated users with a pending profile are redirected to
 *    /profile-completion before they can reach the rest of the app
 *
 * Uses only the public URL and anon key — never the service-role key.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/** Routes (and their sub-paths) that require an authenticated session. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/services",
  "/cart",
  "/checkout",
  "/invoices",
  "/tickets",
  "/profile",
  "/profile-completion",
];

/** Auth pages an already-signed-in (and complete) user shouldn't linger on. */
const AUTH_PAGE_PREFIXES = ["/login", "/register", "/forgot-password"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Copies Set-Cookie headers from the session-refresh response onto a redirect. */
function withRefreshedCookies(redirect: NextResponse, sessionResponse: NextResponse): NextResponse {
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;

  if (!url || !anonKey) {
    // Supabase not configured yet — nothing to refresh or guard.
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touching auth.getUser() is what actually triggers a token refresh when
  // the access token is expired, and persists the refreshed cookies above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = matchesPrefix(pathname, PROTECTED_PREFIXES);
  const isAuthPage = matchesPrefix(pathname, AUTH_PAGE_PREFIXES);

  if (!user) {
    if (isProtectedRoute) {
      const redirectUrl = new URL("/login", request.url);
      return withRefreshedCookies(NextResponse.redirect(redirectUrl), supabaseResponse);
    }
    return supabaseResponse;
  }

  // Authenticated from here on. Only fetch profile_status when a decision
  // actually depends on it, to avoid an extra query on every request.
  if (isProtectedRoute || isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_status, account_status")
      .eq("id", user.id)
      .maybeSingle();

    const profileStatus = (profile?.profile_status as string | undefined) ?? "pending";
    const accountStatus = (profile?.account_status as string | undefined) ?? "active";

    if (isProtectedRoute && accountStatus === "suspended" && pathname !== "/account-suspended") {
      const redirectUrl = new URL("/account-suspended", request.url);
      return withRefreshedCookies(NextResponse.redirect(redirectUrl), supabaseResponse);
    }

    if (isAuthPage) {
      const destination = profileStatus === "complete" ? "/dashboard" : "/profile-completion";
      const redirectUrl = new URL(destination, request.url);
      return withRefreshedCookies(NextResponse.redirect(redirectUrl), supabaseResponse);
    }

    // isProtectedRoute: keep pending users confined to profile-completion,
    // without looping if they're already there.
    if (profileStatus !== "complete" && pathname !== "/profile-completion" && pathname !== "/account-suspended") {
      const redirectUrl = new URL("/profile-completion", request.url);
      return withRefreshedCookies(NextResponse.redirect(redirectUrl), supabaseResponse);
    }
  }

  return supabaseResponse;
}
