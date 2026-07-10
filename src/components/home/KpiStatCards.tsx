import { useTranslation } from "react-i18next";
import { LuFileStack, LuUsers } from "react-icons/lu";
import { FiCheckCircle } from "react-icons/fi";
import { LuClock } from "react-icons/lu";
import { MiniSparkline } from "./MiniSparkline";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";

const iconWrap = "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg";

type Props = { data?: AdminDashboardData["kpiStats"] };

export function KpiStatCards({ data }: Props) {
  const { t } = useTranslation();
  const s = data;

  const items = [
    {
      label: t("dashboard.total_switches"),
      value: s ? s.totalSwitches.value.toLocaleString() : "—",
      delta: s ? formatDelta(s.totalSwitches.delta, t("dashboard.vs_last_month")) : "",
      deltaPositive: (s?.totalSwitches.delta ?? 0) >= 0,
      icon: <LuFileStack className="h-5 w-5 text-white" />,
      iconBg: "bg-[#8B5CF6]",
    },
    {
      label: t("dashboard.active_customers"),
      value: s ? s.activeCustomers.value.toLocaleString() : "—",
      delta: s ? formatDelta(s.activeCustomers.delta, t("dashboard.growth")) : "",
      deltaPositive: (s?.activeCustomers.delta ?? 0) >= 0,
      icon: <LuUsers className="h-5 w-5 text-white" />,
      iconBg: "bg-[#3B82F6]",
    },
    {
      label: t("dashboard.conversion_rate"),
      value: s ? `${s.conversionRate.value}%` : "—",
      delta: s ? formatDelta(s.conversionRate.delta, t("dashboard.improvement")) : "",
      deltaPositive: (s?.conversionRate.delta ?? 0) >= 0,
      icon: <FiCheckCircle className="h-5 w-5 text-white" />,
      iconBg: "bg-[#22C55E]",
    },
    {
      label: t("dashboard.avg_processing_time"),
      value: s ? `${s.avgProcessingTime.value} ${t("dashboard.days")}` : "—",
      delta: s ? formatTimeDelta(s.avgProcessingTime.delta, t) : "",
      deltaPositive: (s?.avgProcessingTime.delta ?? 0) <= 0,
      icon: <LuClock className="h-5 w-5 text-white" />,
      iconBg: "bg-[#F97316]",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-cborder/40 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className={`${iconWrap} ${item.iconBg}`}>{item.icon}</div>
            <MiniSparkline positive={item.deltaPositive} />
          </div>
          <p className="mt-4 text-xs font-medium text-owngray">{item.label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-brand sm:text-[26px]">{item.value}</p>
          <p
            className={`mt-2 text-xs font-medium ${item.deltaPositive ? "text-emerald-600" : "text-red-600"}`}
          >
            {item.delta}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatDelta(delta: number, suffix: string): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta}% ${suffix}`;
}

function formatTimeDelta(delta: number, t: (key: string) => string): string {
  if (delta === 0) return t("dashboard.no_change");
  const abs = Math.abs(delta);
  return delta > 0 ? `+${abs} ${t("dashboard.days_delay")}` : `-${abs} ${t("dashboard.days_faster")}`;
}
