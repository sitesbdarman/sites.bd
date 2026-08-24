import "server-only";

/**
 * Minimal in-memory rate limiter for the domain search endpoint.
 *
 * NOT distributed — each serverless instance/region keeps its own
 * counters, so on Vercel this is a best-effort speed bump against
 * accidental abuse (rapid retries, simple scripts) rather than a hard
 * cap across the whole deployment. That's an intentional scope choice
 * for this step, not an oversight — swap in a shared store (e.g.
 * Upstash Redis) behind this same checkRateLimit() signature if/when a
 * real distributed limit is needed.
 */

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

// Caps how many distinct keys (IPs) are tracked at once so a flood of
// unique callers can't grow this map without bound over the process
// lifetime; the whole map is reset if the cap is hit.
const MAX_TRACKED_KEYS = 5000;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    if (!bucket && buckets.size >= MAX_TRACKED_KEYS) {
      buckets.clear();
    }
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Best-effort client identifier from the standard proxy header Vercel sets. */
export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  return "unknown";
}
