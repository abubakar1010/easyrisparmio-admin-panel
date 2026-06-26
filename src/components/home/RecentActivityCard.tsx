import { DashboardCard } from "./DashboardCard";
import { FiChevronRight } from "react-icons/fi";

const items = [
  {
    title: "Contract Activated",
    meta: "ABC Energy · POD 892341",
    time: "2 minutes ago",
    dot: "bg-emerald-500",
  },
  {
    title: "Document Uploaded",
    meta: "Tax certificate · ACME SpA",
    time: "15 minutes ago",
    dot: "bg-[#3B82F6]",
  },
  {
    title: "New Lead Created",
    meta: "GreenWave Utilities",
    time: "1 hour ago",
    dot: "bg-[#8B5CF6]",
  },
  {
    title: "Validation Pending",
    meta: "Review queue · 4 items",
    time: "2 hours ago",
    dot: "bg-orange-500",
  },
];

export function RecentActivityCard() {
  return (
    <DashboardCard title="Recent Activity">
      <ul className="relative space-y-0 pl-2">
        <span className="absolute left-[12px] top-2 bottom-2 w-px bg-gray-200" aria-hidden />
        {items.map((item, i) => (
          <li key={i} className="relative flex gap-3 pb-6 last:pb-0">
            <span
              className={`relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-3 ring-white ${item.dot}`}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand">{item.title}</p>
              <p className="text-xs text-gray-600">{item.meta}</p>
              <p className="mt-1 text-[11px] text-gray-400">{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-2 flex w-full items-center justify-start gap-1 border-t border-gray-100 pt-4 text-sm font-semibold text-[#3B82F6] hover:text-[#2563EB]"
      >
        View full timeline <FiChevronRight className="h-4 w-4" />
      </button>
    </DashboardCard>
  );
}
