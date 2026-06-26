import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";

type Props = { data?: AdminDashboardData["financialKpis"] };

export function KpiFinancialCards({ data }: Props) {
  const d = data;

  const items = [
    {
      label: "Acquisition Commission",
      value: d ? `€ ${d.acquisitionCommission.total.toLocaleString()}` : "—",
      sub: d ? `${d.acquisitionCommission.count} contracts` : "",
      color: "text-[#3B82F6]",
    },
    {
      label: "Recurring Commission",
      value: d ? `€ ${d.recurringCommission.total.toLocaleString()}` : "—",
      sub: d ? `${d.recurringCommission.count} active` : "",
      color: "text-emerald-600",
    },
    {
      label: "Pending Revenue",
      value: d ? `€ ${d.pendingRevenue.total.toLocaleString()}` : "—",
      sub: d ? `${d.pendingRevenue.count} pending` : "",
      color: "text-orange-500",
    },
    {
      label: "Churn Rate",
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
