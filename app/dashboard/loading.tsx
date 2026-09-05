import { DashboardSkeletonShell, Skeleton } from "@/components/dashboard/Skeleton";

/**
 * Shown by Next.js while the dashboard's Server Component (auth + profile +
 * counts fetch) is resolving. Mirrors the real page's layout — welcome
 * header, 4 stat cards, 2x2 section grid — so there's no layout shift once
 * data arrives.
 */
export default function DashboardLoading() {
  return (
    <DashboardSkeletonShell>
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-6 w-12" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-4 h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </DashboardSkeletonShell>
  );
}
