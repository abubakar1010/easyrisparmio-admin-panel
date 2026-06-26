import { Card } from "antd";
import { FiAlertCircle, FiBookOpen } from "react-icons/fi";

export const CommissionInfoPanels = () => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card
        className="rounded-2xl border-slate-200/70 shadow-sm"
        title={
          <span className="inline-flex items-center gap-2 text-violet-600">
            <FiAlertCircle className="h-4 w-4" />
            IMPORTANT INFORMATION
          </span>
        }
      >
        <ul className="space-y-2 text-sm text-slate-600">
          <li>Provisions are calculated net of VAT and local taxes as per D.Lgs 2024.</li>
          <li>First 12 months recurrence is paid starting from the first effective supply month.</li>
          <li>One-time acquisition fee is paid 30 days after the switch-in completion.</li>
          <li>Claw-back policies apply if supply is terminated within the first 6 months.</li>
        </ul>
      </Card>

      <Card
        className="rounded-2xl border-slate-200/70 shadow-sm"
        title={
          <span className="inline-flex items-center gap-2 text-violet-600">
            <FiBookOpen className="h-4 w-4" />
            FIELD LEGEND
          </span>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p><strong>EUR/POD</strong><br />Fix payment for each Point of Delivery successfully activated.</p>
          <p><strong>Opz. Prime</strong><br />Additional provision for "Premium" service upsell.</p>
          <p><strong>Energia Verde</strong><br />Incentive for 100% Renewable Energy source selection.</p>
        </div>
      </Card>
    </div>
  );
};
