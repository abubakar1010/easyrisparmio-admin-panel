import { useTranslation } from "react-i18next";
import { DashboardCard } from "./DashboardCard";
import { FiChevronRight } from "react-icons/fi";
import { LuFileWarning, LuCalendarClock, LuClipboardCheck, LuPhone } from "react-icons/lu";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";

type Props = { data?: AdminDashboardData["priorityTasks"] };

export function PriorityTasksCard({ data }: Props) {
  const { t } = useTranslation();
  const d = data;

  const rows = [
    {
      title: t("dashboard.missing_documents"),
      desc: `${d?.missingDocuments ?? 0} ${t("dashboard.contracts_waiting")}`,
      count: String(d?.missingDocuments ?? 0),
      bg: "bg-red-50",
      border: "border-red-100",
      icon: <LuFileWarning className="h-5 w-5 text-red-600" />,
    },
    {
      title: t("dashboard.expiring_contracts"),
      desc: t("dashboard.within_30_days"),
      count: String(d?.expiringContracts ?? 0),
      bg: "bg-orange-50",
      border: "border-orange-100",
      icon: <LuCalendarClock className="h-5 w-5 text-orange-600" />,
    },
    {
      title: t("dashboard.pending_validation"),
      desc: t("dashboard.awaiting_approval"),
      count: String(d?.pendingValidation ?? 0),
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: <LuClipboardCheck className="h-5 w-5 text-amber-700" />,
    },
    {
      title: t("dashboard.follow_up_required"),
      desc: t("dashboard.customer_contact_needed"),
      count: String(d?.followUpRequired ?? 0),
      bg: "bg-sky-50",
      border: "border-sky-100",
      icon: <LuPhone className="h-5 w-5 text-sky-600" />,
    },
  ];

  return (
    <DashboardCard title={t("dashboard.priority_tasks")}>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.title}
            className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${row.bg} ${row.border}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80">
              {row.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand">{row.title}</p>
              <p className="text-xs text-gray-600">{row.desc}</p>
            </div>
            <span className="text-lg font-bold text-brand">{row.count}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-4 flex w-full items-center justify-start gap-1 text-sm font-semibold text-[#3B82F6] hover:text-[#2563EB]"
      >
        View all tasks <FiChevronRight className="h-4 w-4" />
      </button>
    </DashboardCard>
  );
}
