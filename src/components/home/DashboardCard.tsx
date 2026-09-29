import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type DashboardCardProps = {
  title?: string;
  /** One line under the title saying what the card counts. */
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerExtra?: ReactNode;
  footer?: ReactNode;
};

/**
 * White panel shared by every dashboard widget. It is a flex column so a card
 * stretched by its grid row keeps its footer at the bottom instead of leaving
 * a gap under the content.
 */
export function DashboardCard({
  title,
  subtitle,
  icon,
  children,
  className,
  bodyClassName,
  headerExtra,
  footer,
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {(title || headerExtra) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {icon ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              {title ? (
                <h3 className="truncate text-[15px] font-semibold text-brand">{title}</h3>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
        </header>
      )}
      <div className={cn("flex-1 px-5 py-5 sm:px-6", bodyClassName)}>{children}</div>
      {footer ? (
        <footer className="border-t border-slate-100 px-5 py-3.5 sm:px-6">{footer}</footer>
      ) : null}
    </section>
  );
}

/** Footer link shared by the cards ("view all", "full timeline"). */
export function CardFooterLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex cursor-pointer items-center gap-1 rounded-md text-sm font-semibold text-primary outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary/35"
    >
      {children}
    </button>
  );
}

/** Centred icon + message for a card with nothing to show. */
export function CardEmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        {icon}
      </span>
      <p className="text-sm font-semibold text-brand">{title}</p>
      {description ? <p className="max-w-xs text-xs text-slate-500">{description}</p> : null}
    </div>
  );
}
