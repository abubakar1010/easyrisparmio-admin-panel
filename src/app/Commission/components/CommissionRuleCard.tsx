import { Tag, Tooltip } from "antd";
import { FiEdit2, FiPower } from "react-icons/fi";
import type { ICommissionRule } from "../../../redux/features/Commissions/commissionApi";

type Props = {
  rule: ICommissionRule;
  onEdit: (rule: ICommissionRule) => void;
  onToggleActive: (rule: ICommissionRule) => void;
};

const Field = ({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) => (
  <div>
    <p className="text-xs text-slate-400">{label}</p>
    <p className={`mt-0.5 text-sm font-semibold text-slate-700 ${valueClass ?? ""}`}>{value}</p>
  </div>
);

export const CommissionRuleCard = ({ rule, onEdit, onToggleActive }: Props) => {
  const eur = (n?: number | null) => (n != null ? `EUR ${n.toFixed(2)}` : "—");

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-800">
              {rule.supplier?.name || "Unknown Supplier"} - {rule.energyType}
            </h3>
            <Tag
              className={`border-0 rounded font-bold text-[10px] px-2 py-0 uppercase ${
                rule.energyType === "electricity"
                  ? "bg-blue-50 text-blue-600"
                  : rule.energyType === "gas"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-purple-50 text-purple-600"
              }`}
            >
              {rule.energyType}
            </Tag>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                rule.isActive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {rule.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            <span className="font-semibold text-slate-600">Target:</span> {rule.target || "—"}
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-slate-600">Valid From:</span>{" "}
            {rule.validFrom ? new Date(rule.validFrom).toLocaleDateString("it-IT") : "—"}
            {rule.validUntil && (
              <>
                <span className="mx-1 text-slate-300">-</span>
                {new Date(rule.validUntil).toLocaleDateString("it-IT")}
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-slate-400">
          <Tooltip title="Edit">
            <button type="button" onClick={() => onEdit(rule)} className="rounded-lg p-2 transition-colors hover:bg-slate-50 hover:text-slate-700">
              <FiEdit2 className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip title={rule.isActive ? "Deactivate" : "Activate"}>
            <button
              type="button"
              onClick={() => onToggleActive(rule)}
              className={`rounded-lg p-2 transition-colors ${
                rule.isActive
                  ? "hover:bg-rose-50 hover:text-rose-500"
                  : "hover:bg-emerald-50 hover:text-emerald-500"
              }`}
            >
              <FiPower className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="my-4 h-px w-full bg-slate-100" />

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        <Field label="Commission Amount" value={eur(rule.commissionAmount)} valueClass="text-emerald-600!" />
        <Field
          label="Commission %"
          value={rule.commissionPercentage != null ? `${rule.commissionPercentage}%` : "—"}
          valueClass="text-[#8b85f6]!"
        />
        <Field
          label="Offer"
          value={rule.offerId ? (rule.offerId) : "All offers"}
        />
        <Field
          label="Created"
          value={rule.createdAt ? new Date(rule.createdAt).toLocaleDateString("it-IT") : "—"}
        />
      </div>
    </div>
  );
};
