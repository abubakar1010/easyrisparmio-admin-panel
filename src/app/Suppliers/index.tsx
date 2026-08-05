import { useState } from "react";
import { Button, Spin, Empty, Tag } from "antd";
import { FiPlus, FiEye } from "react-icons/fi";
import { LuZap, LuGlobe, LuFlame, LuDatabase } from "react-icons/lu";
import { useNavigate } from "react-router";
import AddSupplierModal from "./AddSupplierModal";
import { useGetSuppliersQuery, type ISupplier } from "../../redux/features/Suppliers/supplierApi";
import { statusDisplayMap, statusTagClass, commodityIconMap, commodityColorMap } from "./types";
import { server_origin } from "../../config";

const iconMap: Record<string, React.ReactNode> = {
  database: <LuDatabase className="h-6 w-6" />,
  flame: <LuFlame className="h-6 w-6" />,
  zap: <LuZap className="h-6 w-6" />,
  globe: <LuGlobe className="h-6 w-6" />,
};

function getSupplierVisuals(supplier: ISupplier) {
  const commodity = supplier.commodity || "dual";
  const iconKey = commodityIconMap[commodity] || "globe";
  const colors = commodityColorMap[commodity] || { color: "text-blue-500", bg: "bg-blue-50" };
  const displayStatus = statusDisplayMap[supplier.status] || "Good";
  return { iconKey, ...colors, displayStatus };
}

const Suppliers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { data, isLoading } = useGetSuppliersQuery({ limit: 100 });

  const suppliers = data?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">Supplier and dynamic content management</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          onClick={() => setIsModalOpen(true)}
          className="bg-[#8b85f6] hover:bg-[#7a74e5] rounded-lg h-10 px-6 font-bold border-0 shadow-sm transition-transform hover:scale-105"
        >
          Add Supplier
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spin size="large" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <Empty description="No suppliers found">
            <Button type="primary" icon={<FiPlus />} onClick={() => setIsModalOpen(true)} className="rounded-lg bg-[#8b85f6] font-semibold hover:bg-[#7a74e5]">
              Add Supplier
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {suppliers.map((supplier) => {
            const { iconKey, color, bg, displayStatus } = getSupplierVisuals(supplier);
            const activeOffers = supplier.offers?.filter((o) => o.isActive)?.length || 0;
            const isPendingDeletion = supplier.status === "pending_deletion";
            return (
              <div key={supplier.id} className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-300 ${isPendingDeletion ? "border-red-300 bg-red-50/30" : "border-slate-200/60"}`}>
                <div className="flex items-start justify-between mb-4">
                  {supplier.logoUrl ? (
                    <img
                      src={supplier.logoUrl.startsWith("http") ? supplier.logoUrl : `${server_origin}${supplier.logoUrl}`}
                      alt={supplier.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                    />
                  ) : null}
                  <div className={`h-12 w-12 rounded-xl ${bg} ${color} flex items-center justify-center border border-current/10 ${supplier.logoUrl ? "hidden" : ""}`}>
                    {iconMap[iconKey]}
                  </div>
                  <Tag className={`m-0 rounded-full px-3 py-0.5 font-bold text-[10px] border-0 ${statusTagClass[displayStatus] || "bg-slate-100 text-slate-500"}`}>
                    {displayStatus}
                  </Tag>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-800">{supplier.name}</h3>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">{activeOffers} active offers</p>
                  {isPendingDeletion && supplier.scheduledDeletionDate && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      Deletion scheduled: {new Date(supplier.scheduledDeletionDate).toLocaleDateString("it-IT")}
                    </p>
                  )}
                </div>

                <Button
                  block
                  onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 border-0 rounded-xl h-10 font-bold flex items-center justify-center gap-2"
                  icon={<FiEye className="h-4 w-4" />}
                >
                  Manage
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <AddSupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Suppliers;
