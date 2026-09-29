import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { CardEmptyState, CardFooterLink, DashboardCard } from "./DashboardCard";
import { FiChevronRight } from "react-icons/fi";
import { LuActivity, LuHistory } from "react-icons/lu";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";
import { translateActivityAction, translateEntityType } from "../../utils/activityLabels";
import { getEntityRoute } from "../../lib/helpers/entityRoute";
import { getLocale } from "../../utils/format";
import { cn } from "../../utils/cn";

type Activity = AdminDashboardData["recentActivity"][number];
type Props = { data?: AdminDashboardData["recentActivity"]; className?: string };

const dotColors: Record<string, string> = {
  contract: "bg-emerald-500",
  document: "bg-sky-500",
  case: "bg-violet-500",
  bill: "bg-orange-500",
  user: "bg-cyan-500",
  offer: "bg-teal-500",
  supplier: "bg-pink-500",
};

function getDotColor(entityType: string): string {
  return dotColors[entityType] ?? "bg-slate-400";
}

/**
 * "3 minuti fa", "ieri", "2 giorni fa" — Intl gets the Italian singular and
 * plural right, which a fixed "{n} giorni fa" suffix could not ("1 giorni fa").
 */
function timeAgo(dateStr: string, t: (key: string) => string): string {
  const diffSec = Math.round((new Date(dateStr).getTime() - Date.now()) / 1000);
  if (Math.abs(diffSec) < 60) return t("dashboard.just_now");
  const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: "auto" });
  const mins = Math.round(diffSec / 60);
  if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  return new Date(dateStr).toLocaleDateString(getLocale(), { day: "numeric", month: "short" });
}

export function RecentActivityCard({ data, className }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = data ?? [];

  return (
    <DashboardCard
      className={cn("min-h-0", className)}
      title={t("dashboard.recent_activity")}
      icon={<LuActivity className="h-[18px] w-[18px]" />}
      bodyClassName="min-h-0 overflow-y-auto px-3 py-3 sm:px-3 [scrollbar-width:thin]"
      footer={
        <CardFooterLink onClick={() => navigate("/activity-history")}>
          {t("dashboard.view_full_timeline")}
          <FiChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </CardFooterLink>
      }
    >
      {items.length === 0 ? (
        <CardEmptyState
          icon={<LuHistory className="h-6 w-6" />}
          title={t("dashboard.no_recent_activity")}
        />
      ) : (
        <ul className="relative">
          {items.map((item: Activity, index) => {
            const userName = item.user
              ? `${item.user.firstName} ${item.user.lastName}`
              : "";
            const route = getEntityRoute(item.entityType, item.entityId);
            const isLast = index === items.length - 1;
            const content = (
              <>
                <span className="relative flex w-3 shrink-0 justify-center self-stretch">
                  {!isLast ? (
                    <span className="absolute top-4 -bottom-7 w-px bg-slate-200" aria-hidden />
                  ) : null}
                  <span
                    className={cn("relative mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white", getDotColor(item.entityType))}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-brand">
                      {translateActivityAction(item.action)}
                    </p>
                    <time
                      dateTime={item.createdAt}
                      title={new Date(item.createdAt).toLocaleString(getLocale())}
                      className="shrink-0 text-xs text-slate-400"
                    >
                      {timeAgo(item.createdAt, t)}
                    </time>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {userName && `${userName} · `}
                    {translateEntityType(item.entityType)}
                  </p>
                </div>
              </>
            );
            return (
              <li key={item.id} className="pb-3 last:pb-0">
                {route ? (
                  <button
                    type="button"
                    onClick={() => navigate(route)}
                    className="flex w-full cursor-pointer gap-3 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex gap-3 px-3 py-1.5">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
