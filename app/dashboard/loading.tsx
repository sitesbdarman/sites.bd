/**
 * Shown by Next.js while the dashboard's Server Component (auth + profile
 * fetch) is resolving. Deliberately subtle — no layout/shell duplication,
 * just a small centered indicator.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
      />
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}
