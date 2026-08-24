import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const adminHost = process.env.ADMIN_HOST;
  const host = request.headers.get("host")?.split(":")[0];
  if (adminHost && host === adminHost && !request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
    const rewritten = NextResponse.rewrite(url);
    response.headers.forEach((value, key) => rewritten.headers.set(key, value));
    return rewritten;
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
