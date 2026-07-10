import { useTranslation } from "react-i18next";
import { DashboardCard } from "./DashboardCard";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";

type Props = { data?: AdminDashboardData["conversionFunnel"] };

export function ConversionFunnelCard({ data }: Props) {
  const { t } = useTranslation();
  const d = data;

  const stages = [
    { label: t("dashboard.request_received"), value: d?.requestReceived ?? 0, barClass: "bg-[#3B82F6]" },
    { label: t("dashboard.documentation"), value: d?.documentation ?? 0, barClass: "bg-[#3B82F6]" },
    { label: t("dashboard.validation"), value: d?.validation ?? 0, barClass: "bg-[#3B82F6]" },
    { label: t("dashboard.activation"), value: d?.activation ?? 0, barClass: "bg-[#22C55E]" },
    { label: t("dashboard.rejected_ko"), value: d?.rejected ?? 0, barClass: "bg-red-500" },
  ];

  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <DashboardCard title={t("dashboard.conversion_funnel")}>
      <div className="space-y-4">
        {stages.map((s) => (
          <div key={s.label}>
            <div className="mb-1 flex justify-between text-xs sm:text-sm">
              <span className="font-medium text-brand">{s.label}</span>
              <span className="tabular-nums text-gray-600">{s.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${s.barClass}`}
                style={{ width: `${(s.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
        {t("dashboard.conversion_rate")}: <span className="font-semibold text-brand">{d?.conversionRate ?? 0}%</span>
      </p>
    </DashboardCard>
  );
}
