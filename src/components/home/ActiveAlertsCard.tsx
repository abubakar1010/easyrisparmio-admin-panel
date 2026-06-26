import { DashboardCard } from "./DashboardCard";
import { LuCopy, LuCalendar, LuShieldCheck, LuSparkles, LuTriangleAlert, LuFileWarning } from "react-icons/lu";
import type { AdminDashboardData } from "../../redux/features/Dashboard/dashboardApi";

type Alert = AdminDashboardData["activeAlerts"][number];
type Props = { data?: AdminDashboardData["activeAlerts"] };

const alertConfig: Record<string, {
  icon: React.ReactNode;
  action: string;
  actionClass: string;
  wrap: string;
}> = {
  duplicate_pod: {
    icon: <LuCopy className="h-5 w-5 text-red-600" />,
    action: "Review",
    actionClass: "text-red-600 hover:text-red-700",
    wrap: "border-red-100 bg-red-50",
  },
  contract_expiring: {
    icon: <LuCalendar className="h-5 w-5 text-orange-600" />,
    action: "View List",
    actionClass: "text-orange-600 hover:text-orange-700",
    wrap: "border-orange-100 bg-orange-50",
  },
  ocr_verification: {
    icon: <LuShieldCheck className="h-5 w-5 text-amber-700" />,
    action: "Verify",
    actionClass: "text-amber-700 hover:text-amber-800",
    wrap: "border-amber-100 bg-amber-50",
  },
  high_value_lead: {
    icon: <LuSparkles className="h-5 w-5 text-[#3B82F6]" />,
    action: "Contact",
    actionClass: "text-[#3B82F6] hover:text-[#2563EB]",
    wrap: "border-sky-100 bg-sky-50",
  },
  sla_breach: {
    icon: <LuTriangleAlert className="h-5 w-5 text-red-600" />,
    action: "Review",
    actionClass: "text-red-600 hover:text-red-700",
    wrap: "border-red-100 bg-red-50",
  },
  missing_documents: {
    icon: <LuFileWarning className="h-5 w-5 text-orange-600" />,
    action: "Review",
    actionClass: "text-orange-600 hover:text-orange-700",
    wrap: "border-orange-100 bg-orange-50",
  },
};

const defaultConfig = {
  icon: <LuTriangleAlert className="h-5 w-5 text-gray-600" />,
  action: "View",
  actionClass: "text-gray-600 hover:text-gray-700",
  wrap: "border-gray-100 bg-gray-50",
};

export function ActiveAlertsCard({ data }: Props) {
  const alerts = data ?? [];

  if (alerts.length === 0) {
    return (
      <DashboardCard title="Active Alerts">
        <p className="py-8 text-center text-sm text-gray-400">No active alerts</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Active Alerts">
      <div className="space-y-3">
        {alerts.map((a: Alert) => {
          const cfg = alertConfig[a.alertType] ?? defaultConfig;
          return (
            <div
              key={a.id}
              className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between ${cfg.wrap}`}
            >
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
                  {cfg.icon}
                </span>
                <div>
                  <p className="font-semibold text-brand">{a.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    {a.description ?? "No description"}
                  </p>
                </div>
              </div>
              <button type="button" className={`shrink-0 text-sm font-semibold sm:pt-1 ${cfg.actionClass}`}>
                {cfg.action}
              </button>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
