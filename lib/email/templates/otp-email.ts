import "server-only";
import type { OtpPurpose } from "@/lib/otp/otp";

const PURPOSE_COPY: Record<OtpPurpose, { subject: string; heading: string; intent: string }> = {
  registration: {
    subject: "Verify your email to finish creating your account",
    heading: "Confirm your email address",
    intent: "complete your account registration",
  },
  password_reset: {
    subject: "Your password reset code",
    heading: "Reset your password",
    intent: "reset your account password",
  },
};

/** Builds the subject/html/text for an OTP email for the given purpose. */
export function buildOtpEmail(params: {
  code: string;
  purpose: OtpPurpose;
  expiresInMinutes: number;
}) {
  const { code, purpose, expiresInMinutes } = params;
  const copy = PURPOSE_COPY[purpose];

  const text = [
    copy.heading,
    "",
    `Your verification code is: ${code}`,
    `Use this code to ${copy.intent}.`,
    `This code expires in ${expiresInMinutes} minutes and can only be used once.`,
    "",
    "If you didn't request this, you can safely ignore this email — no changes will be made to your account.",
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111827;">
      <h1 style="font-size: 20px; margin-bottom: 8px;">${copy.heading}</h1>
      <p style="font-size: 14px; color: #4b5563; margin-bottom: 24px;">
        Use this code to ${copy.intent}.
      </p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 16px; background: #f3f4f6; border-radius: 8px; margin-bottom: 24px;">
        ${code}
      </div>
      <p style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
        This code expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.
      </p>
      <p style="font-size: 13px; color: #6b7280;">
        If you didn't request this, you can safely ignore this email — no changes will be made to your account.
      </p>
    </div>
  `;

  return { subject: copy.subject, html, text };
}
