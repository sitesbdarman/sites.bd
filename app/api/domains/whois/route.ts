import { NextResponse } from "next/server";
import { singleDomainSchema } from "@/lib/validation/domains";
import { lookupWhois } from "@/lib/whois/lookup-service";
import { checkRateLimit, getClientKey } from "@/lib/domains/rate-limit";

/**
 * GET /api/domains/whois?domain=example.com
 *
 * Returns only the limited WHOIS fields this project shows (domain,
 * registrant name/email, registration/expiry dates) — never raw
 * provider output. Uses the public RDAP registry service through the provider abstraction.
 * `mock: false` indicates the result came from a live registry lookup.
 *
 * Reuses the same domain-format validation (lib/validation/domains.ts)
 * and rate limiter (lib/domains/rate-limit.ts) as /api/domains/check
 * instead of duplicating either.
 */
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(getClientKey(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: rateLimit.retryAfterSeconds
          ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const domainParam = searchParams.get("domain");

  if (!domainParam) {
    return NextResponse.json(
      { success: false, error: "Provide a domain, e.g. ?domain=example.com" },
      { status: 400 },
    );
  }

  const parsed = singleDomainSchema.safeParse(domainParam);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid domain." },
      { status: 400 },
    );
  }

  try {
    const outcome = await lookupWhois(parsed.data);

    if (outcome.status === "not_found") {
      return NextResponse.json(
        { success: false, error: "No WHOIS record found for this domain." },
        { status: 404 },
      );
    }

    if (outcome.status === "error" || !outcome.record) {
      return NextResponse.json(
        { success: false, error: "WHOIS lookup is temporarily unavailable. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      whois: outcome.record,
      mock: outcome.isMock,
    });
  } catch (error) {
    console.error("domains/whois failed:", error);
    return NextResponse.json(
      { success: false, error: "Couldn't complete the WHOIS lookup right now. Please try again." },
      { status: 500 },
    );
  }
}
