import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Lightweight production health check. Never exposes secrets or provider details. */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "domain-hosting-platform", timestamp: new Date().toISOString() },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
