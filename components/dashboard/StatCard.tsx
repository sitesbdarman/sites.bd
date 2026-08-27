import type { ComponentType, SVGProps } from "react";

interface StatCardProps {
  title: string;
  /** Displayed as-is, so callers can pass a formatted string or a number. */
  value: number | string;
  description?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Icon accent color — lets stat cards be told apart at a glance instead of all sharing one blue tone. */
  tone?: "blue" | "emerald" | "amber" | "violet";
}

const TONE_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

/**
 * A single dashboard statistic. Purely presentational — the caller
 * decides where `value` comes from, so this same component works for
 * today's placeholder zeros and tomorrow's real counts.
 */
export function StatCard({ title, value, description, icon: Icon, tone = "blue" }: StatCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE_STYLES[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
        {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
      </div>
    </div>
  );
}
