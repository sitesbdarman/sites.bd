import Link from "next/link";

/**
 * The password reset flow is now entirely OTP-based and lives at
 * /forgot-password (Email -> OTP -> New Password -> Done), so this route
 * no longer does anything itself. Kept as a redirect target in case an
 * old email link or bookmark still points here.
 */
export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-500">
          Password reset now starts from the forgot password page.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Go to Forgot Password
        </Link>
      </div>
    </main>
  );
}
