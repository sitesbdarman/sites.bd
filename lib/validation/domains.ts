/**
 * Validation for the domain search endpoint/UI.
 *
 * Framework-agnostic (no "server-only"/"use client" markers) so the same
 * logic can validate on the client for instant feedback AND on the server
 * in the API route, where client-side validation can never be trusted
 * alone — matches the pattern in lib/validation/auth.ts.
 */
import { z } from "zod";

export const MAX_DOMAINS_PER_REQUEST = 5;
export const MAX_QUERY_LENGTH = 500;

/**
 * One label.label.tld, e.g. "example.com" or "my-site.co.uk".
 * - lowercase letters, digits, hyphens per label; no leading/trailing hyphen
 * - at least one dot (a TLD is required)
 * - final label (TLD) is letters only, 2-63 chars
 */
const DOMAIN_PATTERN =
  /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,63}$/;

export const singleDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Domain is required.")
  .max(253, "Domain name is too long.")
  .regex(DOMAIN_PATTERN, "Enter a valid domain, e.g. example.com.");

const rawQuerySchema = z
  .string()
  .trim()
  .min(1, "Enter at least one domain to search.")
  .max(MAX_QUERY_LENGTH, "That's too much text — try fewer domains.");

export type ParseDomainQueryResult =
  | { ok: true; domains: string[] }
  | { ok: false; error: string };

/**
 * Splits a raw query string into individual domain candidates (comma
 * and/or whitespace separated), validates each one, enforces the
 * per-request cap, and dedupes while preserving order.
 */
export function parseDomainQuery(rawQuery: string): ParseDomainQueryResult {
  const trimmed = rawQuerySchema.safeParse(rawQuery);
  if (!trimmed.success) {
    return { ok: false, error: trimmed.error.issues[0]?.message ?? "Invalid query." };
  }

  const candidates = trimmed.data
    .split(/[,\s]+/)
    .map((candidate) => candidate.trim())
    .filter(Boolean);

  if (candidates.length === 0) {
    return { ok: false, error: "Enter at least one domain to search." };
  }

  if (candidates.length > MAX_DOMAINS_PER_REQUEST) {
    return {
      ok: false,
      error: `Search up to ${MAX_DOMAINS_PER_REQUEST} domains at a time.`,
    };
  }

  const domains: string[] = [];
  for (const candidate of candidates) {
    const parsed = singleDomainSchema.safeParse(candidate);
    if (!parsed.success) {
      return {
        ok: false,
        error: `"${candidate}" isn't a valid domain (e.g. example.com).`,
      };
    }
    domains.push(parsed.data);
  }

  return { ok: true, domains: Array.from(new Set(domains)) };
}
