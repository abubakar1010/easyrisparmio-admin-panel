import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FiChevronRight } from "react-icons/fi";
import { LuCircleCheckBig } from "react-icons/lu";
import { DashboardCard } from "./DashboardCard";
import { getPriorityTaskUi } from "../../constants/priorityTasks";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";

type Props = { data?: AdminDashboardData["priorityTasks"] };

/**
 * The buckets of outstanding work, straight from the server.
 *
 * Rendered from `data.categories` rather than from a fixed list of four rows:
 * what is actually pending is the server's call, and hard-coding the rows here
 * is what let "Missing Documents" sit at zero forever while nine bills waited
 * on validation with nowhere on this card to show it.
 *
 * Every row opens the customers and cases it counts, so a number on this card
 * is always something the admin can act on.
 */
export function PriorityTasksCard({ data }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Empty buckets are noise on a to-do list — the total below still reports the
  // whole picture, and an all-clear card says so outright.
  const categories = (data?.categories ?? []).filter((c) => c.count > 0);
  const total = data?.total ?? 0;

  return (
    <DashboardCard
      title={t("dashboard.priority_tasks")}
      headerExtra={
        total > 0 ? (
          <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">
            {t("priority_tasks.open_count", { count: total })}
          </span>
        ) : undefined
      }
    >
      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <LuCircleCheckBig className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-semibold text-brand">
            {t("priority_tasks.all_clear")}
          </p>
          <p className="text-xs text-gray-500">
            {t("priority_tasks.all_clear_desc")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => {
            const ui = getPriorityTaskUi(category.key);
            const Icon = ui.icon;
            return (
              <li key={category.key}>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/priority-tasks?category=${category.key}`)
                  }
                  aria-label={t("priority_tasks.open_category", {
                    category: t(ui.labelKey),
                    count: category.count,
                  })}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-left transition hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${ui.bg} ${ui.border}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80">
                    <Icon className={`h-5 w-5 ${ui.iconColor}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand">
                      {t(ui.labelKey)}
                    </p>
                    <p className="truncate text-xs text-gray-600">
                      {t(ui.descKey)}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-brand">
                    {category.count}
                  </span>
                  <FiChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => navigate("/priority-tasks")}
        className="mt-4 flex w-full cursor-pointer items-center justify-start gap-1 text-sm font-semibold text-[#3B82F6] hover:text-[#2563EB]"
      >
        {t("priority_tasks.view_all")}
        {total > 0 ? ` (${total})` : ""}
        <FiChevronRight className="h-4 w-4" />
      </button>
    </DashboardCard>
  );
}
