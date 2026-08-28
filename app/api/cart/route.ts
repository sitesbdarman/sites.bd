import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { singleDomainSchema } from "@/lib/validation/domains";
import { getCartItems, type CartItem } from "@/lib/cart/queries";
import { claimDomainForUser, mergeGuestCartIntoAccount } from "@/lib/cart/cart-service";
import { addToGuestCart, clearGuestCart, getGuestCartDomains } from "@/lib/cart/guest-cart";

function cartTotal(items: CartItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.price, 0) * 100) / 100;
}

/**
 * GET /api/cart
 *
 * Signed-in users only (used from the /cart page and the header cart
 * badge, both of which only render for an authenticated session). If a
 * guest cart cookie is present, it's merged into the account first, then
 * cleared — so a user who just logged in sees their pre-login selections
 * the first time anything on the site asks for their cart, without a
 * separate "restore cart" step.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  const guestDomains = await getGuestCartDomains();
  if (guestDomains.length > 0) {
    await mergeGuestCartIntoAccount(supabase, user.id, guestDomains);
    await clearGuestCart();
  }

  const { data, error } = await getCartItems(supabase, user.id);
  if (error) {
    return NextResponse.json(
      { success: false, error: "Couldn't load your cart. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, items: data, total: cartTotal(data) });
}

/**
 * POST /api/cart
 *
 * Body: { domain: string }
 *
 * - Signed in: added to the user's cart_items row. Availability is
 *   re-checked and price is server-computed — see claimDomainForUser.
 * - Guest: added to a cookie-based guest cart only (see
 *   lib/cart/guest-cart.ts). No DB write, no price is stored or trusted;
 *   the client is told `guest: true` so it can redirect to /login.
 */
export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const domainField = (body as { domain?: unknown } | null)?.domain;
  const parsed = singleDomainSchema.safeParse(domainField);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Enter a valid domain." },
      { status: 400 },
    );
  }
  const domain = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const result = await addToGuestCart(domain);
    if (!result.ok) {
      const message =
        result.reason === "cart_full"
          ? "Your cart is full. Remove an item before adding another."
          : "That domain is already in your cart.";
      return NextResponse.json({ success: false, error: message, guest: true }, { status: 409 });
    }
    return NextResponse.json({ success: true, guest: true, domain });
  }

  const result = await claimDomainForUser(supabase, user.id, domain);

  switch (result.status) {
    case "added":
      return NextResponse.json({ success: true, item: result.item });
    case "duplicate":
      return NextResponse.json(
        { success: false, error: "That domain is already in your cart." },
        { status: 409 },
      );
    case "unavailable":
      return NextResponse.json(
        { success: false, error: "That domain is no longer available." },
        { status: 409 },
      );
    default:
      return NextResponse.json(
        { success: false, error: "Couldn't add that domain to your cart. Please try again." },
        { status: 500 },
      );
  }
}
