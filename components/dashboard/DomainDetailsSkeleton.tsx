export function DomainDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="flex items-center gap-3">
          <div className="h-7 w-56 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="h-3.5 w-28 animate-pulse rounded bg-gray-100" />
              <div className="h-3.5 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-16 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
