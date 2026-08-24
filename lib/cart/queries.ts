import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shape of the columns read from `public.cart_items` (see
 * database/0004_cart.sql). Kept minimal/local since types/database.ts is
 * still the untyped placeholder pending real `supabase gen types` output —
 * matches the pattern in lib/domains/queries.ts.
 */
export interface CartItem {
  id: string;
  domain_name: string;
  price: number;
  currency: string;
  validity_years: number;
  created_at: string;
}

const CART_COLUMNS = "id, domain_name, price, currency, validity_years, created_at";

export interface GetCartItemsResult {
  data: CartItem[];
  error: boolean;
}

/**
 * Fetches every cart item owned by `userId`, most recently added first.
 *
 * RLS (`cart_items_select_own`, auth.uid() = owner_id) is the actual
 * enforcement boundary — the explicit filter here just narrows query
 * intent and avoids relying on RLS alone. `userId` must come from the
 * authenticated session, never a client-supplied value.
 */
export async function getCartItems(
  supabase: SupabaseClient,
  userId: string,
): Promise<GetCartItemsResult> {
  try {
    const { data, error } = await supabase
      .from("cart_items")
      .select(CART_COLUMNS)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .returns<CartItem[]>();

    if (error) {
      return { data: [], error: true };
    }

    return { data: data ?? [], error: false };
  } catch {
    return { data: [], error: true };
  }
}

export type AddCartItemStatus = "added" | "duplicate" | "error";

export interface AddCartItemResult {
  status: AddCartItemStatus;
  item: CartItem | null;
}

/**
 * Inserts one cart row for `userId`. `price`/`currency` must already be
 * server-computed by the caller (see lib/domains/pricing.ts) — this
 * function never accepts or infers a price from client input.
 *
 * Relies on the `unique (owner_id, domain_name)` constraint for the real
 * duplicate guarantee under concurrent requests; a unique-violation is
 * reported back as `status: "duplicate"` rather than a generic error.
 */
export async function addCartItem(
  supabase: SupabaseClient,
  userId: string,
  domain: string,
  price: number,
  currency: string,
  validityYears: number,
): Promise<AddCartItemResult> {
  try {
    const { data, error } = await supabase
      .from("cart_items")
      .insert({
        owner_id: userId,
        domain_name: domain,
        price,
        currency,
        validity_years: validityYears,
      })
      .select(CART_COLUMNS)
      .single<CartItem>();

    if (error) {
      if (error.code === "23505") {
        return { status: "duplicate", item: null };
      }
      return { status: "error", item: null };
    }

    return { status: "added", item: data };
  } catch {
    return { status: "error", item: null };
  }
}

export type RemoveCartItemStatus = "removed" | "not_found" | "error";

/**
 * Deletes one cart row, scoped to `userId` as the owner (never taken from
 * the route param — only from the authenticated session), with RLS
 * (`cart_items_delete_own`) as the real boundary underneath regardless.
 * A missing/foreign row and a genuine query failure are reported as
 * distinct statuses so the caller can show "not found" vs a friendly
 * error state.
 */
export async function removeCartItem(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
): Promise<RemoveCartItemStatus> {
  try {
    const { data, error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("owner_id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      return "error";
    }
    if (!data) {
      return "not_found";
    }
    return "removed";
  } catch {
    return "error";
  }
}
