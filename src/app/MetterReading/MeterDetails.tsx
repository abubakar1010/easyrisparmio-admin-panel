import { Button, Spin, Tag, message } from "antd";
import { FiArrowLeft } from "react-icons/fi";
import { LuZap, LuDroplets, LuWifi, LuFlame, LuActivity } from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import { useGetMeterByIdQuery } from "../../redux/features/Meters/metersApi";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "electricity":
      return <LuZap className="h-6 w-6" />;
    case "gas":
      return <LuFlame className="h-6 w-6" />;
    case "water":
      return <LuDroplets className="h-6 w-6" />;
    case "internet":
      return <LuWifi className="h-6 w-6" />;
    default:
      return <LuActivity className="h-6 w-6" />;
  }
};

const getTypeColors = (type: string) => {
  switch (type) {
    case "electricity":
      return "bg-amber-50 text-amber-600";
    case "gas":
      return "bg-rose-50 text-rose-600";
    case "water":
      return "bg-blue-50 text-blue-600";
    case "internet":
      return "bg-indigo-50 text-indigo-600";
    default:
      return "bg-slate-50 text-slate-600";
  }
};

const MeterDetails = () => {
  const navigate = useNavigate();
  const { meterId } = useParams();

  const { data: meter, isLoading, error } = useGetMeterByIdQuery(meterId!, {
    skip: !meterId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !meter) {
    message.error("Failed to load service type details");
    return (
      <div className="space-y-6 pb-12">
        <Button
          type="link"
          className="px-0 text-slate-500 hover:text-slate-800"
          icon={<FiArrowLeft />}
          onClick={() => navigate("/meter-reading")}
        >
          Back to Service Types
        </Button>
        <div className="text-center py-20 text-slate-500">
          Service type not found or failed to load.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Back Button */}
      <div>
        <Button
          type="link"
          className="mb-2 px-0 text-slate-500 hover:text-slate-800"
          icon={<FiArrowLeft />}
          onClick={() => navigate("/meter-reading")}
        >
          Back to Service Types
        </Button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${getTypeColors(meter.utilityType)} mb-4`}>
              {getTypeIcon(meter.utilityType)}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {meter.name}
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1 capitalize">
              {meter.utilityType}
            </p>
          </div>
          <Tag
            className={`m-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
              meter.isActive
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
          >
            {meter.isActive ? "Active" : "Inactive"}
          </Tag>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Details</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Description</p>
            <p className="text-sm font-medium text-slate-700">
              {meter.description || "No description provided"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Created</p>
              <p className="text-sm font-medium text-slate-700">
                {new Date(meter.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Last Updated</p>
              <p className="text-sm font-medium text-slate-700">
                {new Date(meter.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeterDetails;
