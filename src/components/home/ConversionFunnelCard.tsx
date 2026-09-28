import { useTranslation } from "react-i18next";
import { DashboardCard } from "./DashboardCard";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";
import { formatCount, formatPercent } from "../../utils/format";

type Props = { data?: AdminDashboardData["conversionFunnel"] };

export function ConversionFunnelCard({ data }: Props) {
  const { t } = useTranslation();
  const d = data;

  const requestReceived = d?.requestReceived ?? 0;
  const base = Math.max(requestReceived, 1);

  const funnelStages = [
    { label: t("dashboard.request_received"), value: requestReceived, barClass: "bg-[#3B82F6]" },
    { label: t("case_management.status.verified"), value: d?.verified ?? 0, barClass: "bg-[#3B82F6]" },
    { label: t("case_management.status.offer_sent"), value: d?.offerSent ?? 0, barClass: "bg-[#60A5FA]" },
    { label: t("case_management.status.offer_accepted"), value: d?.offerAccepted ?? 0, barClass: "bg-[#60A5FA]" },
    { label: t("dashboard.activation"), value: d?.activation ?? 0, barClass: "bg-[#22C55E]" },
  ];

  const dropOffs = [
    { label: t("dashboard.rejected_ko"), value: d?.rejected ?? 0, textClass: "text-red-600", barClass: "bg-red-500" },
    { label: t("case_management.status.cancelled"), value: d?.cancelled ?? 0, textClass: "text-gray-600", barClass: "bg-gray-400" },
  ];

  return (
    <DashboardCard title={t("dashboard.conversion_funnel")}>
      <div className="space-y-4">
        {funnelStages.map((s, i) => {
          const pct = (s.value / base) * 100;
          return (
            <div key={s.label}>
              <div className="mb-1 flex justify-between text-xs sm:text-sm">
                <span className="font-medium text-brand">{s.label}</span>
                <span className="tabular-nums text-gray-600">
                  {formatCount(s.value)}{i > 0 && requestReceived > 0 ? ` (${formatPercent(pct)})` : ""}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${s.barClass}`}
                  style={{ width: `${(s.value / base) * 100}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="space-y-4 border-t border-gray-100 pt-4">
          {dropOffs.map((s) => (
            <div key={s.label}>
              <div className="mb-1 flex justify-between text-xs sm:text-sm">
                <span className={`font-medium ${s.textClass}`}>{s.label}</span>
                <span className="tabular-nums text-gray-600">
                  {formatCount(s.value)}{requestReceived > 0 ? ` (${formatPercent((s.value / base) * 100)})` : ""}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${s.barClass}`}
                  style={{ width: `${(s.value / base) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-5 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
        {t("dashboard.conversion_rate")}: <span className="font-semibold text-brand">{formatPercent(d?.conversionRate ?? 0)}</span>
      </p>
    </DashboardCard>
  );
}
