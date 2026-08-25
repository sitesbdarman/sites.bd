"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/TextField";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { createClient } from "@/lib/supabase/client";

interface FormValues {
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  email: "",
  password: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  }

  return errors;
}

/**
 * A login-specific outcome for the "your email isn't verified yet" case —
 * kept separate from `submitError` so we can show a link to the existing
 * verification page instead of a plain error banner.
 */
type UnverifiedState = { email: string } | null;

/**
 * Maps a Supabase Auth signInWithPassword() error to a short, user-facing
 * message. Prefers the stable `error.code` (e.g. "invalid_credentials")
 * over message text, since message wording isn't guaranteed to stay the
 * same across Supabase versions.
 */
function mapLoginError(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password. Please try again.";
    case "user_banned":
      return "This account has been suspended. Contact support for help.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a moment and try again.";
    case "validation_failed":
    case "bad_json":
      return "That email or password doesn't look right. Please check and try again.";
    default:
      break;
  }

  const normalized = error.message.toLowerCase();
  if (normalized.includes("invalid login credentials") || normalized.includes("invalid credentials")) {
    return "Incorrect email or password. Please try again.";
  }

  return "Something went wrong signing you in. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState<UnverifiedState>(null);

  function handleChange(field: keyof FormValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Guards against duplicate submissions (e.g. double-click, double Enter)
    // while a request is already in flight.
    if (isSubmitting) {
      return;
    }

    setSubmitError(null);
    setUnverified(null);

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const email = values.email.trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });

      if (error) {
        if (error.code === "email_not_confirmed") {
          // Not fully authenticated yet — send them to the existing
          // verification page rather than treating this as a login error.
          setUnverified({ email });
          return;
        }

        setSubmitError(mapLoginError(error));
        return;
      }

      if (!data.session) {
        setSubmitError("Something went wrong signing you in. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
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
          <h1 className="text-2xl font-bold tracking-tight">Log in</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back. Log in to manage your domains, hosting, and services.
          </p>
        </div>

        {unverified && (
          <div
            role="alert"
            className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            <p>Your email address hasn&apos;t been verified yet. Please verify it before logging in.</p>
            <Link
              href={`/verify-email?email=${encodeURIComponent(unverified.email)}`}
              className="mt-2 inline-block font-medium text-amber-900 underline"
            >
              Go to email verification
            </Link>
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={handleChange("email")}
            error={errors.email}
            disabled={isSubmitting}
          />

          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={values.password}
            onChange={handleChange("password")}
            error={errors.password}
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-end text-sm">
            <Link href="/forgot-password" className="font-medium text-gray-900 underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-gray-900 underline">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
