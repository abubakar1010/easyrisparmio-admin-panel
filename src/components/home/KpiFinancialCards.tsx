import { useTranslation } from "react-i18next";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";

type Props = { data?: AdminDashboardData["financialKpis"] };

export function KpiFinancialCards({ data }: Props) {
  const { t } = useTranslation();
  const d = data;

  const items = [
    {
      label: t("dashboard.acquisition_commission"),
      value: d ? `€ ${d.acquisitionCommission.total.toLocaleString()}` : "—",
      sub: d ? `${d.acquisitionCommission.count} ${t("dashboard.contracts")}` : "",
      color: "text-[#3B82F6]",
    },
    {
      label: t("dashboard.recurring_commission"),
      value: d ? `€ ${d.recurringCommission.total.toLocaleString()}` : "—",
      sub: d ? `${d.recurringCommission.count} ${t("common.active").toLowerCase()}` : "",
      color: "text-emerald-600",
    },
    {
      label: t("dashboard.pending_revenue"),
      value: d ? `€ ${d.pendingRevenue.total.toLocaleString()}` : "—",
      sub: d ? `${d.pendingRevenue.count} ${t("common.pending").toLowerCase()}` : "",
      color: "text-orange-500",
    },
    {
      label: t("dashboard.churn_rate"),
      value: d ? `${d.churnRate}%` : "—",
      sub: "Target: <2%",
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-cborder/40 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5"
        >
          <p className="text-xs font-medium text-owngray">{item.label}</p>
          <p className={`mt-2 text-xl font-bold tracking-tight sm:text-2xl ${item.color}`}>{item.value}</p>
          <p className="mt-1 text-xs text-gray-500">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
