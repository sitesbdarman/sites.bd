import type { ComponentType, ReactNode, SVGProps } from "react";

interface EmptyStateProps {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  message: string;
  action?: ReactNode;
}

/**
 * A consistent "nothing here yet" state for dashboard sections. Takes a
 * plain message rather than fabricated sample data.
 */
export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      {Icon && (
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm text-gray-500">{message}</p>
      {action}
    </div>
  );
}
