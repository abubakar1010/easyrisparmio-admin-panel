import { Button } from "antd";
import { FiArrowLeft } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { useNavigate, useParams } from "react-router";

const MeterDetails = () => {
  const navigate = useNavigate();
  const { meterId } = useParams();
  console.log("Viewing details for meter:", meterId);

  // In a real app, you would fetch the meter details based on the meterId
  // For now, we mock the data based on the screenshot provided
  const meter = {
    type: "Electricity",
    ref: "IT001E556779",
    technicalData: {
      power: "3 KW",
      voltage: "230 Volt",
      tariff: "Time on Use",
      useType: "Domestic Residence",
    },
    usage: {
      amount: "2800 KWh",
      cost: "$643/year",
    },
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Back Button */}
      <div>
        <Button type="link" className="mb-2 px-0 text-slate-500 hover:text-slate-800" icon={<FiArrowLeft />} onClick={() => navigate("/meter-reading")}>
          Back to Meter
        </Button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4">
          <HiOutlineDocumentText className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{meter.type}</h1>
        <p className="text-sm font-medium text-slate-400 mt-1">{meter.ref}</p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Technical Data Card */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Technical Data</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Power</p>
              <p className="text-sm font-bold text-slate-800">{meter.technicalData.power}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Voltage</p>
              <p className="text-sm font-bold text-slate-800">{meter.technicalData.voltage}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Tarrif</p>
              <p className="text-sm font-bold text-slate-800">{meter.technicalData.tariff}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Use Type</p>
              <p className="text-sm font-bold text-slate-800">{meter.technicalData.useType}</p>
            </div>
          </div>
        </div>

        {/* 12 Months Usage Card */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">12 Months Usage</h2>
          </div>
          <div className="p-6 flex flex-col justify-center">
            <p className="text-3xl font-bold text-emerald-600 mb-2">{meter.usage.amount}</p>
            <p className="text-sm font-medium text-slate-500">
              Estimated Cost {meter.usage.cost}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MeterDetails;
