import { Button, Select } from "antd";
import { FiPlus, FiTrash2 } from "react-icons/fi";

export const CommissionControls = () => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          defaultValue="Business Acegio Variabile"
          className="min-w-[220px] [&_.ant-select-selector]:rounded-lg"
          options={[{ value: "Business Acegio Variabile", label: "Business Acegio Variabile" }]}
        />
        <span className="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-600">TARGET: B2B</span>
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">STATUS: ACTIVE</span>
      </div>

      <div className="flex items-center gap-2">
        <Button icon={<FiPlus />} className="rounded-lg border-violet-200 text-violet-600">
          Aggiungi prodotto
        </Button>
        <Button icon={<FiTrash2 />} className="rounded-lg border-rose-200 text-rose-500">
          Elimina prodotto
        </Button>
      </div>
    </div>
  );
};
