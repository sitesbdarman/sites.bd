import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/mailer";
import { orderCreatedEmail, paymentSuccessEmail, ticketCreatedEmail } from "@/lib/email/templates/notifications";

type Notification = { to: string; subject: string; html: string; text: string; event: string; userId?: string | null; metadata?: Record<string, unknown> };

async function deliver(notification: Notification) {
  const admin = createAdminClient();
  const { data: log } = await admin.from("email_logs").insert({ to_email: notification.to, subject: notification.subject, event: notification.event, user_id: notification.userId ?? null, status: "queued", metadata: notification.metadata ?? {} }).select("id").single();
  try {
    await sendEmail(notification);
    if (log?.id) await admin.from("email_logs").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", log.id);
  } catch (error) {
    if (log?.id) await admin.from("email_logs").update({ status: "failed", error_message: error instanceof Error ? error.message : "Unknown email error" }).eq("id", log.id);
    console.error("Email delivery failed:", notification.event, error);
  }
}

export async function notifyOrderCreated(input: { email: string; userId: string; orderNumber: string; total: number; currency: string; status: string }) {
  const message = orderCreatedEmail(input);
  return deliver({ ...message, to: input.email, event: "order_created", userId: input.userId, metadata: { orderNumber: input.orderNumber } });
}

export async function notifyPaymentSuccess(input: { email: string; userId: string; orderNumber: string; invoiceNumber: string; transactionId: string; total: number; currency: string }) {
  const message = paymentSuccessEmail(input);
  return deliver({ ...message, to: input.email, event: "payment_success", userId: input.userId, metadata: { orderNumber: input.orderNumber, invoiceNumber: input.invoiceNumber, transactionId: input.transactionId } });
}

export async function notifyTicketCreated(input: { email: string; userId: string; ticketNumber: string; subject: string; priority: string }) {
  const message = ticketCreatedEmail(input);
  return deliver({ ...message, to: input.email, event: "ticket_created", userId: input.userId, metadata: { ticketNumber: input.ticketNumber } });
}

export async function notifyAdmin(subject: string, text: string, event: string, metadata: Record<string, unknown> = {}) {
  const email = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!email) return;
  return deliver({ to: email, subject, text, html: `<p>${text.replace(/\n/g, "<br>")}</p>`, event, metadata });
}
