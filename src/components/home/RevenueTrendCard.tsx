import { DashboardCard } from "./DashboardCard";

const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Simple area-style chart placeholder */
function RevenueChart() {
  return (
    <div className="flex w-full flex-col rounded-lg bg-gradient-to-b from-sky-50/80 to-white pt-3">
      <svg viewBox="0 0 400 110" className="h-32 w-full shrink-0" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          fill="url(#revFill)"
          d="M 0 82 Q 50 77 80 62 T 160 47 T 240 37 T 320 27 T 400 17 L 400 110 L 0 110 Z"
        />
        <path
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2.5"
          strokeLinecap="round"
          d="M 0 82 Q 50 77 80 62 T 160 47 T 240 37 T 320 27 T 400 17"
        />
      </svg>
      <div className="flex justify-between px-0.5 pb-1 text-[10px] font-medium text-gray-400 sm:text-xs">
        {months.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

export function RevenueTrendCard() {
  return (
    <DashboardCard title="Revenue Trend">
      <RevenueChart />
      <div className="-mx-4 -mb-4 mt-4 flex justify-between rounded-b-xl border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:-mx-5 sm:-mb-5 sm:px-8 sm:py-5">
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xs text-slate-500 sm:text-sm">Potential</span>
          <span className="text-sm font-bold text-slate-900 sm:text-base">€ 142,320</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xs text-slate-500 sm:text-sm">Validated</span>
          <span className="text-sm font-bold text-blue-600 sm:text-base">€ 98,750</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xs text-slate-500 sm:text-sm">Collected</span>
          <span className="text-sm font-bold text-emerald-600 sm:text-base">€ 76,130</span>
        </div>
      </div>
    </DashboardCard>
  );
}
