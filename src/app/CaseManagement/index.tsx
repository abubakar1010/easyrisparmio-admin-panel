import { Avatar, Button, Input, Select, Spin, Empty, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEye, FiSearch } from "react-icons/fi";
import { LuClock3 } from "react-icons/lu";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useGetCasesQuery, type ICase } from "../../redux/features/Cases/caseApi";
import { debounce } from "../../utils/debounce";

const { Option } = Select;

const caseStatusColor: Record<string, string> = {
  new: "blue",
  in_progress: "processing",
  documents_pending: "default",
  contract_sent: "gold",
  contract_signed: "cyan",
  activated: "green",
  rejected: "red",
  cancelled: "default",
};

const caseStatusLabel: Record<string, string> = {
  new: "New",
  in_progress: "Processing",
  documents_pending: "Docs Pending",
  contract_sent: "Contract Sent",
  contract_signed: "Signed",
  activated: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const CaseManagement = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = useGetCasesQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter,
  });

  const cases = data?.data || [];
  const meta = data?.meta;

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const columns: ColumnsType<ICase> = [
    {
      title: "CASE ID",
      dataIndex: "caseNumber",
      key: "caseNumber",
      width: 160,
      render: (value) => <span className="font-semibold text-brand">{value || "—"}</span>,
    },
    {
      title: "CUSTOMER",
      key: "customer",
      width: 180,
      render: (_, record) => {
        const name = record.user
          ? `${record.user.firstName} ${record.user.lastName}`
          : "—";
        return (
          <div className="flex items-center gap-2">
            <Avatar size={32} className="bg-indigo-100 text-indigo-600 font-semibold text-xs">
              {record.user?.firstName?.[0]}{record.user?.lastName?.[0]}
            </Avatar>
            <span className="font-medium text-slate-700">{name}</span>
          </div>
        );
      },
    },
    {
      title: "TYPE",
      dataIndex: "caseType",
      key: "caseType",
      width: 120,
      render: (v) => <span className="capitalize">{v?.replace("_", " ")}</span>,
    },
    {
      title: "SUPPLIER",
      key: "supplier",
      width: 140,
      responsive: ["md"],
      render: (_, record) => record.toSupplier?.name || record.fromSupplier?.name || "—",
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag color={caseStatusColor[status] || "default"} className="rounded-full! px-2.5! text-xs font-semibold">
          {caseStatusLabel[status] || status}
        </Tag>
      ),
    },
    {
      title: "SLA",
      key: "sla",
      width: 80,
      responsive: ["lg"],
      render: (_, record) => {
        if (!record.slaDeadline) return "—";
        const daysLeft = Math.ceil(
          (new Date(record.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return (
          <span className={`flex items-center gap-1 text-sm font-medium ${daysLeft <= 3 ? "text-red-500" : "text-slate-500"}`}>
            <LuClock3 className="h-3.5 w-3.5" />
            {daysLeft > 0 ? `${daysLeft}d` : "Overdue"}
          </span>
        );
      },
    },
    {
      title: "OPERATOR",
      key: "operator",
      width: 160,
      responsive: ["lg"],
      render: (_, record) =>
        record.assignedAgent
          ? `${record.assignedAgent.firstName} ${record.assignedAgent.lastName}`
          : "Unassigned",
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="link"
          icon={<FiEye />}
          onClick={() => navigate(`/case-management/${record.id}`)}
          className="text-indigo-500 font-medium"
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Case Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage switching cases</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white p-4">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="Search by case ID, customer..."
              prefix={<FiSearch className="text-slate-400 mr-2" />}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-11 rounded-xl border-slate-200"
            />
          </div>
          <Select
            allowClear
            placeholder="Status"
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            className="w-40 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Option value="new">New</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="documents_pending">Docs Pending</Option>
            <Option value="contract_sent">Contract Sent</Option>
            <Option value="contract_signed">Signed</Option>
            <Option value="activated">Activated</Option>
            <Option value="rejected">Rejected</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spin size="large" />
          </div>
        ) : cases.length === 0 ? (
          <div className="py-24">
            <Empty description="No cases found" />
          </div>
        ) : (
          <Table<ICase>
            rowKey="id"
            columns={columns}
            dataSource={cases}
            scroll={{ x: 900 }}
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
    </div>
  );
};

export default CaseManagement;
