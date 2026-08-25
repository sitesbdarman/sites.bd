interface SkeletonProps {
  className?: string;
}

/** A single pulsing gray block. Compose these to match a page's real layout. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

/** Static shell (sidebar + header outline) so skeleton pages don't flash unstyled. */
export function DashboardSkeletonShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
          <Skeleton className="h-5 w-32" />
          <div className="ml-auto flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
