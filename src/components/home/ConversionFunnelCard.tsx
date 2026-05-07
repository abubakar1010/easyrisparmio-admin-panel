import { DashboardCard } from "./DashboardCard";

const stages = [
  { label: "Request Received", value: 342, barClass: "bg-[#3B82F6]" },
  { label: "Documentation", value: 298, barClass: "bg-[#3B82F6]" },
  { label: "Validation", value: 267, barClass: "bg-[#3B82F6]" },
  { label: "Activation", value: 234, barClass: "bg-[#22C55E]" },
  { label: "Rejected (KD)", value: 44, barClass: "bg-red-500" },
];

const max = Math.max(...stages.map((s) => s.value));

export function ConversionFunnelCard() {
  return (
    <DashboardCard title="Conversion Funnel">
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
        Conversion Rate: <span className="font-semibold text-brand">68.4%</span>
      </p>
    </DashboardCard>
  );
}
