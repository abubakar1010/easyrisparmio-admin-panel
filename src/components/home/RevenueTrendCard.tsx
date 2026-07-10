import { useTranslation } from "react-i18next";
import { DashboardCard } from "./DashboardCard";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";

const monthLabels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

type Props = { data?: AdminDashboardData["revenueTrend"] };

export function RevenueTrendCard({ data }: Props) {
  const { t } = useTranslation();
  const trend = data ?? [];

  // Sum totals across all months
  const totalPotential = trend.reduce((s, r) => s + r.potential, 0);
  const totalValidated = trend.reduce((s, r) => s + r.validated, 0);
  const totalCollected = trend.reduce((s, r) => s + r.collected, 0);

  // Build chart points from collected values
  const collected = trend.map((r) => r.collected);
  const chartMax = Math.max(...collected, 1);

  return (
    <DashboardCard title={t("dashboard.revenue_trend")}>
      <div className="flex w-full flex-col rounded-lg bg-gradient-to-b from-sky-50/80 to-white pt-3">
        {collected.length > 1 ? (
          <RevenueAreaChart values={collected} max={chartMax} />
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-gray-400">
            No trend data yet
          </div>
        )}
        <div className="flex justify-between px-0.5 pb-1 text-[10px] font-medium text-gray-400 sm:text-xs">
          {trend.length > 0
            ? trend.map((r) => (
                <span key={r.month}>{monthLabels[parseInt(r.month.split("-")[1], 10) - 1]}</span>
              ))
            : monthLabels.map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
      <div className="-mx-4 -mb-4 mt-4 flex justify-between rounded-b-xl border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:-mx-5 sm:-mb-5 sm:px-8 sm:py-5">
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xs text-slate-500 sm:text-sm">{t("dashboard.potential")}</span>
          <span className="text-sm font-bold text-slate-900 sm:text-base">
            {formatEuro(totalPotential)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xs text-slate-500 sm:text-sm">{t("dashboard.validated")}</span>
          <span className="text-sm font-bold text-blue-600 sm:text-base">
            {formatEuro(totalValidated)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xs text-slate-500 sm:text-sm">{t("dashboard.collected")}</span>
          <span className="text-sm font-bold text-emerald-600 sm:text-base">
            {formatEuro(totalCollected)}
          </span>
        </div>
      </div>
    </DashboardCard>
  );
}

function RevenueAreaChart({ values, max }: { values: number[]; max: number }) {
  const w = 400;
  const h = 100;
  const pad = 10;
  const usableH = h - pad * 2;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = pad + usableH - (v / max) * usableH;
    return `${x},${y}`;
  });

  const line = points.join(" ");
  const area = `${points.join(" ")} ${w},${h} 0,${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h + 10}`} className="h-32 w-full shrink-0" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#revFill)" points={area} />
      <polyline fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={line} />
    </svg>
  );
}

function formatEuro(n: number): string {
  return `€ ${n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
