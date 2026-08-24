import "server-only";

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] ?? char));
}

const company = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Your Company";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033"><div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb"><div style="padding:22px 28px;background:#2563eb;color:#fff"><strong>${escapeHtml(company)}</strong></div><div style="padding:28px"><h1 style="font-size:22px;margin:0 0 18px">${escapeHtml(title)}</h1>${body}</div><div style="padding:18px 28px;background:#f8fafc;color:#64748b;font-size:12px">${escapeHtml(company)} · This is an automated notification.</div></div></body></html>`;
}

export function orderCreatedEmail(input: { orderNumber: string; total: number; currency: string; status: string }) {
  const order = escapeHtml(input.orderNumber);
  const status = escapeHtml(input.status);
  const body = `<p>Your order <strong>${order}</strong> has been created.</p><p>Total: <strong>${input.total.toFixed(2)} ${escapeHtml(input.currency)}</strong></p><p>Status: <strong>${status}</strong></p><p><a href="${appUrl}/dashboard/orders">View your orders</a></p>`;
  return { subject: `Order ${input.orderNumber} created`, html: layout("Order confirmation", body), text: `Order ${input.orderNumber} has been created. Total: ${input.total.toFixed(2)} ${input.currency}. Status: ${input.status}.` };
}

export function paymentSuccessEmail(input: { orderNumber: string; invoiceNumber: string; transactionId: string; total: number; currency: string }) {
  const body = `<p>Payment for order <strong>${escapeHtml(input.orderNumber)}</strong> was successful.</p><p>Invoice: <strong>${escapeHtml(input.invoiceNumber)}</strong></p><p>Transaction: <strong>${escapeHtml(input.transactionId)}</strong></p><p>Paid: <strong>${input.total.toFixed(2)} ${escapeHtml(input.currency)}</strong></p><p><a href="${appUrl}/dashboard/invoices">View invoices</a></p>`;
  return { subject: `Payment received for ${input.orderNumber}`, html: layout("Payment successful", body), text: `Payment received for ${input.orderNumber}. Invoice ${input.invoiceNumber}. Transaction ${input.transactionId}. Paid ${input.total.toFixed(2)} ${input.currency}.` };
}

export function ticketCreatedEmail(input: { ticketNumber: string; subject: string; priority: string }) {
  const body = `<p>Your support ticket <strong>${escapeHtml(input.ticketNumber)}</strong> has been created.</p><p>Subject: <strong>${escapeHtml(input.subject)}</strong></p><p>Priority: <strong>${escapeHtml(input.priority)}</strong></p><p><a href="${appUrl}/dashboard/tickets">View your tickets</a></p>`;
  return { subject: `Support ticket ${input.ticketNumber} created`, html: layout("Support ticket received", body), text: `Support ticket ${input.ticketNumber} has been created. Subject: ${input.subject}. Priority: ${input.priority}.` };
}
