import { Button } from "antd";
import { FiArrowLeft } from "react-icons/fi";

export const CommissionHeader = () => {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-brand">Commission</h2>
        <p className="text-sm text-owngray">
          Provisioning Suite &gt; Suppliers &gt; <span className="text-blue-500">Enel Energia S.p.A.</span>
        </p>
      </div>
      <Button className="h-10 rounded-lg border-slate-200 px-4 font-medium text-slate-600" icon={<FiArrowLeft />}>
        Torna alla lista fornitori
      </Button>
    </div>
  );
};
