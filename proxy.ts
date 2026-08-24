/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` (same file convention,
 * new name/export — see node_modules/next/dist/docs/.../proxy.md).
 *
 * Current scope: Supabase auth session refresh only. No route protection
 * or redirects are implemented here yet — that is a separate, later step.
 */
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets, image optimization
     * files, and common static file extensions, so the session cookie
     * stays fresh on real navigations without extra work on assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
