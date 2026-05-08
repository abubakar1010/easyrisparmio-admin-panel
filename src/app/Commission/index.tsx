import { CommissionControls } from "./components/CommissionControls";
import { CommissionHeader } from "./components/CommissionHeader";
import { CommissionInfoPanels } from "./components/CommissionInfoPanels";
import { CommissionMetaCards } from "./components/CommissionMetaCards";
import { ProvisionStructureTable } from "./components/ProvisionStructureTable";
import { VersionHistoryTable } from "./components/VersionHistoryTable";

const Commission = () => {
  return (
    <div className="space-y-4 pb-8">
      <CommissionHeader />
      <CommissionMetaCards />
      <CommissionControls />
      <ProvisionStructureTable />
      <VersionHistoryTable />
      <CommissionInfoPanels />
    </div>
  );
};

export default Commission;
