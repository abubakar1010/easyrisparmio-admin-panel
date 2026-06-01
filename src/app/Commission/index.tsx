import { useState } from "react";
import { FiSettings } from "react-icons/fi";
import { CommissionControls } from "./components/CommissionControls";
import { CommissionInfoPanels } from "./components/CommissionInfoPanels";
import { CommissionMetaCards } from "./components/CommissionMetaCards";
import { CommissionRulesConfig } from "./components/CommissionRulesConfig";
import { ProvisionStructureTable } from "./components/ProvisionStructureTable";
import { VersionHistoryTable } from "./components/VersionHistoryTable";

type TabKey = "overview" | "configuration";

const Commission = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("configuration");

  const tabs: { key: TabKey; label: string; icon?: React.ReactNode }[] = [
    { key: "overview", label: "Overview" },
    { key: "configuration", label: "Configuration", icon: <FiSettings className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Page header */}
      <div className="border-b border-cborder/45 pb-4">
        <p className="text-sm font-medium text-slate-500">Welcome to admin portal</p>
        <p className="text-xs text-slate-400">Here's what's happening today</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-800">Commission</h2>
        <p className="text-sm text-slate-500">Manage all commissions and case outcomes</p>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative inline-flex items-center gap-1.5 pb-3 text-sm font-medium transition-colors ${
                  active ? "text-[#8b85f6]" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.icon}
                {tab.label}
                {active && <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-[#8b85f6]" />}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "configuration" ? (
        <CommissionRulesConfig />
      ) : (
        <div className="space-y-4">
          <CommissionMetaCards />
          <CommissionControls />
          <ProvisionStructureTable />
          <VersionHistoryTable />
          <CommissionInfoPanels />
        </div>
      )}
    </div>
  );
};

export default Commission;
