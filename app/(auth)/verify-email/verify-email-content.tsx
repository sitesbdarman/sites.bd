"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Minimum time between resend requests, to avoid duplicate/spam sends. */
const RESEND_COOLDOWN_SECONDS = 60;

type ResendState = "idle" | "sending" | "sent" | "error";

/**
 * Maps a Supabase Auth resend() error to a short, user-facing message.
 */
function mapResendError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("already confirmed") || normalized.includes("already verified")) {
    return "This email is already verified. You can continue.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Too many requests. Please wait a bit before trying again.";
  }

  return "Could not resend the verification email. Please try again.";
}

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";

  const [verified, setVerified] = useState(false);
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Reused across renders so we don't create a new client (and duplicate
  // auth listeners) on every render.
  const supabaseRef = useRef(createClient());

  // If the confirmation link is opened in this same browser, Supabase's
  // client picks up the token from the URL automatically and fires a
  // SIGNED_IN event once the email is confirmed — reflect that here.
  useEffect(() => {
    const supabase = supabaseRef.current;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setVerified(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setVerified(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Cooldown ticker for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    // Guards against duplicate requests: no email to send to, a request
    // already in flight, or still within the cooldown window.
    if (!email || resendState === "sending" || cooldown > 0) {
      return;
    }

    setResendState("sending");
    setResendError(null);

    try {
      const supabase = supabaseRef.current;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
        },
      });

      if (error) {
        setResendState("error");
        setResendError(mapResendError(error.message));
        return;
      }

      setResendState("sent");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setResendState("error");
      setResendError("Something went wrong. Please try again.");
    }
  }, [email, resendState, cooldown]);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {verified ? "Email verified" : "Verify your email"}
          </h1>
          {!verified && (
            <p className="mt-1 text-sm text-gray-500">
              {email ? (
                <>
                  We&apos;ve sent a verification email to{" "}
                  <span className="font-medium text-gray-900">{email}</span>. Click the
                  link in that email to activate your account.
                </>
              ) : (
                "We've sent you a verification email. Click the link in that email to activate your account."
              )}
            </p>
          )}
        </div>

        {verified ? (
          <div
            role="status"
            className="mb-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            Your email address has been confirmed.
          </div>
        ) : (
          <>
            {resendState === "sent" && (
              <div
                role="status"
                className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
              >
                Verification email sent{email ? ` to ${email}` : ""}. Please check your
                inbox (and spam folder).
              </div>
            )}

            {resendState === "error" && resendError && (
              <div
                role="alert"
                className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {resendError}
              </div>
            )}

            {email ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendState === "sending" || cooldown > 0}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendState === "sending" && (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                )}
                {resendState === "sending"
                  ? "Sending..."
                  : cooldown > 0
                    ? `Resend available in ${cooldown}s`
                    : "Resend verification email"}
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                Didn&apos;t get a link, or opened this page directly? Please{" "}
                <Link href="/register" className="font-medium text-gray-900 underline">
                  register again
                </Link>{" "}
                to receive a new verification email.
              </p>
            )}
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Wrong email?{" "}
          <Link href="/register" className="font-medium text-gray-900 underline">
            Start over
          </Link>
        </p>
      </div>
    </main>
  );
}
