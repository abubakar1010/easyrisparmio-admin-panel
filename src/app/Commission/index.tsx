import { useState } from "react";
import { Button, Card, Empty, Input, Select, Space, Spin, Table, Tag, message, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiCheckCircle, FiDollarSign, FiSearch, FiSettings } from "react-icons/fi";
import { LuClock3, LuShieldCheck, LuWallet } from "react-icons/lu";
import { CommissionInfoPanels } from "./components/CommissionInfoPanels";
import { CommissionRulesConfig } from "./components/CommissionRulesConfig";
import {
  useGetCommissionsQuery,
  useGetCommissionStatsQuery,
  useApproveCommissionMutation,
  useMarkCommissionPaidMutation,
  type ICommission,
} from "../../redux/features/Commissions/commissionApi";
import { debounce } from "../../utils/debounce";

const { Option } = Select;

type TabKey = "overview" | "configuration";

const statusColor: Record<string, string> = {
  pending: "gold",
  approved: "blue",
  paid: "green",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
};

const typeTagClass: Record<string, string> = {
  activation: "bg-blue-50 text-blue-600",
  renewal: "bg-emerald-50 text-emerald-600",
};

const Commission = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const { data: commissionsData, isLoading: commissionsLoading } = useGetCommissionsQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter,
    commissionType: typeFilter,
  });
  const { data: stats, isLoading: statsLoading } = useGetCommissionStatsQuery();
  const [approveCommission] = useApproveCommissionMutation();
  const [markPaid] = useMarkCommissionPaidMutation();

  const commissions = commissionsData?.data || [];
  const meta = commissionsData?.meta;

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const handleApprove = (record: ICommission) => {
    Modal.confirm({
      title: "Approve commission?",
      content: `Approve commission of ${formatCurrency(record.amount, record.currency)} for ${record.agent ? `${record.agent.firstName} ${record.agent.lastName}` : "this agent"}?`,
      okText: "Approve",
      centered: true,
      onOk: async () => {
        try {
          await approveCommission(record.id).unwrap();
          message.success("Commission approved successfully");
        } catch {
          message.error("Failed to approve commission");
        }
      },
    });
  };

  const handleMarkPaid = (record: ICommission) => {
    Modal.confirm({
      title: "Mark as paid?",
      content: `Mark commission of ${formatCurrency(record.amount, record.currency)} as paid?`,
      okText: "Mark Paid",
      centered: true,
      onOk: async () => {
        try {
          await markPaid(record.id).unwrap();
          message.success("Commission marked as paid");
        } catch {
          message.error("Failed to mark commission as paid");
        }
      },
    });
  };

  const tabs: { key: TabKey; label: string; icon?: React.ReactNode }[] = [
    { key: "overview", label: "Overview" },
    { key: "configuration", label: "Configuration", icon: <FiSettings className="h-4 w-4" /> },
  ];

  const columns: ColumnsType<ICommission> = [
    {
      title: "AGENT",
      key: "agent",
      width: 180,
      render: (_, record) => {
        const name = record.agent
          ? `${record.agent.firstName} ${record.agent.lastName}`
          : "—";
        return <span className="font-medium text-slate-700">{name}</span>;
      },
    },
    {
      title: "CASE",
      key: "case",
      width: 140,
      responsive: ["md"],
      render: (_, record) => (
        <span className="font-semibold text-brand">{record.case?.caseNumber || "—"}</span>
      ),
    },
    {
      title: "OFFER",
      key: "offer",
      width: 160,
      responsive: ["lg"],
      render: (_, record) => record.offer?.name || "—",
    },
    {
      title: "SUPPLIER",
      key: "supplier",
      width: 140,
      responsive: ["lg"],
      render: (_, record) => record.supplier?.name || "—",
    },
    {
      title: "TYPE",
      dataIndex: "commissionType",
      key: "commissionType",
      width: 120,
      render: (type: string) => (
        <Tag
          className={`border-0 rounded font-bold text-[10px] px-2 py-0 uppercase ${
            typeTagClass[type] || "bg-slate-50 text-slate-600"
          }`}
        >
          {type}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "AMOUNT",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount: number, record) => (
        <span className="text-emerald-600 font-bold">
          {formatCurrency(amount, record.currency)}
        </span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag
          color={statusColor[status] || "default"}
          className="rounded-full! px-2.5! text-xs font-semibold"
        >
          {statusLabel[status] || status}
        </Tag>
      ),
    },
    {
      title: "DATE",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      responsive: ["md"],
      render: (v: string) => (v ? new Date(v).toLocaleDateString("it-IT") : "—"),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 140,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          {record.status === "pending" && (
            <Button
              type="link"
              size="small"
              icon={<FiCheckCircle />}
              onClick={() => handleApprove(record)}
              className="text-blue-500 font-medium"
            >
              Approve
            </Button>
          )}
          {record.status === "approved" && (
            <Button
              type="link"
              size="small"
              icon={<FiDollarSign />}
              onClick={() => handleMarkPaid(record)}
              className="text-emerald-500 font-medium"
            >
              Pay
            </Button>
          )}
          {record.status === "paid" && (
            <span className="text-xs text-slate-400">Completed</span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Page header */}
      <div className="border-b border-cborder/45 pb-4">
        <p className="text-sm font-medium text-slate-500">Welcome to admin portal</p>
        <p className="text-xs text-slate-400">Here's what's happening today</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-800">Commission</h2>
        <p className="text-sm text-slate-500">Manage all commissions and case outcomes</p>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative inline-flex items-center gap-1.5 pb-3 text-sm font-medium transition-colors ${
                  active ? "text-[#8b85f6]" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.icon}
                {tab.label}
                {active && <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-[#8b85f6]" />}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "configuration" ? (
        <CommissionRulesConfig />
      ) : (
        <div className="space-y-4">
          {/* KPI Meta Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsLoading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <Spin size="default" />
              </div>
            ) : (
              [
                {
                  title: "Total Pending",
                  value: formatCurrency(stats?.totalPending ?? 0),
                  count: stats?.pendingCount ?? 0,
                  icon: <LuClock3 className="h-6 w-6" />,
                  color: "bg-amber-50 text-amber-500",
                },
                {
                  title: "Total Approved",
                  value: formatCurrency(stats?.totalApproved ?? 0),
                  count: stats?.approvedCount ?? 0,
                  icon: <LuShieldCheck className="h-6 w-6" />,
                  color: "bg-blue-50 text-blue-500",
                },
                {
                  title: "Total Paid",
                  value: formatCurrency(stats?.totalPaid ?? 0),
                  count: stats?.paidCount ?? 0,
                  icon: <LuWallet className="h-6 w-6" />,
                  color: "bg-emerald-50 text-emerald-500",
                },
              ].map((kpi, idx) => (
                <Card
                  key={idx}
                  className="border-slate-100 shadow-sm rounded-2xl overflow-hidden [&_.ant-card-body]:p-5"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center ${kpi.color}`}
                    >
                      {kpi.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {kpi.title}
                      </p>
                      <p className="text-2xl font-bold text-slate-800 mt-0.5">{kpi.value}</p>
                      <p className="text-xs text-slate-400">{kpi.count} commissions</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Commissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white p-4">
              <div className="w-full min-w-0 flex-1 sm:min-w-[280px]">
                <Input
                  placeholder="Search commissions..."
                  prefix={<FiSearch className="text-slate-400 mr-2" />}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-400 shadow-sm"
                />
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-[auto_auto] sm:gap-3">
                <Select
                  allowClear
                  placeholder="Status"
                  onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                  style={{ height: "44px" }}
                  className="w-full sm:w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
                >
                  <Option value="pending">Pending</Option>
                  <Option value="approved">Approved</Option>
                  <Option value="paid">Paid</Option>
                </Select>
                <Select
                  allowClear
                  placeholder="Type"
                  onChange={(v) => {
                    setTypeFilter(v);
                    setPage(1);
                  }}
                  style={{ height: "44px" }}
                  className="w-full sm:w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
                >
                  <Option value="activation">Activation</Option>
                  <Option value="renewal">Renewal</Option>
                </Select>
              </div>
            </div>

            {commissionsLoading ? (
              <div className="flex items-center justify-center py-24">
                <Spin size="large" />
              </div>
            ) : commissions.length === 0 ? (
              <div className="py-24">
                <Empty description="No commissions found" />
              </div>
            ) : (
              <Table<ICommission>
                rowKey="id"
                columns={columns}
                dataSource={commissions}
                scroll={{ x: 1100 }}
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

          <CommissionInfoPanels />
        </div>
      )}
    </div>
  );
};

function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default Commission;
