import { useState } from "react";
import { Button, Tag } from "antd";
import { FiPlus, FiEye } from "react-icons/fi";
import { LuZap, LuGlobe, LuFlame, LuDatabase } from "react-icons/lu";
import AddSupplierModal from "./AddSupplierModal";

const suppliersData = [
  { id: 1, name: "Enel", offers: 12, status: "Good", icon: <LuDatabase className="h-6 w-6" />, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: 2, name: "Eni", offers: 8, status: "Good", icon: <LuFlame className="h-6 w-6" />, color: "text-rose-500", bg: "bg-rose-50" },
  { id: 3, name: "A2A", offers: 6, status: "Warning", icon: <LuZap className="h-6 w-6" />, color: "text-amber-500", bg: "bg-amber-50" },
  { id: 4, name: "Fastweb", offers: 5, status: "Good", icon: <LuGlobe className="h-6 w-6" />, color: "text-blue-500", bg: "bg-blue-50" },
];

const Suppliers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                {supplier.icon}
              </div>
              <Tag className={`m-0 rounded-full px-3 py-0.5 font-bold text-[10px] border-0 ${
                supplier.status === 'Good' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {supplier.status}
              </Tag>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">{supplier.name}</h3>
              <p className="text-sm text-slate-400 font-medium mt-0.5">{supplier.offers} active offers</p>
            </div>

            <Button 
              block
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
