import { useState } from "react";
import { Button, Tag, Dropdown, type MenuProps, Spin, Empty, Input, Select, message } from "antd";
import { FiPlus, FiMoreVertical, FiArrowRight, FiSearch } from "react-icons/fi";
import { LuZap, LuDroplets, LuWifi, LuFlame, LuActivity } from "react-icons/lu";
import { useNavigate } from "react-router";
import {
  useGetMetersQuery,
  useDeleteMeterMutation,
} from "../../redux/features/Meters/metersApi";
import { sweetAlertConfirmation } from "../../lib/helpers/sweetAlertConfirmation";
import { debounce } from "../../utils/debounce";
import AddMeterModal from "./AddMeterModal";
import type { IMeter, IMeterQuery, UtilityType } from "./types";
import { utilityTypeLabels } from "./types";

const getTypeConfig = (type: string) => {
  switch (type) {
    case "electricity":
      return { color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", icon: <LuZap className="h-5 w-5" /> };
    case "water":
      return { color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", icon: <LuDroplets className="h-5 w-5" /> };
    case "internet":
      return { color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", icon: <LuWifi className="h-5 w-5" /> };
    case "gas":
      return { color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100", icon: <LuFlame className="h-5 w-5" /> };
    default:
      return { color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100", icon: <LuActivity className="h-5 w-5" /> };
  }
};

const MeterReading = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [queryParams, setQueryParams] = useState<IMeterQuery>({ page: 1, limit: 20 });

  const { data, isLoading, isFetching } = useGetMetersQuery(queryParams);
  const [deleteMeter] = useDeleteMeterMutation();

  const meters = data?.data || [];
  const meta = data?.meta;

  const handleSearch = debounce((value: string) => {
    setQueryParams((prev) => ({ ...prev, search: value || undefined, page: 1 }));
  }, 500);

  const handleFilterType = (value: UtilityType | "all") => {
    setQueryParams((prev) => ({
      ...prev,
      utilityType: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const handleDelete = (id: string) => {
    sweetAlertConfirmation({
      func: async () => {
        try {
          await deleteMeter(id).unwrap();
          message.success("Service type deleted successfully");
        } catch {
          message.error("Failed to delete service type");
        }
      },
      title: "Delete Service Type",
      object: "delete this service type",
      okay: "Delete",
    });
  };

  const getMenuItems = (meter: IMeter): MenuProps["items"] => [
    {
      key: "view",
      label: "View Details",
      onClick: () => navigate(`/meter-reading/${meter.id}`),
    },
    { type: "divider" },
    {
      key: "delete",
      label: "Delete",
      danger: true,
      onClick: () => handleDelete(meter.id),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-cborder/45 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-brand tracking-tight">Service Types</h1>
          <p className="text-sm text-slate-500 mt-1">Manage the types of services provided on the platform</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366f1] hover:bg-[#4f46e5] rounded-lg h-10 px-5 font-semibold border-0 shadow-sm"
        >
          Add Service Type
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          prefix={<FiSearch className="text-slate-400" />}
          placeholder="Search by name..."
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          className="w-64 rounded-lg"
        />
        <Select
          placeholder="Utility Type"
          allowClear
          onChange={(val) => handleFilterType(val || "all")}
          className="w-40"
          options={[
            { value: "all", label: "All Types" },
            ...Object.entries(utilityTypeLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        {isFetching && !isLoading && (
          <Spin size="small" />
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      ) : meters.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Empty description="No service types found" />
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {meters.map((meter) => {
              const config = getTypeConfig(meter.utilityType);

              return (
                <div
                  key={meter.id}
                  className="group relative bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300 flex flex-col"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.bg} ${config.color} ${config.border} border shadow-sm`}
                    >
                      {config.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag
                        className={`m-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          meter.isActive
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {meter.isActive ? "Active" : "Inactive"}
                      </Tag>
                      <Dropdown
                        menu={{ items: getMenuItems(meter) }}
                        trigger={["click"]}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          size="small"
                          className="text-slate-400 hover:text-brand"
                          icon={<FiMoreVertical />}
                        />
                      </Dropdown>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-brand">
                      {meter.name}
                    </h2>
                    <div className="mt-1">
                      <p className="font-mono text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block capitalize">
                        {meter.utilityType}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-slate-100 mb-5"></div>

                  {/* Description */}
                  <div className="flex-1">
                    {meter.description ? (
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {meter.description}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        No description
                      </p>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/meter-reading/${meter.id}`)}
                      className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-brand hover:text-indigo-600 transition-colors py-1"
                    >
                      View Details{" "}
                      <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Showing {meters.length} of {meta.total} service types
              </p>
              <div className="flex items-center gap-2">
                <Button
                  disabled={meta.page <= 1}
                  onClick={() =>
                    setQueryParams((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                  }
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600 px-2">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() =>
                    setQueryParams((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <AddMeterModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default MeterReading;
