import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";

/**
 * Legacy simulation endpoint.
 *
 * Real payments are manual (bKash/Nagad/Rocket) and must be reviewed by an
 * administrator, so the old simulation flow is intentionally disabled.
 */
export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  return NextResponse.json(
    {
      success: false,
      error:
        "Simulation payments are disabled. Submit a bKash, Nagad or Rocket payment for admin review.",
    },
    { status: 410 },
  );
}
