import { Avatar, Input, Select, Spin, Empty, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEye, FiSearch } from "react-icons/fi";
import { LuZap, LuFlame } from "react-icons/lu";
import { useNavigate } from "react-router";
import { useCallback, useState } from "react";
import {
  useGetBillsAdminQuery,
  type IBill,
  type IBillQuery,
} from "../../redux/features/Bills/billApi";
import { debounce } from "../../utils/debounce";

const billStatusConfig: Record<string, { color: string; label: string }> = {
  pending_email: { color: "purple", label: "Pending (Email)" },
  uploaded: { color: "blue", label: "Uploaded" },
  analyzing: { color: "orange", label: "Analyzing" },
  analyzed: { color: "green", label: "Analyzed" },
  error: { color: "red", label: "Error" },
  verification_review: { color: "gold", label: "Verification Review" },
  verification_required: { color: "volcano", label: "Verification Required" },
  verified: { color: "green", label: "Verified" },
  offer_sent: { color: "cyan", label: "Offer Sent" },
  offer_accepted: { color: "purple", label: "Offer Accepted" },
  contract_sent: { color: "gold", label: "Contract Sent" },
  contract_signed: { color: "orange", label: "Contract Signed" },
  contract_review: { color: "gold", label: "Contract Review" },
  contract_verification_required: { color: "volcano", label: "Contract Verification Required" },
  contract_verified: { color: "green", label: "Contract Verified" },
  awaiting_activation: { color: "processing", label: "In Activation" },
  activated: { color: "green", label: "Activated" },
  cancelled: { color: "default", label: "Cancelled" },
};

const CaseManagement = () => {
  const navigate = useNavigate();
  const [queryParams, setQueryParams] = useState<IBillQuery>({ page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading, isFetching } = useGetBillsAdminQuery(queryParams);

  const bills = data?.data || [];
  const meta = data?.meta;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setQueryParams((prev) => ({ ...prev, page: 1, search: value || undefined }));
    }, 500),
    [],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const handleBillTypeFilter = (value: string | undefined) => {
    setBillTypeFilter(value);
    setQueryParams((prev) => ({ ...prev, page: 1, billType: value }));
  };

  const handleStatusFilter = (value: string | undefined) => {
    setStatusFilter(value);
    setQueryParams((prev) => ({ ...prev, page: 1, status: value }));
  };

  const formatCurrency = (val: number | null) =>
    val != null ? `€ ${Number(val).toFixed(2)}` : "—";

  const columns: ColumnsType<IBill> = [
    {
      title: "TYPE",
      key: "billType",
      width: 100,
      render: (_, record) => (
        <Tag
          className={`border-0 rounded font-bold text-[10px] px-2 py-0 uppercase ${
            record.billType === "electricity"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-blue-50 text-blue-600"
          }`}
          icon={
            record.billType === "electricity" ? (
              <LuZap className="inline mr-1 h-3 w-3" />
            ) : (
              <LuFlame className="inline mr-1 h-3 w-3" />
            )
          }
        >
          {record.billType}
        </Tag>
      ),
      align: "center",
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
          <div className="flex items-center gap-2.5">
            <Avatar
              size={28}
              className="bg-indigo-100 text-indigo-600 font-semibold text-[10px]"
            >
              {record.user?.firstName?.[0]}
              {record.user?.lastName?.[0]}
            </Avatar>
            <span className="font-medium text-slate-700">{name}</span>
          </div>
        );
      },
    },
    {
      title: "POD / PDR",
      key: "pod_pdr",
      width: 170,
      render: (_, record) => (
        <span className="font-medium text-slate-700 text-xs font-mono">
          {record.podNumber || record.pdrNumber || "—"}
        </span>
      ),
    },
    {
      title: "SUPPLIER",
      key: "supplier",
      width: 130,
      render: (_, record) => (
        <span className="text-slate-500">{record.supplier?.name || "—"}</span>
      ),
    },
    {
      title: "AMOUNT",
      key: "totalAmount",
      width: 110,
      render: (_, record) => (
        <span className="font-bold text-slate-800">{formatCurrency(record.totalAmount)}</span>
      ),
      align: "right",
    },
    {
      title: "PERIOD",
      key: "period",
      width: 150,
      responsive: ["lg"],
      render: (_, record) => {
        if (!record.billingPeriodStart) return <span className="text-slate-400">—</span>;
        const start = new Date(record.billingPeriodStart).toLocaleDateString("it-IT");
        const end = record.billingPeriodEnd
          ? new Date(record.billingPeriodEnd).toLocaleDateString("it-IT")
          : "—";
        return <span className="text-slate-500 text-xs">{start} - {end}</span>;
      },
    },
    {
      title: "STATUS",
      key: "status",
      width: 130,
      render: (_: unknown, record: IBill) => {
        const cfg = billStatusConfig[record.status] || { color: "default", label: record.status };
        return (
          <Tag
            color={cfg.color}
            className="rounded-full! px-3! py-0.5! text-xs! font-semibold! border-0!"
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, record) => (
        <button
          type="button"
          onClick={() => navigate(`/case-management/${record.id}`)}
          className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-medium text-sm"
        >
          <FiEye className="h-4 w-4" />
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Case Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage bill requests and case workflow
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-3 p-5">
          <div className="flex-1 min-w-[280px]">
            <Input
              allowClear
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by POD, PDR, user, supplier..."
              prefix={<FiSearch className="text-slate-400 mr-2" />}
              className="h-11 rounded-xl border-slate-200"
            />
          </div>
          <Select
            allowClear
            placeholder="Bill type"
            value={billTypeFilter}
            onChange={handleBillTypeFilter}
            style={{ height: "44px" }}
            className="w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
            options={[
              { value: "electricity", label: "Electricity" },
              { value: "gas", label: "Gas" },
            ]}
          />
          <Select
            allowClear
            placeholder="Status"
            value={statusFilter}
            onChange={handleStatusFilter}
            style={{ height: "44px" }}
            className="w-48 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
            options={[
              { value: "uploaded", label: "Uploaded" },
              { value: "analyzing", label: "Analyzing" },
              { value: "analyzed", label: "Analyzed" },
              { value: "verification_review", label: "Verification Review" },
              { value: "verification_required", label: "Verification Required" },
              { value: "verified", label: "Verified" },
              { value: "offer_sent", label: "Offer Sent" },
              { value: "offer_accepted", label: "Offer Accepted" },
              { value: "contract_sent", label: "Contract Sent" },
              { value: "contract_signed", label: "Contract Signed" },
              { value: "contract_review", label: "Contract Review" },
              { value: "contract_verification_required", label: "Contract Verification Required" },
              { value: "contract_verified", label: "Contract Verified" },
              { value: "awaiting_activation", label: "In Activation" },
              { value: "activated", label: "Activated" },
              { value: "cancelled", label: "Cancelled" },
              { value: "error", label: "Error" },
            ]}
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spin size="large" />
          </div>
        ) : bills.length === 0 ? (
          <div className="py-24">
            <Empty description="No bill requests found" />
          </div>
        ) : (
          <Table<IBill>
            rowKey="id"
            columns={columns}
            dataSource={bills}
            scroll={{ x: 1050 }}
            loading={isFetching && !isLoading}
            onRow={(record) => ({
              onClick: () => navigate(`/case-management/${record.id}`),
              className: "cursor-pointer",
            })}
            pagination={{
              current: meta?.page || 1,
              pageSize: meta?.limit || 20,
              total: meta?.total || 0,
              onChange: (page) => setQueryParams((prev) => ({ ...prev, page })),
              showSizeChanger: false,
              className: "p-4 mt-0 border-t border-slate-100",
            }}
            className="[&_.ant-table-thead_th]:bg-slate-50/80 [&_.ant-table-thead_th]:text-[#7061ED] [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:tracking-wider [&_.ant-table-thead_th]:py-3.5 [&_.ant-table-row]:hover:bg-slate-50/30 [&_.ant-table-cell]:py-4 [&_.ant-table-cell]:border-slate-100"
          />
        )}
      </div>
    </div>
  );
};

export default CaseManagement;
