import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { LuRefreshCw, LuTriangleAlert } from "react-icons/lu";
import { useGetAdminDashboardQuery } from "../../redux/features/Dashboard/dashboardApi";
import { KpiStatCards } from "../../components/home/KpiStatCards";
import { PriorityTasksCard } from "../../components/home/PriorityTasksCard";
import { ConversionFunnelCard } from "../../components/home/ConversionFunnelCard";
import { ActiveAlertsCard } from "../../components/home/ActiveAlertsCard";
import { RecentActivityCard } from "../../components/home/RecentActivityCard";
import { getLocale } from "../../utils/format";
import { cn } from "../../utils/cn";

const Home = () => {
  const { t } = useTranslation();
  const { data, isLoading, isFetching, isError, refetch, fulfilledTimeStamp } =
    useGetAdminDashboardQuery();

  const today = new Date().toLocaleDateString(getLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const updatedAt = fulfilledTimeStamp
    ? new Date(fulfilledTimeStamp).toLocaleTimeString(getLocale(), {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm capitalize text-slate-500">{today}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-brand">
            {t("dashboard.overview_title")}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt ? (
            <span className="hidden text-xs text-slate-500 sm:inline">
              {t("dashboard.updated_at", { time: updatedAt })}
            </span>
          ) : null}
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            icon={<LuRefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />}
            className="rounded-xl"
          >
            {t("dashboard.refresh")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError && !data ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <LuTriangleAlert className="h-6 w-6" />
          </span>
          <p className="text-sm font-semibold text-brand">{t("dashboard.load_error")}</p>
          <Button type="primary" className="rounded-xl" onClick={() => refetch()}>
            {t("dashboard.retry")}
          </Button>
        </div>
      ) : (
        <>
          <KpiStatCards data={data?.kpiStats} />

          {/* Main column holds the funnel and the two work lists; the activity
              feed on the right stretches to that column's height and scrolls,
              so neither side leaves an empty hole under a short card. */}
          <div className="grid gap-4 xl:grid-cols-3 xl:gap-5">
            <div className="flex min-w-0 flex-col gap-4 xl:col-span-2 xl:gap-5">
              <ConversionFunnelCard data={data?.conversionFunnel} />
              <div className="grid flex-1 gap-4 lg:grid-cols-2 xl:gap-5">
                <PriorityTasksCard data={data?.priorityTasks} />
                <ActiveAlertsCard data={data?.activeAlerts} />
              </div>
            </div>
            <div className="relative min-h-0 max-xl:max-h-[560px] max-xl:flex">
              <RecentActivityCard
                data={data?.recentActivity}
                className="w-full xl:absolute xl:inset-0"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function DashboardSkeleton() {
  const block = "animate-pulse rounded-2xl border border-slate-200/70 bg-white";
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(block, "h-[150px] p-5")}>
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="mt-4 h-7 w-1/3 rounded bg-slate-100" />
            <div className="mt-6 h-3 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className={cn(block, "h-[340px]")} />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className={cn(block, "h-[260px]")} />
            <div className={cn(block, "h-[260px]")} />
          </div>
        </div>
        <div className={cn(block, "h-[620px]")} />
      </div>
    </div>
  );
}

export default Home;
