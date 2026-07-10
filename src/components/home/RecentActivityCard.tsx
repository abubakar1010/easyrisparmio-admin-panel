import { useTranslation } from "react-i18next";
import { DashboardCard } from "./DashboardCard";
import { FiChevronRight } from "react-icons/fi";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";

type Activity = AdminDashboardData["recentActivity"][number];
type Props = { data?: AdminDashboardData["recentActivity"] };

const dotColors: Record<string, string> = {
  contract: "bg-emerald-500",
  document: "bg-[#3B82F6]",
  case: "bg-[#8B5CF6]",
  bill: "bg-orange-500",
  user: "bg-sky-500",
};

function getDotColor(entityType: string): string {
  return dotColors[entityType] ?? "bg-gray-400";
}

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("dashboard.just_now");
  if (mins < 60) return `${mins} ${t("dashboard.minutes_ago")}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${t("dashboard.hours_ago")}`;
  const days = Math.floor(hours / 24);
  return `${days} ${t("dashboard.days_ago")}`;
}

export function RecentActivityCard({ data }: Props) {
  const { t } = useTranslation();
  const items = data ?? [];

  if (items.length === 0) {
    return (
      <DashboardCard title={t("dashboard.recent_activity")}>
        <p className="py-8 text-center text-sm text-gray-400">{t("dashboard.no_recent_activity")}</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title={t("dashboard.recent_activity")}>
      <ul className="relative space-y-0 pl-2">
        <span className="absolute left-[12px] top-2 bottom-2 w-px bg-gray-200" aria-hidden />
        {items.map((item: Activity) => {
          const userName = item.user
            ? `${item.user.firstName} ${item.user.lastName}`
            : "";
          return (
            <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
              <span
                className={`relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-3 ring-white ${getDotColor(item.entityType)}`}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand">{item.action}</p>
                <p className="text-xs text-gray-600">
                  {userName && `${userName} · `}
                  {item.entityType}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">{timeAgo(item.createdAt, t)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="mt-2 flex w-full items-center justify-start gap-1 border-t border-gray-100 pt-4 text-sm font-semibold text-[#3B82F6] hover:text-[#2563EB]"
      >
        View full timeline <FiChevronRight className="h-4 w-4" />
      </button>
    </DashboardCard>
  );
}
