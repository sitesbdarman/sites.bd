import { DashboardSkeletonShell, Skeleton } from "@/components/dashboard/Skeleton";

/** Mirrors the real domains table: search bar + status filter + rows. */
export default function DomainsLoading() {
  return (
    <DashboardSkeletonShell>
      <div className="mb-4 h-20 rounded-xl border border-gray-200 bg-white p-4">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:max-w-xs" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </DashboardSkeletonShell>
  );
}
