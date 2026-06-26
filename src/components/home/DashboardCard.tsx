import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type DashboardCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
};

/** White panel with light border — matches dashboard shell styling */
export function DashboardCard({ title, children, className, headerExtra }: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-cborder/50 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {(title || headerExtra) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
          {title ? <h3 className="text-sm font-semibold text-brand sm:text-base">{title}</h3> : <span />}
          {headerExtra}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
