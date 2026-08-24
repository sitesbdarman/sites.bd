import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentMode } from "@/lib/payments/config";
import { notifyPaymentSuccess, notifyAdmin } from "@/lib/email/notifications";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  if (getPaymentMode() !== "simulation") return NextResponse.json({ success: false, error: "Simulation payments are disabled in production mode." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
  let body: { invoiceId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 }); }
  if (!body.invoiceId) return NextResponse.json({ success: false, error: "Invoice is required." }, { status: 400 });
  const admin = createAdminClient();
  const { data: invoice, error: invoiceError } = await admin.from("invoices").select("id,order_id,customer_id,status,total,currency").eq("id", body.invoiceId).eq("customer_id", user.id).single();
  if (invoiceError || !invoice) return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });
  if (invoice.status !== "unpaid") return NextResponse.json({ success: false, error: `Invoice is already ${invoice.status}.` }, { status: 400 });
  const { data: order, error: orderError } = await admin.from("orders").select("id,status,total").eq("id", invoice.order_id).eq("customer_id", user.id).single();
  if (orderError || !order) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
  const { data: transactionId, error: transactionError } = await admin.rpc("generate_transaction_id");
  if (transactionError || !transactionId) return NextResponse.json({ success: false, error: "Couldn't create transaction reference." }, { status: 500 });
  const paidAt = new Date().toISOString();
  const { error: paymentError } = await admin.from("payments").insert({ order_id: order.id, invoice_id: invoice.id, customer_id: user.id, gateway: "simulation", transaction_id: transactionId, amount: Number(invoice.total), currency: invoice.currency, status: "paid", paid_at: paidAt });
  if (paymentError) return NextResponse.json({ success: false, error: "Couldn't record payment." }, { status: 500 });
  const { error: invoiceUpdateError } = await admin.from("invoices").update({ status: "paid", paid_at: paidAt }).eq("id", invoice.id);
  if (invoiceUpdateError) return NextResponse.json({ success: false, error: "Payment recorded but invoice update failed." }, { status: 500 });
  const { data: orderItems } = await admin.from("order_items").select("item_type,name,metadata").eq("order_id", order.id);
  const domainNames = (orderItems ?? []).filter((item) => item.item_type === "domain").map((item) => item.name);
  if (domainNames.length) {
    const { error: domainError } = await admin.from("domains").insert(domainNames.map((domain_name) => ({ owner_id: user.id, domain_name, status: "active", registered_at: paidAt })));
    if (domainError && !String(domainError.message).toLowerCase().includes("duplicate")) {
      await admin.from("orders").update({ status: "processing" }).eq("id", order.id);
      return NextResponse.json({ success: true, payment: { transactionId }, order: { status: "processing" }, warning: "Payment succeeded; domain activation needs attention." });
    }
  }
  await admin.from("orders").update({ status: "active" }).eq("id", order.id);

  const { data: invoiceDetails } = await admin.from("invoices").select("invoice_number").eq("id", invoice.id).single();
  if (user.email) {
    void notifyPaymentSuccess({ email: user.email, userId: user.id, orderNumber: (await admin.from("orders").select("order_number").eq("id", order.id).single()).data?.order_number ?? order.id, invoiceNumber: invoiceDetails?.invoice_number ?? invoice.id, transactionId, total: Number(invoice.total), currency: invoice.currency });
  }
  void notifyAdmin(`Payment received for ${order.id}`, `Payment transaction ${transactionId} was recorded for order ${order.id}.`, "admin_payment_success", { orderId: order.id, invoiceId: invoice.id, transactionId });
  return NextResponse.json({ success: true, payment: { transactionId, amount: Number(invoice.total), currency: invoice.currency, status: "paid" }, order: { id: order.id, status: "active" } });
}
