import { DashboardSkeletonShell, Skeleton } from "@/components/dashboard/Skeleton";

/** Mirrors the real invoices table layout. */
export default function InvoicesLoading() {
  return (
    <DashboardSkeletonShell>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="m-3 h-10 w-[calc(100%-1.5rem)]" />
        ))}
      </div>
    </DashboardSkeletonShell>
  );
}
