import { DashboardSkeletonShell, Skeleton } from "@/components/dashboard/Skeleton";

/** Mirrors the real tickets page: search/filter row + create button + table. */
export default function TicketsLoading() {
  return (
    <DashboardSkeletonShell>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-9 w-32" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="m-3 h-10 w-[calc(100%-1.5rem)]" />
          ))}
        </div>
      </div>
    </DashboardSkeletonShell>
  );
}
