import { useCallback, useMemo, useState } from "react";
import { Button, Input, Pagination, Select, Spin, Empty, Table, Tag, Tooltip, Upload, message, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import {
  FiCheckCircle,
  FiUpload,
  FiAlertCircle,
  FiSearch,
  FiRefreshCw,
  FiSend,
} from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { LuZap, LuFlame } from "react-icons/lu";
import {
  useGetBillsAdminQuery,
  useUploadBillMutation,
  useReanalyzeBillMutation,
  useSendOffersToUserMutation,
  type IBill,
  type IBillQuery,
} from "../../redux/features/Bills/billApi";
import { debounce } from "../../utils/debounce";

const { Dragger } = Upload;

const statusConfig: Record<string, { color: string; label: string }> = {
  uploaded: { color: "blue", label: "Uploaded" },
  analyzing: { color: "orange", label: "Analyzing" },
  analyzed: { color: "green", label: "Analyzed" },
  error: { color: "red", label: "Error" },
};

const OCRBills = () => {
  const [queryParams, setQueryParams] = useState<IBillQuery>({ page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [uploadBillType, setUploadBillType] = useState<"electricity" | "gas">("electricity");

  const { data, isLoading, isFetching } = useGetBillsAdminQuery(queryParams);
  const [uploadBill, { isLoading: isUploading }] = useUploadBillMutation();
  const [reanalyzeBill] = useReanalyzeBillMutation();
  const [sendOffers] = useSendOffersToUserMutation();

  const bills = data?.data || [];
  const meta = data?.meta;

  // KPI computed values
  const kpis = useMemo(() => {
    const uploaded = bills.filter((b) => b.status === "uploaded").length;
    const analyzing = bills.filter((b) => b.status === "analyzing").length;
    const analyzed = bills.filter((b) => b.status === "analyzed").length;
    const errors = bills.filter((b) => b.status === "error").length;
    return { uploaded, analyzing, analyzed, errors };
  }, [bills]);

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

  const handleUpload = async (file: UploadFile) => {
    const originFile = file as unknown as File;
    const formData = new FormData();
    formData.append("file", originFile);
    formData.append("billType", uploadBillType);
    try {
      await uploadBill(formData).unwrap();
      message.success("Bill uploaded successfully");
    } catch {
      message.error("Failed to upload bill");
    }
  };

  const handleReanalyze = async (bill: IBill) => {
    try {
      await reanalyzeBill(bill.id).unwrap();
      message.success("Bill re-analysis started");
    } catch {
      message.error("Failed to start re-analysis");
    }
  };

  const handleSendOffers = async (bill: IBill) => {
    try {
      await sendOffers(bill.id).unwrap();
      message.success("Offers sent to user");
    } catch {
      message.error("Failed to send offers");
    }
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
      title: "POD / PDR",
      key: "pod_pdr",
      width: 180,
      render: (_, record) => (
        <span className="font-medium text-slate-700 text-xs font-mono">
          {record.podNumber || record.pdrNumber || "—"}
        </span>
      ),
    },
    {
      title: "USER",
      key: "user",
      width: 160,
      render: (_, record) =>
        record.user ? (
          <span className="text-slate-700">
            {record.user.firstName} {record.user.lastName}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      title: "SUPPLIER",
      key: "supplier",
      width: 140,
      responsive: ["md"],
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
      title: "CONSUMPTION",
      key: "consumption",
      width: 130,
      responsive: ["lg"],
      render: (_, record) => {
        if (record.consumptionKwh != null) return <span className="text-slate-600">{record.consumptionKwh} kWh</span>;
        if (record.consumptionSmc != null) return <span className="text-slate-600">{record.consumptionSmc} Smc</span>;
        return <span className="text-slate-400">—</span>;
      },
      align: "right",
    },
    {
      title: "PERIOD",
      key: "period",
      width: 160,
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
      width: 120,
      render: (_, record) => {
        const cfg = statusConfig[record.status] || { color: "default", label: record.status };
        return (
          <Tag color={cfg.color} className="rounded-full px-2.5 py-0.5 text-xs font-semibold border-0">
            {cfg.label}
          </Tag>
        );
      },
      align: "center",
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Reanalyze">
            <Button
              type="text"
              size="small"
              icon={<FiRefreshCw className="h-4 w-4" />}
              onClick={() => handleReanalyze(record)}
              disabled={record.status === "analyzing"}
            />
          </Tooltip>
          {record.status === "analyzed" && (
            <Tooltip title="Send offers to user">
              <Button
                type="text"
                size="small"
                icon={<FiSend className="h-4 w-4 text-emerald-500" />}
                onClick={() => handleSendOffers(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">OCR Bills</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload, analyze and manage scanned bills
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Uploaded",
            value: kpis.uploaded,
            icon: <HiOutlineDocumentText className="h-5 w-5" />,
            bg: "bg-amber-100 text-amber-600",
          },
          {
            label: "Analyzing",
            value: kpis.analyzing,
            icon: <FiRefreshCw className="h-5 w-5" />,
            bg: "bg-blue-100 text-blue-600",
          },
          {
            label: "Analyzed",
            value: kpis.analyzed,
            icon: <FiCheckCircle className="h-5 w-5" />,
            bg: "bg-emerald-100 text-emerald-600",
          },
          {
            label: "Errors",
            value: kpis.errors,
            icon: <FiAlertCircle className="h-5 w-5" />,
            bg: "bg-rose-100 text-rose-600",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm"
          >
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.bg}`}
            >
              {kpi.icon}
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{kpi.value}</h3>
              <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Bill type for upload
            </p>
            <Select
              value={uploadBillType}
              onChange={(v) => setUploadBillType(v)}
              className="w-44 [&_.ant-select-selector]:rounded-lg"
              options={[
                { value: "electricity", label: "Electricity" },
                { value: "gas", label: "Gas" },
              ]}
            />
          </div>
        </div>
        <Dragger
          multiple={false}
          showUploadList={false}
          disabled={isUploading}
          beforeUpload={(file) => {
            handleUpload(file as unknown as UploadFile);
            return false;
          }}
          accept=".pdf,.jpg,.jpeg,.png"
          className="flex-1 bg-white! border-2! border-dashed! border-slate-300! hover:border-[#34d399]! transition-colors rounded-xl"
        >
          <div className="flex flex-col items-center justify-center h-full py-12">
            {isUploading ? (
              <Spin size="large" />
            ) : (
              <>
                <div className="h-16 w-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mb-6">
                  <FiUpload className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Drag bills here
                </h3>
                <p className="text-sm text-slate-500 mb-8">
                  PDF, JPG, PNG — including smartphone photos
                </p>
                <Button
                  type="primary"
                  className="bg-[#34d399] hover:bg-[#10b981] border-0 rounded-lg px-8 h-10 font-medium shadow-sm"
                >
                  Or select file
                </Button>
              </>
            )}
          </div>
        </Dragger>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white p-4">
          <div className="w-full min-w-0 flex-1 sm:min-w-[280px]">
            <Input
              allowClear
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by POD, PDR, user..."
              prefix={<FiSearch className="text-slate-400 mr-2" />}
              className="h-11 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-400 shadow-sm"
            />
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-[auto_auto] sm:gap-3">
            <Select
              allowClear
              placeholder="Bill type"
              value={billTypeFilter}
              onChange={handleBillTypeFilter}
              style={{ height: "44px" }}
              className="w-full sm:w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
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
              className="w-full sm:w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
              options={[
                { value: "uploaded", label: "Uploaded" },
                { value: "analyzing", label: "Analyzing" },
                { value: "analyzed", label: "Analyzed" },
                { value: "error", label: "Error" },
              ]}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spin size="large" />
          </div>
        ) : bills.length === 0 ? (
          <div className="py-24">
            <Empty description="No bills found" />
          </div>
        ) : (
          <>
            <Table<IBill>
              rowKey="id"
              columns={columns}
              dataSource={bills}
              size="middle"
              pagination={false}
              scroll={{ x: 1100 }}
              loading={isFetching && !isLoading}
              className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-thead_th]:py-4 [&_.ant-table-row]:hover:bg-slate-50/30 [&_.ant-table-cell]:py-4"
            />
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-gray-500">
                Showing {bills.length} of {meta?.total ?? 0} bills
              </p>
              {meta && meta.totalPages > 1 && (
                <Pagination
                  current={meta.page}
                  pageSize={meta.limit}
                  total={meta.total}
                  size="small"
                  showSizeChanger={false}
                  onChange={(page) => setQueryParams((prev) => ({ ...prev, page }))}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OCRBills;
