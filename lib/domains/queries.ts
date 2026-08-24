import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shape of the columns read from `public.domains` (see
 * database/0002_domains.sql). Kept minimal/local since types/database.ts
 * is still the untyped placeholder pending real `supabase gen types`
 * output — not hand-written full generated types.
 */
export interface Domain {
  id: string;
  domain_name: string;
  status: "active" | "pending" | "expired" | "suspended";
  auto_renew: boolean;
  registered_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const DOMAIN_COLUMNS =
  "id, domain_name, status, auto_renew, registered_at, expires_at, created_at";

export interface GetUserDomainsResult {
  data: Domain[];
  error: boolean;
}

/**
 * Fetches every domain owned by `userId`, most recently added first.
 *
 * RLS (`domains_select_own`, auth.uid() = owner_id) is the actual
 * enforcement boundary — this only exists to narrow query intent and
 * avoid relying on RLS alone. Ownership is never taken from a caller
 * parameter for filtering trust; `userId` here must come from the
 * authenticated session (`supabase.auth.getUser()`), never from a
 * client-supplied value.
 *
 * Uses `created_at` for ordering since that's the only timestamp on the
 * table that reliably reflects "when this domain was added" — the same
 * fallback the dashboard's Recent Domains section uses.
 *
 * Never throws: query failures are reported via `error: true` with an
 * empty `data` array so callers can render a friendly error state
 * instead of a raw Supabase error or a crash.
 */
export async function getUserDomains(
  supabase: SupabaseClient,
  userId: string,
): Promise<GetUserDomainsResult> {
  try {
    const { data, error } = await supabase
      .from("domains")
      .select(DOMAIN_COLUMNS)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .returns<Domain[]>();

    if (error) {
      return { data: [], error: true };
    }

    return { data: data ?? [], error: false };
  } catch {
    return { data: [], error: true };
  }
}

export type GetDomainByIdStatus = "found" | "not_found" | "error";

export interface GetDomainByIdResult {
  domain: Domain | null;
  status: GetDomainByIdStatus;
}

/**
 * Fetches a single domain by id, scoped to `userId` as the owner.
 *
 * Ownership is enforced twice: the explicit `.eq("owner_id", userId)`
 * filter here (never taken from the route param or any client-supplied
 * value — only from the authenticated session), and RLS
 * (`domains_select_own`) underneath regardless. If the row exists but
 * belongs to a different user, RLS alone would already hide it — the
 * explicit filter just makes that intent visible in the query itself.
 *
 * A missing row and a genuine query failure are reported as distinct
 * statuses so the caller can show "domain not found" vs a friendly
 * error state rather than raw Supabase output, and both cases return
 * `domain: null` rather than throwing.
 */
export async function getDomainById(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<GetDomainByIdResult> {
  try {
    const { data, error } = await supabase
      .from("domains")
      .select(DOMAIN_COLUMNS)
      .eq("id", id)
      .eq("owner_id", userId)
      .maybeSingle<Domain>();

    if (error) {
      return { domain: null, status: "error" };
    }

    if (!data) {
      return { domain: null, status: "not_found" };
    }

    return { domain: data, status: "found" };
  } catch {
    return { domain: null, status: "error" };
  }
}
