import { NextResponse } from "next/server";
import { parseDomainQuery } from "@/lib/validation/domains";
import { checkDomainsAvailability } from "@/lib/domains/search-service";
import { checkRateLimit, getClientKey } from "@/lib/domains/rate-limit";

/**
 * GET /api/domains/check?query=example.com
 *
 * Accepts one or more comma/whitespace-separated domains and returns
 * their availability. Uses the public RDAP registry service through the provider abstraction.
 * `mock: false` indicates the result came from a live registry lookup.
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
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { success: false, error: "Provide a domain to search, e.g. ?query=example.com" },
      { status: 400 },
    );
  }

  const parsed = parseDomainQuery(query);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  try {
    const outcome = await checkDomainsAvailability(parsed.domains);
    return NextResponse.json({
      success: true,
      results: outcome.results,
      mock: outcome.isMock,
    });
  } catch (error) {
    console.error("domains/check failed:", error);
    return NextResponse.json(
      { success: false, error: "Couldn't check domain availability right now. Please try again." },
      { status: 500 },
    );
  }
}
