import { DomainDetailsSkeleton } from "@/components/dashboard/DomainDetailsSkeleton";

export default function DomainDetailsLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <DomainDetailsSkeleton />
      </div>
    </div>
  );
}
