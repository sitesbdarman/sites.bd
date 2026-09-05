import type { ComponentType, SVGProps } from "react";

interface StatCardProps {
  title: string;
  /** Displayed as-is, so callers can pass a formatted string or a number. */
  value: number | string;
  description?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Accent color — lets stat cards be told apart at a glance instead of all sharing one blue tone. */
  tone?: "blue" | "emerald" | "amber" | "violet";
}

const TONE_TEXT: Record<NonNullable<StatCardProps["tone"]>, string> = {
  blue: "text-blue-600",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  violet: "text-violet-600",
};

/**
 * A single dashboard statistic. Purely presentational — the caller
 * decides where `value` comes from, so this same component works for
 * today's placeholder zeros and tomorrow's real counts.
 *
 * Deliberately not the "icon in a rounded pastel square" card — the tone
 * shows up as a 3px accent edge (this product's one recurring emphasis
 * device, also used for the active sidebar item) and the icon sits quietly
 * beside the label instead of inside a decorative badge.
 */
export function StatCard({ title, value, description, icon: Icon, tone = "blue" }: StatCardProps) {
  return (
    <div className={`surface accent-bar overflow-hidden p-5 pl-6 ${TONE_TEXT[tone]}`}>
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="tabular mt-2 text-[1.75rem] font-semibold leading-none text-gray-900">{value}</p>
      {description && <p className="mt-2 text-xs text-gray-400">{description}</p>}
    </div>
  );
}
