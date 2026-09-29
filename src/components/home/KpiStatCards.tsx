import { useTranslation } from "react-i18next";
import { LuClock, LuFileStack, LuTrendingDown, LuTrendingUp, LuUsers } from "react-icons/lu";
import { FiCheckCircle } from "react-icons/fi";
import { MiniSparkline } from "./MiniSparkline";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";
import { formatCount, formatDecimal, formatPercent } from "../../utils/format";
import { cn } from "../../utils/cn";

type Props = { data?: AdminDashboardData["kpiStats"] };

export function KpiStatCards({ data }: Props) {
  const { t } = useTranslation();
  const s = data;

  const items = [
    {
      label: t("dashboard.total_switches"),
      value: s ? formatCount(s.totalSwitches.value) : "—",
      delta: s ? formatDelta(s.totalSwitches.delta) : "",
      context: t("dashboard.vs_last_month"),
      deltaPositive: (s?.totalSwitches.delta ?? 0) >= 0,
      sparkline: s?.totalSwitches.sparkline,
      icon: <LuFileStack className="h-5 w-5" />,
      iconClass: "bg-violet-50 text-violet-600",
    },
    {
      label: t("dashboard.active_customers"),
      value: s ? formatCount(s.activeCustomers.value) : "—",
      delta: s ? formatDelta(s.activeCustomers.delta) : "",
      context: t("dashboard.growth"),
      deltaPositive: (s?.activeCustomers.delta ?? 0) >= 0,
      sparkline: s?.activeCustomers.sparkline,
      icon: <LuUsers className="h-5 w-5" />,
      iconClass: "bg-sky-50 text-sky-600",
    },
    {
      label: t("dashboard.conversion_rate"),
      value: s ? formatPercent(s.conversionRate.value) : "—",
      delta: s ? formatDelta(s.conversionRate.delta) : "",
      context: t("dashboard.improvement"),
      deltaPositive: (s?.conversionRate.delta ?? 0) >= 0,
      sparkline: s?.conversionRate.sparkline,
      icon: <FiCheckCircle className="h-5 w-5" />,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: t("dashboard.avg_processing_time"),
      value: s ? formatDecimal(s.avgProcessingTime.value) : "—",
      unit: s ? t("dashboard.days") : undefined,
      delta: s ? formatTimeDelta(s.avgProcessingTime.delta) : "",
      context: s ? timeDeltaContext(s.avgProcessingTime.delta, t) : "",
      // Shorter is better here, so a drop in days is the good direction.
      deltaPositive: (s?.avgProcessingTime.delta ?? 0) <= 0,
      trendUp: (s?.avgProcessingTime.delta ?? 0) > 0,
      sparkline: s?.avgProcessingTime.sparkline,
      icon: <LuClock className="h-5 w-5" />,
      iconClass: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const trendUp = item.trendUp ?? item.deltaPositive;
        const TrendIcon = trendUp ? LuTrendingUp : LuTrendingDown;
        return (
          <div
            key={item.label}
            className="flex min-w-0 flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-slate-500">{item.label}</p>
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", item.iconClass)}>
                {item.icon}
              </span>
            </div>
            <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-semibold tracking-tight text-brand tabular-nums">
              {item.value}
              {item.unit ? <span className="text-base font-medium text-slate-500">{item.unit}</span> : null}
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              {item.delta ? (
                <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold tabular-nums",
                      item.deltaPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    )}
                  >
                    <TrendIcon className="h-3.5 w-3.5" />
                    {item.delta}
                  </span>
                  <span className="text-slate-500">{item.context}</span>
                </p>
              ) : (
                <span />
              )}
              <MiniSparkline
                positive={item.deltaPositive}
                data={item.sparkline}
                className="h-9 w-24 shrink-0"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${formatPercent(delta)}`;
}

function formatTimeDelta(delta: number): string {
  if (delta === 0) return "±0";
  const abs = formatDecimal(Math.abs(delta));
  return delta > 0 ? `+${abs}` : `-${abs}`;
}

function timeDeltaContext(delta: number, t: (key: string) => string): string {
  if (delta === 0) return t("dashboard.no_change");
  return delta > 0 ? t("dashboard.days_delay") : t("dashboard.days_faster");
}
