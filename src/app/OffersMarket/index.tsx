import { Table, Button, Tag, Space, Input, Select, Card } from "antd";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiLock, FiFilter } from "react-icons/fi";
import { LuTrendingUp, LuTag, LuLeaf } from "react-icons/lu";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { CreateOfferModal } from "./components/CreateOfferModal";

const { Option } = Select;

interface OfferData {
  key: string;
  id: string;
  name: string;
  supplier: string;
  commodity: "ELECTRICITY" | "GAS";
  priceType: "Fixed" | "Variable";
  commission: string;
  validity: string;
  status: "Active" | "Expiring" | "Draft";
}

const data: OfferData[] = [
  {
    key: "1",
    id: "OFF-001",
    name: "Trend Home Electricity",
    supplier: "Enel Energia",
    commodity: "ELECTRICITY",
    priceType: "Variable",
    commission: "€ 40.00",
    validity: "31/12/2024",
    status: "Active",
  },
  {
    key: "2",
    id: "OFF-002",
    name: "Pure Energy Electricity",
    supplier: "A2A Energy",
    commodity: "ELECTRICITY",
    priceType: "Fixed",
    commission: "€ 55.00",
    validity: "15/01/2025",
    status: "Active",
  },
  {
    key: "3",
    id: "OFF-003",
    name: "World Easy Electricity",
    supplier: "Edison",
    commodity: "ELECTRICITY",
    priceType: "Variable",
    commission: "€ 42.00",
    validity: "30/06/2024",
    status: "Expiring",
  },
  {
    key: "4",
    id: "OFF-004",
    name: "Click Gas",
    supplier: "Iren Mercato",
    commodity: "GAS",
    priceType: "Fixed",
    commission: "€ 38.00",
    validity: "31/12/2024",
    status: "Active",
  },
  {
    key: "5",
    id: "OFF-005",
    name: "Next Energy",
    supplier: "Sorgenia",
    commodity: "ELECTRICITY",
    priceType: "Fixed",
    commission: "€ 48.00",
    validity: "01/03/2025",
    status: "Draft",
  },
  {
    key: "6",
    id: "OFF-006",
    name: "Green Future Gas",
    supplier: "E.ON",
    commodity: "GAS",
    priceType: "Variable",
    commission: "€ 50.00",
    validity: "31/12/2024",
    status: "Active",
  },
];

const OffersMarket = () => {
  const [createOfferOpen, setCreateOfferOpen] = useState(false);

  const columns: ColumnsType<OfferData> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      className: "text-slate-500 font-medium",
    },
    {
      title: "NAME",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-bold text-slate-800">{text}</span>,
    },
    {
      title: "SUPPLIER",
      dataIndex: "supplier",
      key: "supplier",
      className: "text-slate-500",
      responsive: ["md"],
    },
    {
      title: "COMMODITY",
      dataIndex: "commodity",
      key: "commodity",
      render: (type) => (
        <Tag className={`border-0 rounded font-bold text-[10px] px-2 py-0 ${type === "ELECTRICITY" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
          }`}>
          {type}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "PRICE TYPE",
      dataIndex: "priceType",
      key: "priceType",
      className: "text-slate-500",
      responsive: ["lg"],
    },
    {
      title: "COMMISSION",
      dataIndex: "commission",
      key: "commission",
      render: (val) => <span className="text-emerald-600 font-bold">{val}</span>,
    },
    {
      title: "VALIDITY",
      dataIndex: "validity",
      key: "validity",
      className: "text-slate-500",
      responsive: ["md"],
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${status === 'Active' ? 'bg-emerald-500' : status === 'Expiring' ? 'bg-amber-500' : 'bg-slate-300'
            }`} />
          <span className="text-sm font-medium text-slate-600">{status}</span>
        </span>
      ),
    },
    {
      title: "ACTIONS",
      key: "action",
      render: () => (
        <Space size="middle">
          <Button type="text" size="small" icon={<FiEdit2 className="text-slate-400" />} />
          <Button type="text" size="small" icon={<FiTrash2 className="text-slate-400" />} />
          <Button type="text" size="small" icon={<FiLock className="text-slate-400" />} />
        </Space>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Offers & Market</h1>
          <p className="text-sm text-slate-500 mt-1">Manage available offers and pricing</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="bg-[#8b85f6] hover:bg-[#7a74e5] rounded-lg h-10 px-6 font-bold border-0 shadow-sm"
          onClick={() => setCreateOfferOpen(true)}
        >
          Create Offer
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Offers", value: "6", icon: <LuTag className="h-6 w-6" />, color: "bg-blue-50 text-blue-500" },
          { title: "Active", value: "3", icon: <LuLeaf className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-500" },
          { title: "Avg Commission", value: "$45", icon: <LuLeaf className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-500" },
          { title: "Suppliers", value: "4", icon: <LuTrendingUp className="h-6 w-6" />, color: "bg-purple-50 text-purple-500" },
        ].map((kpi, idx) => (
          <Card key={idx} className="border-slate-100 shadow-sm rounded-2xl overflow-hidden [&_.ant-card-body]:p-5">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${kpi.color}`}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white p-4">
          <div className="w-full min-w-0 flex-1 sm:min-w-[280px]">
            <Input
              placeholder="Search offers by name or ID..."
              prefix={<FiSearch className="text-slate-400 mr-2" />}
              className="h-11 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-400 shadow-sm"
            />
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-[auto_auto_auto] sm:gap-3">
            <Select defaultValue="Commodity" style={{ height: "44px" }} className="w-full sm:w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200">
              <Option value="Electricity">Electricity</Option>
              <Option value="Gas">Gas</Option>
            </Select>
            <Select defaultValue="Status" style={{ height: "44px" }} className="w-full sm:w-32 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200">
              <Option value="Active">Active</Option>
              <Option value="Expiring">Expiring</Option>
              <Option value="Draft">Draft</Option>
            </Select>
            <Button
              icon={<FiFilter />}
              style={{ height: "44px" }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-slate-200 px-5 font-medium text-slate-500 sm:w-auto"
            >
              More filters
            </Button>
          </div>
        </div>

        {/* Detailed Table */}
        <Table
          columns={columns}
          dataSource={data}
          scroll={{ x: 980 }}
          // pagination={{ 
          //   pageSize: 10,
          //   showSizeChanger: false,
          //   className: "p-6 mt-0 border-t border-slate-100",
          //   itemRender: (_, type, originalElement) => {
          //     if (type === 'prev') return <Button className="rounded-lg h-9">Previous</Button>;
          //     if (type === 'next') return <Button className="rounded-lg h-9">Next</Button>;
          //     return originalElement;
          //   }
          // }}
          className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-thead_th]:py-4 [&_.ant-table-row]:hover:bg-slate-50/30 [&_.ant-table-cell]:py-4"
        />

        {/* Custom Footer Info */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <p className="text-sm text-slate-400 font-medium">Showing 1 to 6 of 6 entries</p>
        </div>
      </div>

      <CreateOfferModal open={createOfferOpen} onClose={() => setCreateOfferOpen(false)} />
    </div>
  );
};

export default OffersMarket;
