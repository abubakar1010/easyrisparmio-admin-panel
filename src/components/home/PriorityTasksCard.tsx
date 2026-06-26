import { DashboardCard } from "./DashboardCard";
import { FiChevronRight } from "react-icons/fi";
import { LuFileWarning, LuCalendarClock, LuClipboardCheck, LuPhone } from "react-icons/lu";

const rows = [
  {
    title: "Missing Documents",
    desc: "23 contracts waiting",
    count: "23",
    bg: "bg-red-50",
    border: "border-red-100",
    icon: <LuFileWarning className="h-5 w-5 text-red-600" />,
  },
  {
    title: "Expiring Contracts",
    desc: "Within 30 days",
    count: "12",
    bg: "bg-orange-50",
    border: "border-orange-100",
    icon: <LuCalendarClock className="h-5 w-5 text-orange-600" />,
  },
  {
    title: "Pending Validation",
    desc: "Awaiting approval",
    count: "12",
    bg: "bg-amber-50",
    border: "border-amber-100",
    icon: <LuClipboardCheck className="h-5 w-5 text-amber-700" />,
  },
  {
    title: "Follow-up Required",
    desc: "Customer contact needed",
    count: "12",
    bg: "bg-sky-50",
    border: "border-sky-100",
    icon: <LuPhone className="h-5 w-5 text-sky-600" />,
  },
];

export function PriorityTasksCard() {
  return (
    <DashboardCard title="Priority Tasks">
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
