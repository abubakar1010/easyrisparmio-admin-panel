import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FiChevronRight } from "react-icons/fi";
import { LuCircleCheckBig, LuListTodo } from "react-icons/lu";
import { CardEmptyState, CardFooterLink, DashboardCard } from "./DashboardCard";
import { getPriorityTaskUi } from "../../constants/priorityTasks";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";
import { formatCount } from "../../utils/format";
import { cn } from "../../utils/cn";

type Props = { data?: AdminDashboardData["priorityTasks"]; className?: string };

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
export function PriorityTasksCard({ data, className }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Empty buckets are noise on a to-do list — the total below still reports the
  // whole picture, and an all-clear card says so outright.
  const categories = (data?.categories ?? []).filter((c) => c.count > 0);
  const total = data?.total ?? 0;

  return (
    <DashboardCard
      className={className}
      title={t("dashboard.priority_tasks")}
      subtitle={t("priority_tasks.subtitle")}
      icon={<LuListTodo className="h-[18px] w-[18px]" />}
      headerExtra={
        total > 0 ? (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            {t("priority_tasks.open_count", { count: total })}
          </span>
        ) : undefined
      }
      footer={
        <CardFooterLink onClick={() => navigate("/priority-tasks")}>
          {t("priority_tasks.view_all")}
          {total > 0 ? ` (${formatCount(total)})` : ""}
          <FiChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </CardFooterLink>
      }
    >
      {categories.length === 0 ? (
        <CardEmptyState
          icon={<LuCircleCheckBig className="h-6 w-6" />}
          title={t("priority_tasks.all_clear")}
          description={t("priority_tasks.all_clear_desc")}
        />
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
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200/70 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                >
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", ui.bg)}>
                    <Icon className={cn("h-5 w-5", ui.iconColor)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand">
                      {t(ui.labelKey)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {t(ui.descKey)}
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-brand tabular-nums">
                    {formatCount(category.count)}
                  </span>
                  <FiChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
