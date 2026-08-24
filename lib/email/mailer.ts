/**
 * Server-side email sending abstraction.
 *
 * SERVER-ONLY. Wraps nodemailer + SMTP so route handlers never touch
 * transport/credential details directly, and so the transport could be
 * swapped later (e.g. a provider API) without touching call sites.
 *
 * Never import this from a Client Component — the "server-only" guard
 * below causes a build-time error if that happens.
 */
import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP_HOST, SMTP_USER, or SMTP_PASSWORD. Set these in .env.local (see .env.local.example).",
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    // Port 465 is implicit TLS; anything else (587, 25) uses STARTTLS.
    secure: port === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

/** Sends a single email through the configured SMTP transport. */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME;
  const from = fromName && fromEmail ? `${fromName} <${fromEmail}>` : fromEmail;
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
