import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCartItems, type CartItem } from "@/lib/cart/queries";
import {
  CUSTOM_CONNECTION_PLAN_ID,
  getHostingPlanById,
  type HostingPlanType,
} from "@/lib/hosting/plans";
import { getAddonById } from "@/lib/hosting/addons";

/**
 * POST /api/checkout/review
 *
 * Body: { hosting: { type, planId, custom?: { nameServer, ipAddress } }, addonIds: string[] }
 *
 * The client only ever sends *selection ids* (which cart it means implicitly
 * via the session, which hosting plan id, which addon ids) — never prices.
 * Every amount in the response is (re)computed here from server-side truth:
 * cart_items rows (DB) for domains, and the static hosting/addon catalogs
 * for hosting + add-ons. This mirrors the "never trust client price" rule
 * already used in lib/cart/cart-service.ts.
 */

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-fA-F:]+$/;
function isLikelyValidIp(value: string): boolean {
  const v = value.trim();
  return IPV4.test(v) || (v.includes(":") && IPV6.test(v));
}

interface ReviewRequestBody {
  hosting?: {
    type?: HostingPlanType;
    planId?: string;
    custom?: { nameServer?: string; ipAddress?: string };
  };
  addonIds?: string[];
}

function cartTotal(items: CartItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.price, 0) * 100) / 100;
}

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  let body: ReviewRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const errors: string[] = [];

  // --- Domains: re-fetch from DB, ignore anything cart-shaped the client sent ---
  const { data: cartItems, error: cartError } = await getCartItems(supabase, user.id);
  if (cartError) {
    return NextResponse.json(
      { success: false, error: "Couldn't load your cart. Please try again." },
      { status: 500 },
    );
  }
  if (cartItems.length === 0) {
    errors.push("Your cart is empty. Add a domain before reviewing your order.");
  }

  // --- Hosting: resolve against the catalog, never trust a submitted price ---
  const hostingInput = body.hosting;
  let hosting: {
    type: HostingPlanType;
    planId: string;
    planName: string;
    price: number;
    billingCycle: string;
    custom?: { nameServer: string; ipAddress: string };
  } | null = null;

  if (!hostingInput || !hostingInput.type) {
    errors.push("No hosting plan selected. Please choose a hosting option.");
  } else if (hostingInput.type === "custom") {
    const nameServer = hostingInput.custom?.nameServer?.trim() ?? "";
    const ipAddress = hostingInput.custom?.ipAddress?.trim() ?? "";
    if (!nameServer || !ipAddress || !isLikelyValidIp(ipAddress)) {
      errors.push("Custom connection details are incomplete or invalid.");
    } else {
      hosting = {
        type: "custom",
        planId: CUSTOM_CONNECTION_PLAN_ID,
        planName: "Custom Connection",
        price: 0,
        billingCycle: "n_a",
        custom: { nameServer, ipAddress },
      };
    }
  } else {
    const plan = hostingInput.planId ? getHostingPlanById(hostingInput.planId) : undefined;
    if (!plan || plan.type !== hostingInput.type) {
      errors.push("Selected hosting plan is invalid. Please choose again.");
    } else {
      hosting = {
        type: plan.type,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
      };
    }
  }

  // --- Add-ons: resolve each id against the catalog, dedupe, ignore prices sent ---
  const requestedAddonIds = Array.isArray(body.addonIds) ? body.addonIds : [];
  const uniqueAddonIds = Array.from(new Set(requestedAddonIds));
  const addons: { id: string; name: string; price: number }[] = [];
  for (const id of uniqueAddonIds) {
    const addon = getAddonById(id);
    if (!addon) {
      errors.push(`Selected add-on "${id}" is no longer valid.`);
      continue;
    }
    addons.push({ id: addon.id, name: addon.name, price: addon.price });
  }

  const domainTotal = cartTotal(cartItems);
  const hostingPrice = hosting?.price ?? 0;
  const addonsTotal = Math.round(addons.reduce((sum, a) => sum + a.price, 0) * 100) / 100;
  const finalTotal = Math.round((domainTotal + hostingPrice + addonsTotal) * 100) / 100;

  return NextResponse.json({
    success: errors.length === 0,
    errors,
    cart: cartItems,
    hosting,
    addons,
    totals: {
      domainTotal,
      hostingPrice,
      addonsTotal,
      finalTotal,
    },
  });
}
