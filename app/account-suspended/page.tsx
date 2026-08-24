import Link from "next/link";

export default function AccountSuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">!</div>
        <h1 className="mt-5 text-xl font-black">Your account has been suspended</h1>
        <p className="mt-3 text-sm text-gray-500">
          Access to your dashboard, domains and services has been temporarily locked. If you believe this is a
          mistake, please contact support.
        </p>
        <Link href="/contact" className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
          Contact Support
        </Link>
      </div>
    </main>
  );
}
