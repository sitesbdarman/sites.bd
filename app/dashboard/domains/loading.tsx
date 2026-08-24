/**
 * Shown by Next.js while the domains page's Server Component (auth +
 * domain fetch) is resolving. Matches app/dashboard/loading.tsx.
 */
export default function DomainsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
      />
      <span className="sr-only">Loading your domains…</span>
    </div>
  );
}
