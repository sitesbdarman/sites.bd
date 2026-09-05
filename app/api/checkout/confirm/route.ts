import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCartItems } from "@/lib/cart/queries";
import { getHostingPlanById, CUSTOM_CONNECTION_PLAN_ID, type HostingPlanType } from "@/lib/hosting/plans";
import { getLiveAddonById, getLiveHostingPlanById, getLiveAddons } from "@/lib/hosting/catalog-server";
import { getAddonById } from "@/lib/hosting/addons";
import { notifyOrderCreated, notifyAdmin } from "@/lib/email/notifications";
import { checkCoupon } from "@/lib/coupons/service";
import { provisionDomain } from "@/lib/domains/registration-service";

interface ConfirmBody {
  hosting?: {
    type?: HostingPlanType;
    planId?: string;
    custom?: { nameServer?: string; ipAddress?: string };
  };
  addonIds?: string[];
  termsAccepted?: boolean;
  couponCode?: string;
}

function validIp(value: string) {
  const v = value.trim();
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(v) || (v.includes(":") && /^[0-9a-fA-F:]+$/.test(v));
}

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });

  const { data: callerProfile } = await supabase.from("profiles").select("account_status").eq("id", user.id).maybeSingle();
  if (callerProfile?.account_status === "suspended") {
    return NextResponse.json({ success: false, error: "Your account is suspended. Please contact support." }, { status: 403 });
  }

  let body: ConfirmBody;
  try { body = await request.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }
  if (body.termsAccepted !== true) {
    return NextResponse.json({ success: false, error: "Please accept the Terms & Conditions." }, { status: 400 });
  }

  const { data: cartItems, error: cartError } = await getCartItems(supabase, user.id);
  if (cartError) return NextResponse.json({ success: false, error: "Couldn't load your cart." }, { status: 500 });
  if (!cartItems.length) return NextResponse.json({ success: false, error: "Your cart is empty." }, { status: 400 });

  const input = body.hosting;
  if (!input?.type) return NextResponse.json({ success: false, error: "Please select a hosting option." }, { status: 400 });

  let hosting: { planId: string; planName: string; price: number; billingCycle: string; custom?: { nameServer: string; ipAddress: string } };
  if (input.type === "custom") {
    const nameServer = input.custom?.nameServer?.trim() ?? "";
    const ipAddress = input.custom?.ipAddress?.trim() ?? "";
    if (!nameServer || !validIp(ipAddress)) {
      return NextResponse.json({ success: false, error: "Custom connection details are invalid." }, { status: 400 });
    }
    hosting = { planId: CUSTOM_CONNECTION_PLAN_ID, planName: "Custom Connection", price: 0, billingCycle: "n_a", custom: { nameServer, ipAddress } };
  } else {
    const plan = input.planId ? (await getLiveHostingPlanById(input.planId)) || getHostingPlanById(input.planId) : undefined;
    if (!plan || plan.type !== input.type) return NextResponse.json({ success: false, error: "Selected hosting plan is invalid." }, { status: 400 });
    hosting = { planId: plan.id, planName: plan.name, price: plan.price, billingCycle: plan.billingCycle };
  }

  const addonIds = Array.from(new Set(Array.isArray(body.addonIds) ? body.addonIds : []));
  const addons = await Promise.all(addonIds.map(async (id:string) => (await getLiveAddonById(id)) || getAddonById(id))).filter((a): a is NonNullable<ReturnType<typeof getAddonById>> => Boolean(a));
  if (addons.length !== addonIds.length) return NextResponse.json({ success: false, error: "One or more add-ons are invalid." }, { status: 400 });

  const domainTotal = Math.round(cartItems.reduce((s, i) => s + Number(i.price), 0) * 100) / 100;
  const addonsTotal = Math.round(addons.reduce((s, a) => s + a.price, 0) * 100) / 100;
  const subtotal = Math.round((domainTotal + hosting.price + addonsTotal) * 100) / 100;
  const requestedCoupon = body.couponCode?.trim() || "";
  let couponCode: string | null = null;
  let couponDiscount = 0;
  if (requestedCoupon) {
    const quote = await checkCoupon(requestedCoupon, subtotal);
    if (!quote.valid) return NextResponse.json({ success:false, error:quote.message }, {status:400});
    couponCode = quote.code;
    couponDiscount = quote.discount;
  }
  const total = Math.max(0, Math.round((subtotal - couponDiscount) * 100) / 100);

  const admin = createAdminClient();
  const { data: orderNumber, error: orderNumberError } = await admin.rpc("generate_order_number");
  if (orderNumberError || !orderNumber) return NextResponse.json({ success: false, error: "Couldn't create order number." }, { status: 500 });

  const orderStatus = total > 0 ? "pending_payment" : "processing";
  const { data: order, error: orderError } = await admin.from("orders").insert({
    customer_id: user.id,
    order_number: orderNumber,
    status: orderStatus,
    currency: "BDT",
    subtotal,
    total,
    coupon_code: couponCode,
    coupon_discount: couponDiscount,
    hosting_plan_id: hosting.planId,
    hosting_plan_name: hosting.planName,
    hosting_price: hosting.price,
    hosting_billing_cycle: hosting.billingCycle,
    custom_nameserver: hosting.custom?.nameServer ?? null,
    custom_ip_address: hosting.custom?.ipAddress ?? null,
  }).select("id, order_number, status, total").single();
  if (orderError || !order) return NextResponse.json({ success: false, error: "Couldn't create your order." }, { status: 500 });

  if (couponCode) {
    const { data: redemption, error: redemptionError } = await admin.rpc("redeem_coupon", {p_code: couponCode, p_order_total: subtotal});
    const result = redemption?.[0];
    if (redemptionError || !result?.valid) {
      await admin.from("orders").delete().eq("id", order.id);
      return NextResponse.json({success:false,error:result?.message || "Coupon could not be reserved. Please try again."},{status:400});
    }
    const actualDiscount = Number(result.discount || 0);
    if (Math.round(actualDiscount*100) !== Math.round(couponDiscount*100)) {
      await admin.from("orders").delete().eq("id", order.id);
      return NextResponse.json({success:false,error:"Coupon changed while checking out. Please apply it again."},{status:409});
    }
  }

  const items = [
    ...cartItems.map((item) => ({ order_id: order.id, item_type: "domain", item_id: item.id, name: item.domain_name, quantity: 1, unit_price: item.price, total_price: item.price, metadata: { validity_years: item.validity_years } })),
    ...addons.map((addon) => ({ order_id: order.id, item_type: "addon", item_id: addon.id, name: addon.name, quantity: 1, unit_price: addon.price, total_price: addon.price, metadata: {} })),
  ];
  const { error: itemError } = await admin.from("order_items").insert(items);
  if (itemError) {
    await admin.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ success: false, error: "Couldn't save order items." }, { status: 500 });
  }

  const { data: invoiceNumber, error: invoiceNumberError } = await admin.rpc("generate_invoice_number");
  if (invoiceNumberError || !invoiceNumber) return NextResponse.json({ success: false, error: "Order created, but invoice creation failed." }, { status: 500 });

  const { error: invoiceError } = await admin.from("invoices").insert({
    order_id: order.id, customer_id: user.id, invoice_number: invoiceNumber,
    status: total > 0 ? "unpaid" : "paid", currency: "BDT", subtotal: total, total,
    paid_at: total > 0 ? null : new Date().toISOString(),
  });
  if (invoiceError) return NextResponse.json({ success: false, error: "Order created, but invoice creation failed." }, { status: 500 });

  if (total === 0) {
    const domainNames = cartItems.map((item) => item.domain_name);
    const nowIso = new Date().toISOString();
    const outcomes = await Promise.all(domainNames.map((domain_name) => provisionDomain(domain_name, nowIso)));
    const domainRows = domainNames.map((domain_name, i) => {
      const outcome = outcomes[i]!;
      return {
        owner_id: user.id,
        domain_name,
        status: outcome.status,
        registered_at: outcome.registeredAt,
        info: outcome.note ? { registration_note: outcome.note } : {},
      };
    });
    const { error: domainError } = await admin.from("domains").insert(domainRows);
    if (domainError && !String(domainError.message).toLowerCase().includes("duplicate")) {
      return NextResponse.json({ success: false, error: "Order created, but domain activation needs attention." }, { status: 500 });
    }
    await admin.from("orders").update({ status: "active" }).eq("id", order.id);
  }

  await admin.from("cart_items").delete().eq("owner_id", user.id);

  if (user.email) {
    void notifyOrderCreated({ email: user.email, userId: user.id, orderNumber: order.order_number, total, currency: "BDT", status: total > 0 ? "pending_payment" : "active" });
  }
  void notifyAdmin(`New order ${order.order_number}`, `A new order ${order.order_number} was created. Total: ${total.toFixed(2)} BDT.`, "admin_order_created", { orderNumber: order.order_number, customerId: user.id, total });

  return NextResponse.json({
    success: true,
    order: { id: order.id, orderNumber: order.order_number, status: total > 0 ? "pending_payment" : "active", total },
    nextStep: total > 0 ? "payment" : "dashboard",
    invoiceId: invoiceNumber ? (await admin.from("invoices").select("id").eq("invoice_number", invoiceNumber).eq("order_id", order.id).single()).data?.id ?? null : null,
  });
}
