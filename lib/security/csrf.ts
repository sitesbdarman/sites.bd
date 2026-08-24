import "server-only";

/** Reject cross-site state-changing requests when an Origin header is present. */
export function assertSameOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const url = new URL(request.url);
  if (origin !== url.origin) {
    return Response.json({ success: false, error: "Invalid request origin." }, { status: 403 });
  }
  return null;
}
