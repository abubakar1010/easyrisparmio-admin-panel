import { Tooltip } from "antd";
import { FiCopy, FiEdit2, FiTrash2 } from "react-icons/fi";
import { STRUCTURE_LABELS, STRUCTURE_TAG_CLASS, type CommissionRule } from "../types";

type Props = {
  rule: CommissionRule;
  onEdit: (rule: CommissionRule) => void;
  onDuplicate: (rule: CommissionRule) => void;
  onDelete: (rule: CommissionRule) => void;
};

const Field = ({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) => (
  <div>
    <p className="text-xs text-slate-400">{label}</p>
    <p className={`mt-0.5 text-sm font-semibold text-slate-700 ${valueClass ?? ""}`}>{value}</p>
  </div>
);

export const CommissionRuleCard = ({ rule, onEdit, onDuplicate, onDelete }: Props) => {
  const eur = (n?: number) => (n != null ? `€${n}` : "—");

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-800">{rule.name}</h3>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${STRUCTURE_TAG_CLASS[rule.structureType]}`}>
              {STRUCTURE_LABELS[rule.structureType]}
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
              {rule.status}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            <span className="font-semibold text-slate-600">Supplier:</span> {rule.supplier}
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-semibold text-slate-600">Offer:</span> {rule.offer}
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-semibold text-slate-600">Commodity:</span> {rule.commodity}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-slate-400">
          <Tooltip title="Edit">
            <button type="button" onClick={() => onEdit(rule)} className="rounded-lg p-2 transition-colors hover:bg-slate-50 hover:text-slate-700">
              <FiEdit2 className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip title="Duplicate">
            <button type="button" onClick={() => onDuplicate(rule)} className="rounded-lg p-2 transition-colors hover:bg-slate-50 hover:text-slate-700">
              <FiCopy className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip title="Delete">
            <button type="button" onClick={() => onDelete(rule)} className="rounded-lg p-2 transition-colors hover:bg-rose-50 hover:text-rose-500">
              <FiTrash2 className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="my-4 h-px w-full bg-slate-100" />

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        <Field label="Contract Type" value={rule.contractType} />
        <Field label="Duration" value={`${rule.duration} months`} />

        {rule.structureType === "tiered" ? (
          <Field label="Bonus" value={eur(rule.bonusAmount)} valueClass="text-amber-500!" />
        ) : (
          <Field label="Initial Fee" value={eur(rule.initialFee)} valueClass="text-emerald-600!" />
        )}

        {rule.structureType === "tiered" ? (
          <Field
            label="Reversals"
            value={rule.allowReversals ? `${rule.clawbackDays} days` : "Not allowed"}
          />
        ) : rule.recurringFee != null ? (
          <Field
            label="Recurring Fee"
            value={`€${rule.recurringFee} / ${rule.frequency ?? "Monthly"}`}
            valueClass="text-[#8b85f6]!"
          />
        ) : (
          <Field
            label="Reversals"
            value={rule.allowReversals ? `${rule.clawbackDays} days` : "Not allowed"}
          />
        )}

        {/* Second row for hybrid (reversals) */}
        {rule.structureType !== "tiered" && rule.recurringFee != null && (
          <Field
            label="Reversals"
            value={rule.allowReversals ? `${rule.clawbackDays} days` : "Not allowed"}
          />
        )}

        {/* Tiered extras */}
        {rule.structureType === "tiered" && (
          <>
            <Field
              label="Tiered Structure"
              value={`${rule.tiers?.length ?? 0} tiers based on consumption`}
              valueClass="sm:col-span-2"
            />
            {rule.bonusCondition && <Field label="Bonus Condition" value={rule.bonusCondition} />}
          </>
        )}
      </div>
    </div>
  );
};
