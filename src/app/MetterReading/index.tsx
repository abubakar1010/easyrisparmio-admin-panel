import { useState } from "react";
import { Button, Tag, Dropdown, type MenuProps, Modal, Form, Input } from "antd";
import { FiPlus, FiMoreVertical, FiArrowRight } from "react-icons/fi";
import { LuZap, LuDroplets, LuWifi, LuFlame, LuActivity } from "react-icons/lu";
import { useNavigate } from "react-router";

const meters = [
  { id: 1, type: "Electricity", ref: "IT001E556779", client: "Rasmika", supplier: "Ener Energia", usage: "12,500 KWh", status: "Active", trend: "+2.4%" },
  { id: 2, type: "Water", ref: "WT004A223344", client: "Lakshan", supplier: "AquaFlow Ltd", usage: "25,000 Liters", status: "Active", trend: "-1.2%" },
  { id: 3, type: "Internet", ref: "IT009B778899", client: "Naveen", supplier: "NetConnect", usage: "900 GB", status: "Pending", trend: "0%" },
  { id: 4, type: "Gas", ref: "GS002C556677", client: "Chamali", supplier: "GreenGas Co.", usage: "8,750 Therms", status: "Active", trend: "+5.1%" },
  { id: 5, type: "Electricity", ref: "IT001E556779", client: "Rasmika", supplier: "Ener Energia", usage: "12,500 KWh", status: "Issue", trend: "+12%" },
  { id: 6, type: "Water", ref: "WT004A223344", client: "Lakshan", supplier: "AquaFlow Ltd", usage: "25,000 Liters", status: "Active", trend: "-3.4%" },
  { id: 7, type: "Internet", ref: "IT009B778899", client: "Naveen", supplier: "NetConnect", usage: "900 GB", status: "Active", trend: "+1.1%" },
  { id: 8, type: "Gas", ref: "GS002C556677", client: "Chamali", supplier: "GreenGas Co.", usage: "8,750 Therms", status: "Active", trend: "-0.5%" },
];

const getTypeConfig = (type: string) => {
  switch (type.toLowerCase()) {
    case 'electricity': return { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', icon: <LuZap className="h-5 w-5" /> };
    case 'water': return { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', icon: <LuDroplets className="h-5 w-5" /> };
    case 'internet': return { color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <LuWifi className="h-5 w-5" /> };
    case 'gas': return { color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', icon: <LuFlame className="h-5 w-5" /> };
    default: return { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100', icon: <LuActivity className="h-5 w-5" /> };
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'issue': return 'bg-red-50 text-red-600 border-red-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

const MeterReading = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const menuItems: MenuProps["items"] = [
    { key: "1", label: "Enter Reading" },
    { key: "2", label: "View History" },
    { type: "divider" },
    { key: "3", label: "Edit Meter" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand tracking-tight">Meter Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage all active utility meters and services</p>
        </div>
        <Button 
          type="primary" 
          icon={<FiPlus />} 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand hover:bg-brand/90 rounded-full h-10 px-6 font-medium border-0 shadow-md transition-transform hover:scale-105"
        >
          Add Meter
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {meters.map((meter) => {
          const config = getTypeConfig(meter.type);
          const isTrendUp = meter.trend.startsWith('+');
          const isTrendNeutral = meter.trend === '0%';
          
          return (
            <div key={meter.id} className="group relative bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300 flex flex-col">
              
              {/* Card Header */}
              <div className="flex items-start justify-between mb-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.bg} ${config.color} ${config.border} border shadow-sm`}>
                  {config.icon}
                </div>
                <div className="flex items-center gap-2">
                  <Tag className={`m-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(meter.status)}`}>
                    {meter.status}
                  </Tag>
                  <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                    <Button type="text" size="small" className="text-slate-400 hover:text-brand" icon={<FiMoreVertical />} />
                  </Dropdown>
                </div>
              </div>
              
              {/* Title & Ref */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-brand">{meter.type}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-mono text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{meter.ref}</p>
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-px w-full bg-slate-100 mb-5"></div>
              
              {/* Stats & Details */}
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Client</span>
                  <span className="font-semibold text-brand">{meter.client}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Supplier</span>
                  <span className="font-semibold text-brand text-right max-w-[120px] truncate" title={meter.supplier}>
                    {meter.supplier}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Annual Usage</span>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block">{meter.usage}</span>
                    <span className={`text-[10px] font-bold ${isTrendNeutral ? 'text-slate-400' : isTrendUp ? (meter.type === 'Gas' || meter.type === 'Electricity' ? 'text-rose-500' : 'text-emerald-500') : 'text-emerald-500'}`}>
                      {meter.trend} vs last yr
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => navigate(`/meter-reading/${meter.id}`)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-brand hover:text-indigo-600 transition-colors py-1"
                >
                  View Readings <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Meter Modal */}
      <Modal
        title={<span className="text-xl font-bold text-slate-800">Add Meter</span>}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-6"
      >
        <Form 
          form={form} 
          layout="vertical" 
          className="mt-6" 
          onFinish={(values) => {
            console.log("Submitted values:", values);
            setIsModalOpen(false);
            form.resetFields();
          }}
        >
          <Form.Item label={<span className="text-sm font-medium text-slate-600">Customer Name</span>} name="customerName">
            <Input size="large" placeholder="Search existing customer" className="rounded-lg" />
          </Form.Item>
          <Form.Item label={<span className="text-sm font-medium text-slate-600">Supplier Name</span>} name="supplierName">
            <Input size="large" className="rounded-lg" />
          </Form.Item>
          <Form.Item label={<span className="text-sm font-medium text-slate-600">Meter No.</span>} name="meterNo">
            <Input size="large" className="rounded-lg" />
          </Form.Item>
          <Form.Item label={<span className="text-sm font-medium text-slate-600">Annual Usage</span>} name="annualUsage">
            <Input size="large" className="rounded-lg" />
          </Form.Item>
          
          <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
            <Button 
              size="large" 
              onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
              }} 
              className="rounded-lg px-6 font-medium text-slate-700"
            >
              Cancel
            </Button>
            <Button 
              size="large" 
              type="primary" 
              htmlType="submit" 
              className="bg-[#646cff] hover:bg-[#535bf2] rounded-lg px-8 font-medium border-0 shadow-sm"
            >
              Add Meter
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
};

export default MeterReading;
