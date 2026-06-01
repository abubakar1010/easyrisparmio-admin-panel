import { useState } from "react";
import { Button, Tag } from "antd";
import { FiPlus, FiEye } from "react-icons/fi";
import { LuZap, LuGlobe, LuFlame, LuDatabase } from "react-icons/lu";
import { useNavigate } from "react-router";
import AddSupplierModal from "./AddSupplierModal";
import { suppliersData, type IconKey } from "./types";

const iconMap: Record<IconKey, React.ReactNode> = {
  database: <LuDatabase className="h-6 w-6" />,
  flame: <LuFlame className="h-6 w-6" />,
  zap: <LuZap className="h-6 w-6" />,
  globe: <LuGlobe className="h-6 w-6" />,
};

const Suppliers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {suppliersData.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className={`h-12 w-12 rounded-xl ${supplier.bg} ${supplier.color} flex items-center justify-center border border-current/10`}>
                {iconMap[supplier.iconKey]}
              </div>
              <Tag className={`m-0 rounded-full px-3 py-0.5 font-bold text-[10px] border-0 ${
                supplier.status === 'Good' ? 'bg-emerald-100 text-emerald-600' : supplier.status === 'Warning' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {supplier.status}
              </Tag>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">{supplier.brandName}</h3>
              <p className="text-sm text-slate-400 font-medium mt-0.5">{supplier.offers.length} active offers</p>
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
        ))}
      </div>

      <AddSupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Suppliers;
