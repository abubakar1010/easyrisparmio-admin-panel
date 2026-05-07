import { DashboardCard } from "./DashboardCard";
import { LuCopy, LuCalendar, LuShieldCheck, LuSparkles } from "react-icons/lu";

const alerts = [
  {
    title: "Duplicate POD/PDR Detected",
    desc: "Multiple submissions share identifiers — review before activation to avoid billing conflicts.",
    action: "Review",
    actionClass: "text-red-600 hover:text-red-700",
    wrap: "border-red-100 bg-red-50",
    icon: <LuCopy className="h-5 w-5 text-red-600" />,
  },
  {
    title: "Contract Expiring Soon",
    desc: "Several contracts approach renewal within the next window — prioritize outreach.",
    action: "View List",
    actionClass: "text-orange-600 hover:text-orange-700",
    wrap: "border-orange-100 bg-orange-50",
    icon: <LuCalendar className="h-5 w-5 text-orange-600" />,
  },
  {
    title: "DCR Verification Required",
    desc: "Queued documents need manual verification to unblock downstream processing.",
    action: "Verify",
    actionClass: "text-amber-700 hover:text-amber-800",
    wrap: "border-amber-100 bg-amber-50",
    icon: <LuShieldCheck className="h-5 w-5 text-amber-700" />,
  },
  {
    title: "High Value Lead Identified",
    desc: "A new lead crossed your threshold — assign ownership and follow up today.",
    action: "Contact",
    actionClass: "text-[#3B82F6] hover:text-[#2563EB]",
    wrap: "border-sky-100 bg-sky-50",
    icon: <LuSparkles className="h-5 w-5 text-[#3B82F6]" />,
  },
];

export function ActiveAlertsCard() {
  return (
    <DashboardCard title="Active Alerts">
      <div className="space-y-3">
        {alerts.map((a) => (
          <div
            key={a.title}
            className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between ${a.wrap}`}
          >
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
                {a.icon}
              </span>
              <div>
                <p className="font-semibold text-brand">{a.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{a.desc}</p>
              </div>
            </div>
            <button type="button" className={`shrink-0 text-sm font-semibold sm:pt-1 ${a.actionClass}`}>
              {a.action}
            </button>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
