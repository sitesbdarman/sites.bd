"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { TextField } from "@/components/ui/TextField";
import { OtpInput } from "@/components/auth/OtpInput";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;

type Step =
  | { name: "email" }
  | { name: "otp" }
  | { name: "password"; ticket: string }
  | { name: "done" };

async function postJson<T>(url: string, body: unknown): Promise<{ status: number; data: T }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T;
  return { status: response.status, data };
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>({ name: "email" });
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email is required.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(null);

    setIsSubmitting(true);
    try {
      // The API always responds with a generic "if an account exists..."
      // shape, by design — we can't and shouldn't tell from this response
      // whether the email is registered.
      await postJson("/api/auth/password-reset/send-otp", { email: trimmedEmail });
      startCooldown();
      setStep({ name: "otp" });
    } catch {
      setSubmitError("Couldn't reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0 || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await postJson("/api/auth/password-reset/send-otp", { email: email.trim() });
      startCooldown();
    } catch {
      setSubmitError("Couldn't reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code.");
      return;
    }
    setOtpError(null);

    setIsSubmitting(true);
    try {
      const { status, data } = await postJson<{ error?: string; ticket?: string }>(
        "/api/auth/password-reset/verify-otp",
        { email: email.trim(), code: otp },
      );

      if (status !== 200 || !data.ticket) {
        setOtpError(data.error ?? "That code is incorrect. Please try again.");
        return;
      }

      setStep({ name: "password", ticket: data.ticket });
    } catch {
      setSubmitError("Couldn't reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step.name !== "password") return;
    setSubmitError(null);

    const errors: typeof passwordErrors = {};
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password && confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const { status, data } = await postJson<{ error?: string }>(
        "/api/auth/password-reset/set-password",
        { ticket: step.ticket, password, confirmPassword },
      );

      if (status !== 200) {
        setSubmitError(data.error ?? "Something went wrong resetting your password. Please try again.");
        return;
      }

      setStep({ name: "done" });
    } catch {
      setSubmitError("Couldn't reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-1 text-sm text-gray-500">
            {step.name === "email" && "Enter your email and we'll send you a verification code."}
            {step.name === "otp" && (
              <>
                Enter the 6-digit code sent to <span className="font-medium text-gray-900">{email}</span>.
              </>
            )}
            {step.name === "password" && "Choose a new password for your account."}
          </p>
        </div>

        {submitError && (
          <div role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {step.name === "email" && (
          <form onSubmit={handleSendOtp} noValidate className="flex flex-col gap-4">
            <TextField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError(null);
              }}
              error={emailError ?? undefined}
              disabled={isSubmitting}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {isSubmitting ? "Sending..." : "Send verification code"}
            </button>
          </form>
        )}

        {step.name === "otp" && (
          <form onSubmit={handleVerifyOtp} noValidate className="flex flex-col gap-4">
            <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} error={otpError ?? undefined} />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {isSubmitting ? "Verifying..." : "Verify code"}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={cooldown > 0 || isSubmitting}
              className="text-center text-sm font-medium text-gray-600 underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </form>
        )}

        {step.name === "password" && (
          <form onSubmit={handleSetPassword} noValidate className="flex flex-col gap-4">
            <TextField
              id="password"
              label="New Password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordErrors.password) setPasswordErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={passwordErrors.password}
              disabled={isSubmitting}
            />

            <TextField
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (passwordErrors.confirmPassword)
                  setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              error={passwordErrors.confirmPassword}
              disabled={isSubmitting}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {step.name === "done" && (
          <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p>Your password has been updated successfully.</p>
            <Link href="/login" className="mt-2 inline-block font-medium text-green-900 underline">
              Go to login
            </Link>
          </div>
        )}

        {step.name !== "done" && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Remembered your password?{" "}
            <Link href="/login" className="font-medium text-gray-900 underline">
              Back to login
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
