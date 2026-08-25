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

export function ticketReplyEmail(input: { ticketNumber: string; subject: string; message: string }) {
  const preview = input.message.length > 400 ? `${input.message.slice(0, 400)}…` : input.message;
  const body = `<p>You have a new reply on support ticket <strong>${escapeHtml(input.ticketNumber)}</strong>.</p><p style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px">${escapeHtml(preview)}</p><p><a href="${appUrl}/dashboard/tickets">View and reply</a></p>`;
  return { subject: `New reply on ticket ${input.ticketNumber}: ${input.subject}`, html: layout("New reply on your ticket", body), text: `New reply on ticket ${input.ticketNumber} (${input.subject}): ${preview}` };
}

export function domainExpiryReminderEmail(input: { domain: string; daysLeft: number; expiresAt: string }) {
  const urgent = input.daysLeft <= 7;
  const when = input.daysLeft <= 0 ? "today" : `in ${input.daysLeft} day${input.daysLeft === 1 ? "" : "s"}`;
  const body = `<p>Your domain <strong>${escapeHtml(input.domain)}</strong> is set to expire <strong>${when}</strong> (${escapeHtml(input.expiresAt)}).</p><p>${urgent ? "This is time-sensitive — renew soon to avoid losing the domain and any services attached to it." : "Renew any time before then to keep it without interruption."}</p><p><a href="${appUrl}/dashboard/domains" style="display:inline-block;margin-top:6px;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Renew now</a></p>`;
  return { subject: `${urgent ? "⚠ " : ""}${input.domain} expires ${when}`, html: layout("Domain expiry reminder", body), text: `${input.domain} expires ${when} (${input.expiresAt}). Renew at ${appUrl}/dashboard/domains` };
}

export function cartAbandonmentEmail(input: { domains: string[] }) {
  const items = input.domains.map((d) => `<li>${escapeHtml(d)}</li>`).join("");
  const body = `<p>You still have ${input.domains.length === 1 ? "a domain" : "domains"} waiting in your cart:</p><ul>${items}</ul><p>Complete your order before someone else claims it.</p><p><a href="${appUrl}/cart" style="display:inline-block;margin-top:6px;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Go to cart</a></p>`;
  return { subject: `You left ${input.domains.length === 1 ? "a domain" : "domains"} in your cart`, html: layout("Your cart is waiting", body), text: `You still have items in your cart: ${input.domains.join(", ")}. Finish checkout at ${appUrl}/cart` };
}
