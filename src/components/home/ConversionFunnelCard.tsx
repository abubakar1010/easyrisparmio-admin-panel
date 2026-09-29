import { useTranslation } from "react-i18next";
import { LuFilter } from "react-icons/lu";
import { DashboardCard } from "./DashboardCard";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";
import { formatCount, formatPercent } from "../../utils/format";
import { cn } from "../../utils/cn";

type Props = { data?: AdminDashboardData["conversionFunnel"] };

export function ConversionFunnelCard({ data }: Props) {
  const { t } = useTranslation();
  const d = data;

  const requestReceived = d?.requestReceived ?? 0;
  const base = Math.max(requestReceived, 1);
  const pctOf = (value: number) => (value / base) * 100;

  // Bars darken as the bill moves down the funnel; activation is the win.
  const funnelStages = [
    { label: t("dashboard.request_received"), value: requestReceived, barClass: "bg-primary/35" },
    { label: t("case_management.status.verified"), value: d?.verified ?? 0, barClass: "bg-primary/50" },
    { label: t("case_management.status.offer_sent"), value: d?.offerSent ?? 0, barClass: "bg-primary/65" },
    { label: t("case_management.status.offer_accepted"), value: d?.offerAccepted ?? 0, barClass: "bg-primary/80" },
    { label: t("dashboard.activation"), value: d?.activation ?? 0, barClass: "bg-emerald-500" },
  ];

  const dropOffs = [
    { label: t("dashboard.rejected_ko"), value: d?.rejected ?? 0, dotClass: "bg-red-500" },
    { label: t("case_management.status.cancelled"), value: d?.cancelled ?? 0, dotClass: "bg-slate-400" },
  ];

  return (
    <DashboardCard
      title={t("dashboard.conversion_funnel")}
      icon={<LuFilter className="h-[18px] w-[18px]" />}
      headerExtra={
        <div className="text-right">
          <p className="text-xs text-slate-500">{t("dashboard.conversion_rate")}</p>
          <p className="text-lg font-semibold leading-tight text-emerald-600 tabular-nums">
            {formatPercent(d?.conversionRate ?? 0)}
          </p>
        </div>
      }
    >
      <ol className="space-y-3.5">
        {funnelStages.map((s, i) => (
          <li key={s.label} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-4 max-sm:grid-cols-[1fr_auto]">
            <span className="flex min-w-0 items-center gap-2.5 text-sm text-slate-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                {i + 1}
              </span>
              <span className="truncate font-medium">{s.label}</span>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-slate-100 max-sm:order-last max-sm:col-span-2">
              <span
                className={cn("block h-full rounded-full transition-[width] duration-500", s.barClass)}
                style={{ width: `${pctOf(s.value)}%` }}
              />
            </span>
            <span className="min-w-[5.5rem] text-right text-sm tabular-nums">
              <span className="font-semibold text-brand">{formatCount(s.value)}</span>
              {i > 0 && requestReceived > 0 ? (
                <span className="ml-1.5 text-xs text-slate-500">{formatPercent(pctOf(s.value))}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
        {dropOffs.map((s) => (
          <div key={s.label} className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className={cn("h-2 w-2 rounded-full", s.dotClass)} />
              {s.label}
            </p>
            <p className="mt-1 text-sm tabular-nums">
              <span className="text-lg font-semibold text-brand">{formatCount(s.value)}</span>
              {requestReceived > 0 ? (
                <span className="ml-1.5 text-xs text-slate-500">{formatPercent(pctOf(s.value))}</span>
              ) : null}
            </p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
