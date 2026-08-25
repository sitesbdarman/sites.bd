import "server-only";

const WINDOW_MS = 60_000;
const MAX_KEYS = 5000;

type Bucket = { count: number; startedAt: number };
const buckets = new Map<string, Bucket>();

export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return `${scope}:${forwarded || real || "unknown"}`;
}

export function checkAuthRateLimit(key: string, limit = 10) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    if (!current && buckets.size >= MAX_KEYS) buckets.clear();
    buckets.set(key, { count: 1, startedAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.startedAt + WINDOW_MS - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
