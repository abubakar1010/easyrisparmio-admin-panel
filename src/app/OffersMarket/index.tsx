import { Table, Button, Tag, Space, Input, Select, Card, Spin, Empty, Modal, message } from "antd";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiFilter } from "react-icons/fi";
import { LuTrendingUp, LuTag, LuLeaf } from "react-icons/lu";
import type { ColumnsType } from "antd/es/table";
import { useState, useEffect } from "react";
import { CreateOfferModal } from "./components/CreateOfferModal";
import {
  useGetOffersAdminQuery,
  useDeleteOfferMutation,
  useUpdateOfferStatusMutation,
  type IOffer,
} from "../../redux/features/Offers/offerApi";
import { debounce } from "../../utils/debounce";

const { Option } = Select;

const statusDot: Record<string, string> = {
  active: "bg-emerald-500",
  expiring: "bg-amber-500",
  draft: "bg-slate-300",
  expired: "bg-red-400",
  archived: "bg-slate-400",
};

const OffersMarket = () => {
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [energyType, setEnergyType] = useState<string | undefined>();
  const [offerStatus, setOfferStatus] = useState<string | undefined>();

  const { data, isLoading } = useGetOffersAdminQuery({
    page,
    limit: 20,
    search: search || undefined,
    energyType,
    offerStatus,
  });
  const [deleteOffer] = useDeleteOfferMutation();
  const [updateStatus] = useUpdateOfferStatusMutation();

  const offers = data?.data || [];
  const meta = data?.meta;

  const totalOffers = meta?.total || 0;
  const activeCount = offers.filter((o) => o.offerStatus === "active").length;

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const handleDelete = (offer: IOffer) => {
    Modal.confirm({
      title: "Delete offer?",
      content: `"${offer.name}" will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await deleteOffer(offer.id).unwrap();
          message.success("Offer deleted");
        } catch {
          message.error("Failed to delete offer");
        }
      },
    });
  };

  const handleArchive = async (offer: IOffer) => {
    try {
      await updateStatus({ id: offer.id, offerStatus: "archived" }).unwrap();
      message.success("Offer archived");
    } catch {
      message.error("Failed to archive offer");
    }
  };

  const columns: ColumnsType<IOffer> = [
    {
      title: "ID",
      dataIndex: "offerCode",
      key: "offerCode",
      className: "text-slate-500 font-medium",
      render: (v) => v || "—",
    },
    {
      title: "NAME",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-bold text-slate-800">{text}</span>,
    },
    {
      title: "SUPPLIER",
      key: "supplier",
      className: "text-slate-500",
      responsive: ["md"],
      render: (_, record) => record.supplier?.name || "—",
    },
    {
      title: "COMMODITY",
      dataIndex: "energyType",
      key: "energyType",
      render: (type: string) => (
        <Tag
          className={`border-0 rounded font-bold text-[10px] px-2 py-0 uppercase ${
            type === "electricity"
              ? "bg-emerald-50 text-emerald-600"
              : type === "gas"
              ? "bg-blue-50 text-blue-600"
              : "bg-purple-50 text-purple-600"
          }`}
        >
          {type}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "PRICE TYPE",
      dataIndex: "marketType",
      key: "marketType",
      className: "text-slate-500 capitalize",
      responsive: ["lg"],
    },
    {
      title: "COMMISSION",
      dataIndex: "activationCost",
      key: "activationCost",
      render: (val) => (
        <span className="text-emerald-600 font-bold">
          {val != null ? `€ ${Number(val).toFixed(2)}` : "—"}
        </span>
      ),
    },
    {
      title: "VALIDITY",
      dataIndex: "validUntil",
      key: "validUntil",
      className: "text-slate-500",
      responsive: ["md"],
      render: (v) => (v ? new Date(v).toLocaleDateString("it-IT") : "—"),
    },
    {
      title: "STATUS",
      dataIndex: "offerStatus",
      key: "offerStatus",
      render: (status: string) => (
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusDot[status] || "bg-slate-300"}`} />
          <span className="text-sm font-medium text-slate-600 capitalize">{status}</span>
        </span>
      ),
    },
    {
      title: "ACTIONS",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" size="small" icon={<FiEdit2 className="text-slate-400" />} />
          <Button
            type="text"
            size="small"
            icon={<FiTrash2 className="text-slate-400" />}
            onClick={() => handleDelete(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<FiFilter className="text-slate-400" />}
            onClick={() => handleArchive(record)}
          />
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
          { title: "Total Offers", value: String(totalOffers), icon: <LuTag className="h-6 w-6" />, color: "bg-blue-50 text-blue-500" },
          { title: "Active", value: String(activeCount), icon: <LuLeaf className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-500" },
          { title: "Avg Commission", value: "—", icon: <LuLeaf className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-500" },
          { title: "Suppliers", value: String(new Set(offers.map((o) => o.supplierId)).size), icon: <LuTrendingUp className="h-6 w-6" />, color: "bg-purple-50 text-purple-500" },
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white p-4">
          <div className="w-full min-w-0 flex-1 sm:min-w-[280px]">
            <Input
              placeholder="Search offers by name or code..."
              prefix={<FiSearch className="text-slate-400 mr-2" />}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-11 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-400 shadow-sm"
            />
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-[auto_auto] sm:gap-3">
            <Select
              allowClear
              placeholder="Commodity"
              onChange={(v) => { setEnergyType(v); setPage(1); }}
              style={{ height: "44px" }}
              className="w-full sm:w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
            >
              <Option value="electricity">Electricity</Option>
              <Option value="gas">Gas</Option>
              <Option value="dual">Dual</Option>
            </Select>
            <Select
              allowClear
              placeholder="Status"
              onChange={(v) => { setOfferStatus(v); setPage(1); }}
              style={{ height: "44px" }}
              className="w-full sm:w-32 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
            >
              <Option value="active">Active</Option>
              <Option value="expiring">Expiring</Option>
              <Option value="draft">Draft</Option>
              <Option value="expired">Expired</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spin size="large" />
          </div>
        ) : offers.length === 0 ? (
          <div className="py-24">
            <Empty description="No offers found" />
          </div>
        ) : (
          <Table<IOffer>
            rowKey="id"
            columns={columns}
            dataSource={offers}
            scroll={{ x: 980 }}
            pagination={{
              current: page,
              pageSize: meta?.limit || 20,
              total: meta?.total || 0,
              onChange: setPage,
              showSizeChanger: false,
              className: "p-4 mt-0 border-t border-slate-100",
            }}
            className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-thead_th]:py-4 [&_.ant-table-row]:hover:bg-slate-50/30 [&_.ant-table-cell]:py-4"
          />
        )}
      </div>

      <CreateOfferModal open={createOfferOpen} onClose={() => setCreateOfferOpen(false)} />
    </div>
  );
};

export default OffersMarket;
