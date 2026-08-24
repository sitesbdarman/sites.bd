/**
 * Reusable status styling for future dashboard data (domains, services,
 * invoices, tickets). Not wired up to any real data yet — this just
 * prepares a consistent set of colors/labels so later phases don't
 * invent a new status system per feature.
 */
export type DashboardStatus =
  | "active"
  | "pending"
  | "processing"
  | "expired"
  | "suspended"
  | "paid"
  | "overdue"
  | "closed";

const STATUS_STYLES: Record<DashboardStatus, string> = {
  active: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  paid: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  processing: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  overdue: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  expired: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  suspended: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-300",
  closed: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-300",
};

const STATUS_LABELS: Record<DashboardStatus, string> = {
  active: "Active",
  pending: "Pending",
  processing: "Processing",
  expired: "Expired",
  suspended: "Suspended",
  paid: "Paid",
  overdue: "Overdue",
  closed: "Closed",
};

export function StatusBadge({ status }: { status: DashboardStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
