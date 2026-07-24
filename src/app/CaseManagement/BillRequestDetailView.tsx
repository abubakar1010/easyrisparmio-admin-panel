import { useState } from "react";
import { Button, Input, InputNumber, Spin, Empty, Tag, Select, Table, message, Tooltip, DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiSend,
} from "react-icons/fi";
import {
  LuZap,
  LuFlame,
  LuLeaf,
  LuPackageSearch,
  LuFileText as LuFileTextIcon,
  LuArrowRight,
  LuFileCheck2,
  LuUpload,
  LuFilePlus2,
  LuMessageSquare,
  LuScanLine,
  LuBadgeDollarSign,
  LuClock3,
  LuDownload,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import {
  useGetBillByIdAdminQuery,
  useGetAllOffersForBillQuery,
  useSendSelectedOffersMutation,
  type IOfferWithSavings,
} from "../../redux/features/Bills/billApi";
import {
  useGetCaseByIdQuery,
  useUpdateCaseMutation,
  type ICase,
  type ICaseEvent,
  type ICaseDocument,
} from "../../redux/features/Cases/caseApi";
import {
  useGetContractByCaseQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  type IContract,
} from "../../redux/features/Contracts/contractApi";

/* ── Status & Step Configuration ─────────────────────────── */

const billStatusOrder = [
  "uploaded",
  "analyzing",
  "analyzed",
  "offer_sent",
  "case_created",
];

const stepConfig = [
  { label: "Uploaded", statuses: ["uploaded", "analyzing"] },
  { label: "Offer Sent", statuses: ["analyzed", "offer_sent"] },
  { label: "Case Created", statuses: ["case_created"] },
  { label: "Activated", statuses: [] },
];

const statusLabel: Record<string, string> = {
  uploaded: "Uploaded",
  analyzing: "Analyzing",
  analyzed: "Analyzed",
  error: "Error",
  offer_sent: "Offer Sent",
  case_created: "Case Created",
};

const statusTagColor: Record<string, string> = {
  uploaded: "blue",
  analyzing: "orange",
  analyzed: "green",
  error: "red",
  offer_sent: "cyan",
  case_created: "purple",
};

/* ── Helpers ──────────────────────────────────────────────── */

function getStepIndex(status: string): number {
  const idx = billStatusOrder.indexOf(status);
  if (idx <= 1) return 0; // uploaded or analyzing → step 0
  if (idx === 2 || idx === 3) return 1; // analyzed or offer_sent → step 1
  if (idx === 4) return 2; // case_created → step 2
  return -1;
}

function getStepStates(status: string): ("done" | "current" | "pending")[] {
  const currentStep = getStepIndex(status);
  if (currentStep < 0) return stepConfig.map(() => "pending");
  return stepConfig.map((_, i) => {
    if (i < currentStep) return "done";
    if (i === currentStep) return "current";
    return "pending";
  });
}

const fmtDate = (val: string | null | undefined) => {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return val;
  }
};

const fmt = (val: number | null | undefined, decimals = 2) =>
  val != null ? `€ ${Number(val).toFixed(decimals)}` : "—";

const fmtNum = (val: number | null | undefined, unit = "") =>
  val != null
    ? `${Number(val).toLocaleString("it-IT", { maximumFractionDigits: 2 })} ${unit}`.trim()
    : "—";

/* ── Tab definitions ─────────────────────────────────────── */

const tabKeys = [
  { key: "available_offers", label: "Available Offers" },
  { key: "bill_data", label: "Bill Data" },
  { key: "case_details", label: "Case Details" },
] as const;

/* ── Main Component ──────────────────────────────────────── */

const BillRequestDetailView = () => {
  const navigate = useNavigate();
  const { billId } = useParams();
  const {
    data: bill,
    isLoading,
    refetch,
  } = useGetBillByIdAdminQuery(billId!, { skip: !billId });
  const { data: allOffers, isLoading: offersLoading } = useGetAllOffersForBillQuery(billId!, {
    skip: !billId,
  });
  const [sendSelectedOffers, { isLoading: isSending }] = useSendSelectedOffersMutation();
  const [activeTab, setActiveTab] = useState("available_offers");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [savingsOverrides, setSavingsOverrides] = useState<Record<string, number>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Empty description="Bill request not found" />
        <Button onClick={() => navigate("/case-management")} icon={<FiArrowLeft />}>
          Back to Case Management
        </Button>
      </div>
    );
  }

  const isElectricity = bill.billType === "electricity";
  const activeCase = bill.switchCases?.[0] ?? null;
  const stepStates = getStepStates(bill.status);
  const currentStepIdx = stepStates.indexOf("current");
  const doneCount = stepStates.filter((s) => s === "done").length;
  const progressPct =
    currentStepIdx >= 0
      ? (currentStepIdx / (stepConfig.length - 1)) * 100
      : doneCount === stepConfig.length
        ? 100
        : 0;

  const customerName = bill.user
    ? `${bill.user.firstName} ${bill.user.lastName}`
    : "—";

  const handleSendOffers = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select at least one offer");
      return;
    }

    const offersPayload = selectedRowKeys.map((key) => {
      const id = String(key);
      const override = savingsOverrides[id];
      return override != null
        ? { offerId: id, estimatedSavings: override }
        : { offerId: id };
    });

    try {
      await sendSelectedOffers({ billId: bill.id, offers: offersPayload }).unwrap();
      message.success(`${selectedRowKeys.length} offer(s) sent to user`);
      setSelectedRowKeys([]);
      refetch();
    } catch {
      message.error("Failed to send offers");
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case "available_offers":
        return (
          <AvailableOffersTab
            offers={allOffers || []}
            isLoading={offersLoading}
            isElectricity={isElectricity}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={setSelectedRowKeys}
            savingsOverrides={savingsOverrides}
            onSavingsChange={(offerId, value) =>
              setSavingsOverrides((prev) => ({ ...prev, [offerId]: value }))
            }
            onSendOffers={handleSendOffers}
            isSending={isSending}
            billStatus={bill.status}
          />
        );
      case "bill_data":
        return <BillDataTab bill={bill} />;
      case "case_details":
        return <CaseDetailsTab caseId={activeCase?.id ?? null} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/case-management")}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* ── Header ───────────────────────────────────── */}
        <div className="bg-slate-50/60 px-6 pt-6 pb-0">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Tag className="m-0! rounded-md! border-0! bg-slate-800! px-2.5! py-0.5! text-xs! font-semibold! text-white!">
              #{bill.id.slice(0, 8)}
            </Tag>
            <Tag
              color={isElectricity ? "blue" : "orange"}
              className="m-0! rounded-md! border-0! px-2.5! py-0.5! text-xs! font-semibold!"
            >
              <span className="flex items-center gap-1">
                {isElectricity ? <LuZap className="h-3 w-3" /> : <LuFlame className="h-3 w-3" />}
                {isElectricity ? "Electricity" : "Gas"}
              </span>
            </Tag>
            <Tag
              color={statusTagColor[bill.status] || "default"}
              className="m-0! rounded-md! border-0! px-2.5! py-0.5! text-xs! font-semibold!"
            >
              {statusLabel[bill.status] || bill.status}
            </Tag>
            {activeCase && (
              <Tag className="m-0! rounded-md! border-0! bg-purple-50! px-2.5! py-0.5! text-xs! font-semibold! text-purple-600!">
                Case {activeCase.caseNumber || activeCase.id.slice(0, 8)}
              </Tag>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-800">
            {customerName}
            {bill.supplier && (
              <span className="font-bold">
                {" "}— {bill.supplier.name}
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {bill.podNumber && <>POD {bill.podNumber} • </>}
            {bill.pdrNumber && <>PDR {bill.pdrNumber} • </>}
            {bill.totalAmount != null && <>Amount: {fmt(bill.totalAmount)} • </>}
            Uploaded {fmtDate(bill.createdAt)}
          </p>

          {/* ── Stepper ────────────────────────────────── */}
          <div className="relative flex items-start justify-between mt-8 mb-6 px-2 sm:px-6">
            <div className="absolute top-5 left-[10%] right-[10%] h-[3px] -translate-y-1/2 rounded-full bg-slate-200" />
            <div
              className="absolute top-5 left-[10%] h-[3px] -translate-y-1/2 rounded-full bg-emerald-400 transition-all duration-700"
              style={{ width: `${progressPct * 0.8}%` }}
            />

            {stepConfig.map((step, i) => {
              const s = stepStates[i];
              return (
                <div
                  key={step.label}
                  className="relative z-10 flex flex-col items-center gap-2.5 w-[80px]"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      s === "done"
                        ? "bg-emerald-500 text-white"
                        : s === "current"
                          ? "bg-orange-500 text-white ring-4 ring-orange-100"
                          : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {s === "done" ? <FiCheck className="h-5 w-5" /> : i + 1}
                  </div>
                  <span
                    className={`text-[11px] text-center leading-tight ${
                      s === "done"
                        ? "text-emerald-600 font-medium"
                        : s === "current"
                          ? "text-orange-600 font-semibold"
                          : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pb-6">
            <Button
              type="primary"
              icon={<FiSend className="h-3.5 w-3.5" />}
              loading={isSending}
              onClick={handleSendOffers}
              disabled={selectedRowKeys.length === 0}
              className="h-10 rounded-lg bg-slate-800! hover:bg-slate-700! border-0! font-semibold"
            >
              {selectedRowKeys.length > 0
                ? `Send ${selectedRowKeys.length} Offer${selectedRowKeys.length > 1 ? "s" : ""} to User`
                : "Select Offers to Send"}
            </Button>
          </div>
        </div>

        {/* ── Tabs Navigation ──────────────────────────── */}
        <div className="border-b border-slate-200">
          <div className="flex gap-0 overflow-x-auto px-6">
            {tabKeys.map((tab) => {
              const active = activeTab === tab.key;
              // hide case_details tab if no case exists
              if (tab.key === "case_details" && !activeCase) return null;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    active ? "text-[#7061ED]" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#7061ED]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content ──────────────────────────────── */}
        <div className="p-6">{renderTab()}</div>
      </div>
    </div>
  );
};

/* ── Available Offers Tab ───────────────────────────────── */

function AvailableOffersTab({
  offers,
  isLoading: isLoadingOffers,
  isElectricity,
  selectedRowKeys,
  onSelectionChange,
  savingsOverrides,
  onSavingsChange,
  onSendOffers,
  isSending,
  billStatus,
}: {
  offers: IOfferWithSavings[];
  isLoading: boolean;
  isElectricity: boolean;
  selectedRowKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
  savingsOverrides: Record<string, number>;
  onSavingsChange: (offerId: string, value: number) => void;
  onSendOffers: () => void;
  isSending: boolean;
  billStatus: string;
}) {
  const unit = isElectricity ? "kWh" : "Smc";

  const columns: ColumnsType<IOfferWithSavings> = [
    {
      title: "OFFER",
      key: "name",
      width: 200,
      render: (_, record) => (
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{record.name}</p>
          <p className="text-xs text-slate-400 truncate">{record.supplier?.name || "—"}</p>
        </div>
      ),
    },
    {
      title: "TYPE",
      key: "energyType",
      width: 100,
      render: (_, record) => (
        <Tag
          color={record.energyType === "electricity" ? "blue" : record.energyType === "gas" ? "orange" : "purple"}
          className="border-0 rounded text-[10px] font-bold uppercase"
        >
          {record.energyType}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "MARKET",
      key: "marketType",
      width: 90,
      render: (_, record) => (
        <span className="text-xs font-medium text-slate-600 capitalize">{record.marketType}</span>
      ),
      align: "center",
    },
    {
      title: `PRICE/${unit.toUpperCase()}`,
      key: "price",
      width: 110,
      render: (_, record) => {
        const price = isElectricity ? record.pricePerKwh : record.pricePerSmc;
        return (
          <span className="text-sm font-bold text-slate-700">
            {price != null ? `€ ${Number(price).toFixed(4)}` : "—"}
          </span>
        );
      },
      sorter: (a, b) => {
        const pa = isElectricity ? (a.pricePerKwh ?? 999) : (a.pricePerSmc ?? 999);
        const pb = isElectricity ? (b.pricePerKwh ?? 999) : (b.pricePerSmc ?? 999);
        return pa - pb;
      },
      align: "right",
    },
    {
      title: "FIXED FEE",
      key: "fixedFee",
      width: 90,
      render: (_, record) => (
        <span className="text-xs text-slate-600">€ {Number(record.fixedMonthlyFee).toFixed(2)}</span>
      ),
      align: "right",
    },
    {
      title: "DURATION",
      key: "duration",
      width: 80,
      render: (_, record) => (
        <span className="text-xs text-slate-600">{record.contractDurationMonths} mo</span>
      ),
      align: "center",
    },
    {
      title: "",
      key: "green",
      width: 40,
      render: (_, record) =>
        record.isGreenEnergy ? (
          <Tooltip title="Green energy">
            <LuLeaf className="h-4 w-4 text-emerald-500" />
          </Tooltip>
        ) : null,
      align: "center",
    },
    {
      title: "EST. SAVINGS",
      key: "savings",
      width: 140,
      render: (_, record) => (
        <InputNumber
          size="small"
          min={0}
          step={0.01}
          precision={2}
          prefix="€"
          value={savingsOverrides[record.id] ?? record.estimatedSavings}
          onChange={(val) => onSavingsChange(record.id, val ?? 0)}
          className="w-full [&_input]:text-right"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      sorter: (a, b) => {
        const sa = savingsOverrides[a.id] ?? a.estimatedSavings;
        const sb = savingsOverrides[b.id] ?? b.estimatedSavings;
        return sa - sb;
      },
      align: "right",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Send action bar */}
      {selectedRowKeys.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
          <p className="text-sm font-semibold text-emerald-800">
            {selectedRowKeys.length} offer{selectedRowKeys.length > 1 ? "s" : ""} selected
          </p>
          <Button
            type="primary"
            icon={<FiSend className="h-3.5 w-3.5" />}
            loading={isSending}
            onClick={onSendOffers}
            className="!bg-emerald-500 hover:!bg-emerald-600 border-0 rounded-lg h-9 px-5 font-semibold"
          >
            Send Selected Offers
          </Button>
        </div>
      )}

      {billStatus === "offer_sent" && (
        <div className="rounded-lg bg-cyan-50 px-3 py-2">
          <p className="text-xs text-cyan-700">
            Offers have already been sent for this bill. You can still select and send additional offers.
          </p>
        </div>
      )}

      {isLoadingOffers ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" />
        </div>
      ) : offers.length === 0 ? (
        <Empty description="No active offers available for this bill type" />
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <LuPackageSearch className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-semibold text-slate-800">
              Available Offers ({offers.length})
            </h4>
          </div>
          <Table<IOfferWithSavings>
            rowKey="id"
            columns={columns}
            dataSource={offers}
            size="small"
            pagination={offers.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
            scroll={{ x: 900 }}
            rowSelection={{
              type: "checkbox",
              selectedRowKeys,
              onChange: onSelectionChange,
            }}
            className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:text-[10px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-row]:hover:bg-slate-50/30 [&_.ant-table-cell]:py-3"
          />
        </>
      )}
    </div>
  );
}

/* ── Bill Data Tab ──────────────────────────────────────── */

function BillDataTab({ bill }: { bill: { totalAmount: number | null; costPerUnit: number | null; fixedCharges: number | null; taxes: number | null; consumptionKwh: number | null; consumptionSmc: number | null; billingPeriodStart: string | null; billingPeriodEnd: string | null; billType: string; customerName: string | null; supplyAddress: string | null; codiceFiscale: string | null; partitaIva: string | null; contractNumber: string | null; meterNumber: string | null; podNumber: string | null; pdrNumber: string | null; user?: { firstName: string; lastName: string; email: string }; supplier?: { name: string } | null } }) {
  const isElectricity = bill.billType === "electricity";

  const groups = [
    {
      title: "Financial Breakdown",
      rows: [
        { label: "Total Amount", value: fmt(bill.totalAmount) },
        {
          label: "Cost per Unit",
          value: bill.costPerUnit != null ? `€ ${Number(bill.costPerUnit).toFixed(6)}` : "—",
        },
        { label: "Fixed Charges", value: fmt(bill.fixedCharges) },
        { label: "Taxes", value: fmt(bill.taxes) },
        {
          label: isElectricity ? "Consumption (kWh)" : "Consumption (Smc)",
          value: fmtNum(
            isElectricity ? bill.consumptionKwh : bill.consumptionSmc,
            isElectricity ? "kWh" : "Smc",
          ),
        },
        {
          label: "Billing Period",
          value:
            bill.billingPeriodStart || bill.billingPeriodEnd
              ? `${fmtDate(bill.billingPeriodStart)} — ${fmtDate(bill.billingPeriodEnd)}`
              : "—",
        },
      ],
    },
    {
      title: "Customer Information",
      rows: [
        {
          label: "Name",
          value: bill.user
            ? `${bill.user.firstName} ${bill.user.lastName}`
            : bill.customerName || "—",
        },
        { label: "Email", value: bill.user?.email || "—" },
        { label: "Supply Address", value: bill.supplyAddress || "—" },
        { label: "Codice Fiscale", value: bill.codiceFiscale || "—" },
        { label: "Partita IVA", value: bill.partitaIva || "—" },
      ],
    },
    {
      title: "Supply Details",
      rows: [
        { label: "Supplier", value: bill.supplier?.name || "Not matched" },
        { label: isElectricity ? "POD Number" : "PDR Number", value: (isElectricity ? bill.podNumber : bill.pdrNumber) || "—" },
        { label: "Contract Number", value: bill.contractNumber || "—" },
        { label: "Meter Number", value: bill.meterNumber || "—" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.title}>
          <h4 className="text-sm font-semibold text-slate-800 mb-4">{g.title}</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.rows.map((r) => (
              <div key={r.label}>
                <span className="text-xs text-slate-400">{r.label}</span>
                <p className="text-sm font-medium text-slate-700">{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Case Details Tab ───────────────────────────────────── */

const caseStatusLabel: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  documents_pending: "Documents Pending",
  contract_sent: "Contract Sent",
  contract_signed: "Contract Signed",
  activated: "Activated",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const caseStatusColor: Record<string, string> = {
  new: "blue",
  in_progress: "processing",
  documents_pending: "default",
  contract_sent: "gold",
  contract_signed: "orange",
  activated: "green",
  rejected: "red",
  cancelled: "default",
};

const caseStatusOrder = [
  "new",
  "in_progress",
  "documents_pending",
  "contract_sent",
  "contract_signed",
  "activated",
];

function getNextCaseStatus(current: string): string | null {
  const idx = caseStatusOrder.indexOf(current);
  return idx >= 0 && idx < caseStatusOrder.length - 1 ? caseStatusOrder[idx + 1] : null;
}

const eventIconMap: Record<string, { icon: React.ReactNode; color: string }> = {
  STATUS_CHANGE: { icon: <FiCheckCircle className="h-5 w-5 text-white" />, color: "bg-orange-500" },
  DOCUMENT_UPLOADED: { icon: <LuUpload className="h-5 w-5 text-white" />, color: "bg-blue-500" },
  DOCUMENT_VERIFIED: { icon: <LuFileCheck2 className="h-5 w-5 text-white" />, color: "bg-emerald-500" },
  OCR_COMPLETED: { icon: <LuScanLine className="h-5 w-5 text-white" />, color: "bg-teal-500" },
  CONTRACT_GENERATED: { icon: <LuFileCheck2 className="h-5 w-5 text-white" />, color: "bg-amber-500" },
  CONTRACT_SIGNED: { icon: <LuFileCheck2 className="h-5 w-5 text-white" />, color: "bg-green-500" },
  ADMIN_ASSIGNED: { icon: <FiEdit2 className="h-5 w-5 text-white" />, color: "bg-purple-500" },
  NOTE_ADDED: { icon: <LuMessageSquare className="h-5 w-5 text-white" />, color: "bg-slate-500" },
  SYSTEM_EVENT: { icon: <LuFilePlus2 className="h-5 w-5 text-white" />, color: "bg-purple-500" },
};

const caseSubTabs = [
  { key: "timeline", label: "Timeline" },
  { key: "case_data", label: "Case Data" },
  { key: "documents", label: "Documents", counted: true },
  { key: "contract", label: "Contract" },
  { key: "commission", label: "Commission" },
] as const;

function CaseDetailsTab({ caseId }: { caseId: string | null }) {
  const { data: caseData, isLoading } = useGetCaseByIdQuery(caseId!, { skip: !caseId });
  const [updateCase, { isLoading: isUpdating }] = useUpdateCaseMutation();
  const [subTab, setSubTab] = useState("timeline");
  const [note, setNote] = useState("");

  if (!caseId) {
    return (
      <div className="py-12">
        <Empty description="No case created yet for this bill request" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="py-12">
        <Empty description="Case not found" />
      </div>
    );
  }

  const events = [...(caseData.events || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const docCount = caseData.documents?.length || 0;

  const customerName = caseData.user
    ? `${caseData.user.firstName} ${caseData.user.lastName}`
    : "—";
  const agentName = caseData.assignedAgent
    ? `${caseData.assignedAgent.firstName} ${caseData.assignedAgent.lastName}`
    : null;

  const handleAdvance = async () => {
    const next = getNextCaseStatus(caseData.status);
    if (!next) return;
    try {
      await updateCase({ id: caseData.id, data: { status: next } }).unwrap();
      message.success(`Status advanced to ${caseStatusLabel[next]}`);
    } catch {
      message.error("Failed to advance status");
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim()) return;
    try {
      await updateCase({ id: caseData.id, data: { internalNotes: note } }).unwrap();
      message.success("Note saved");
      setNote("");
    } catch {
      message.error("Failed to save note");
    }
  };

  const tabCounts: Record<string, number> = { documents: docCount };

  const renderSubTab = () => {
    switch (subTab) {
      case "timeline":
        return <CaseTimeline events={events} />;
      case "case_data":
        return (
          <CaseDataSection
            caseData={caseData}
            customerName={customerName}
            agentName={agentName}
          />
        );
      case "documents":
        return <CaseDocumentsSection documents={caseData.documents || []} />;
      case "contract":
        return <CaseContractSection caseData={caseData} />;
      case "commission":
        return <CaseCommissionSection caseData={caseData} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Case Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="m-0! rounded-md! border-0! bg-slate-800! px-2.5! py-0.5! text-xs! font-semibold! text-white!">
            {caseData.caseNumber || `#${caseData.id.slice(0, 8)}`}
          </Tag>
          <Tag
            color={caseStatusColor[caseData.status] || "default"}
            className="m-0! rounded-md! border-0! px-2.5! py-0.5! text-xs! font-semibold!"
          >
            {caseStatusLabel[caseData.status] || caseData.status}
          </Tag>
          <Tag className="m-0! rounded-md! border-0! bg-orange-50! px-2.5! py-0.5! text-xs! font-semibold! text-orange-600! capitalize!">
            {caseData.caseType?.replace("_", " ")}
          </Tag>
          {agentName && (
            <Tag className="m-0! rounded-md! border-0! bg-purple-50! px-2.5! py-0.5! text-xs! font-semibold! text-purple-600!">
              Handled by {agentName}
            </Tag>
          )}
          {caseData.slaDeadline && (
            (() => {
              const daysLeft = Math.ceil(
                (new Date(caseData.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
              );
              return (
                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    daysLeft <= 5 ? "text-red-500" : daysLeft <= 10 ? "text-amber-500" : "text-emerald-500"
                  }`}
                >
                  <LuClock3 className="h-3.5 w-3.5" />
                  SLA: {daysLeft > 0 ? `${daysLeft}d left` : "Overdue"}
                </span>
              );
            })()
          )}
        </div>
        <Button
          type="primary"
          icon={<LuArrowRight className="h-4 w-4" />}
          onClick={handleAdvance}
          loading={isUpdating}
          disabled={!getNextCaseStatus(caseData.status)}
          size="small"
          className="rounded-lg bg-slate-800! hover:bg-slate-700! border-0! font-semibold"
        >
          Advance Status
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-slate-100">
        <div className="flex gap-0 overflow-x-auto">
          {caseSubTabs.map((tab) => {
            const active = subTab === tab.key;
            const count = tab.counted ? tabCounts[tab.key] : null;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSubTab(tab.key)}
                className={`relative px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active ? "text-[#7061ED]" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {count != null && count > 0 && (
                    <span
                      className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                        active ? "bg-[#7061ED] text-white" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </span>
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#7061ED]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab Content */}
      <div>{renderSubTab()}</div>

      {/* Internal Notes (always visible) */}
      <div className="border-t border-slate-100 pt-5 space-y-3">
        <h4 className="text-sm font-semibold text-slate-800">Internal Notes</h4>
        {caseData.internalNotes && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            {caseData.internalNotes}
          </div>
        )}
        <Input.TextArea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add internal note..."
          className="resize-none rounded-xl! border-slate-200"
        />
        <div className="flex justify-end">
          <Button
            type="primary"
            disabled={!note.trim()}
            onClick={handleSaveNote}
            loading={isUpdating}
            size="small"
            className="rounded-lg bg-[#7061ED]! hover:bg-[#5f52d4]! font-semibold"
          >
            Save Note
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Case Sub-sections ──────────────────────────────────── */

function CaseTimeline({ events }: { events: ICaseEvent[] }) {
  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No activity yet.</p>;
  }

  return (
    <div className="space-y-5">
      {events.map((event, idx) => {
        const ei = eventIconMap[event.eventType] || eventIconMap.SYSTEM_EVENT;
        const isFirst = idx === 0;
        return (
          <div key={event.id} className="flex gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ei.color}`}>
              {ei.icon}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-slate-800">{event.title}</h4>
                {isFirst && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Current
                  </span>
                )}
              </div>
              {event.description && (
                <p className="mt-0.5 text-sm text-slate-600">{event.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                <span className="text-[#7061ED] font-medium">{event.actorLabel || "System"}</span>
                {" • "}
                {fmtDate(event.createdAt)}{" "}
                {new Date(event.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CaseDataSection({
  caseData,
  customerName,
  agentName,
}: {
  caseData: ICase;
  customerName: string;
  agentName: string | null;
}) {
  const groups = [
    {
      title: "Customer Information",
      rows: [
        { label: "Name", value: customerName },
        { label: "Email", value: caseData.user?.email || "—" },
        { label: "Case Type", value: caseData.caseType?.replace("_", " ") || "—" },
        { label: "Priority", value: caseData.priority || "—" },
      ],
    },
    {
      title: "Supplier & Offer",
      rows: [
        { label: "From Supplier", value: caseData.fromSupplier?.name || "—" },
        { label: "To Supplier", value: caseData.toSupplier?.name || "—" },
        { label: "Selected Offer", value: caseData.selectedOffer?.name || "—" },
        {
          label: "SLA Deadline",
          value: caseData.slaDeadline ? fmtDate(caseData.slaDeadline) : "—",
        },
      ],
    },
    {
      title: "Assignment & Dates",
      rows: [
        { label: "Assigned Agent", value: agentName || "Unassigned" },
        { label: "Case Number", value: caseData.caseNumber || "—" },
        { label: "Created", value: fmtDate(caseData.createdAt) },
        { label: "Last Updated", value: fmtDate(caseData.updatedAt) },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.title}>
          <h4 className="text-sm font-semibold text-slate-800 mb-4">{g.title}</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {g.rows.map((r) => (
              <div key={r.label}>
                <span className="text-xs text-slate-400">{r.label}</span>
                <p className="text-sm font-medium text-slate-700 capitalize">{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CaseDocumentsSection({ documents }: { documents: ICaseDocument[] }) {
  if (documents.length === 0) {
    return (
      <div className="py-8">
        <Empty description="No documents uploaded" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <FiFileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{doc.fileName}</p>
              <p className="text-xs text-slate-400 capitalize">
                {doc.documentType?.replace("_", " ")}
                {doc.fileSizeBytes != null &&
                  ` • ${(doc.fileSizeBytes / 1024 / 1024).toFixed(1)} MB`}
              </p>
            </div>
          </div>
          <Tag
            color={doc.verified ? "green" : "default"}
            className="m-0! rounded-full! border-0! text-xs!"
          >
            {doc.verified ? "Verified" : "Pending"}
          </Tag>
        </div>
      ))}
    </div>
  );
}

function CaseCommissionSection({ caseData }: { caseData: ICase }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-900 p-6 text-white">
        <span className="text-sm text-slate-300">Estimated Annual Value</span>
        <p className="mt-3 flex items-center gap-2 text-3xl font-bold">
          <LuBadgeDollarSign className="h-6 w-6 text-emerald-400" />
          {caseData.estimatedAnnualValue
            ? `€${Number(caseData.estimatedAnnualValue).toFixed(2)}`
            : "—"}
        </p>
      </div>
      {caseData.contract && (
        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-4">Contract Info</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-400">Contract Number</span>
              <p className="text-sm font-medium text-slate-700">
                {caseData.contract.contractNumber}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Status</span>
              <p className="text-sm font-medium text-slate-700 capitalize">
                {caseData.contract.status}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Case Contract Section ─────────────────────────────────── */

const contractStatusLabel: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  signed: "Signed",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
};

const contractStatusColor: Record<string, string> = {
  draft: "default",
  sent: "processing",
  signed: "orange",
  active: "green",
  expired: "red",
  cancelled: "default",
};

const deliveryMethodLabel: Record<string, string> = {
  app: "Through App",
  email: "Via Email",
  mail: "Via Mail",
  phone: "Via Phone",
};

function CaseContractSection({ caseData }: { caseData: ICase }) {
  const { data: contract, isLoading, error } = useGetContractByCaseQuery(caseData.id);
  const [createContract, { isLoading: isCreating }] = useCreateContractMutation();
  const [updateContract, { isLoading: isUpdatingContract }] = useUpdateContractMutation();

  const [contractNumber, setContractNumber] = useState("");
  const [podPdrNumber, setPodPdrNumber] = useState(
    caseData.bill?.podNumber || caseData.bill?.pdrNumber || ""
  );
  const [deliveryMethod, setDeliveryMethod] = useState<string | undefined>(undefined);
  const [documentUrl, setDocumentUrl] = useState("");
  const [activationDate, setActivationDate] = useState<Dayjs | null>(null);
  const [expiryDate, setExpiryDate] = useState<Dayjs | null>(null);

  const hasContract = contract && !error;

  const handleCreate = async () => {
    if (!contractNumber.trim() || !deliveryMethod) return;
    try {
      await createContract({
        caseId: caseData.id,
        contractNumber: contractNumber.trim(),
        podPdrNumber: podPdrNumber || undefined,
        deliveryMethod: deliveryMethod as "app" | "email" | "mail" | "phone",
        documentUrl: documentUrl || undefined,
      }).unwrap();
      message.success("Contract created and sent");
    } catch {
      message.error("Failed to create contract");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!contract) return;
    try {
      const data: Record<string, string> = { status: newStatus };
      if (newStatus === "active") {
        if (activationDate) data.activationDate = activationDate.format("YYYY-MM-DD");
        if (expiryDate) data.expiryDate = expiryDate.format("YYYY-MM-DD");
      }
      await updateContract({ id: contract.id, data }).unwrap();
      message.success(`Contract status updated to ${contractStatusLabel[newStatus]}`);
    } catch {
      message.error("Failed to update contract status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  // No contract yet — show creation form
  if (!hasContract) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <h4 className="text-sm font-bold text-amber-800">Contract Needed</h4>
          <p className="text-sm text-amber-600 mt-1">
            This case requires a contract to be created and sent to the customer.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-800">Create & Send Contract</h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Contract Number *</label>
              <Input
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="CTR-2026-001234"
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">POD/PDR Number</label>
              <Input
                value={podPdrNumber}
                onChange={(e) => setPodPdrNumber(e.target.value)}
                placeholder="IT001E98765432"
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Delivery Method *</label>
              <Select
                value={deliveryMethod}
                onChange={setDeliveryMethod}
                placeholder="Select delivery method"
                className="w-full"
                options={[
                  { value: "app", label: "Through App (upload document)" },
                  { value: "email", label: "Via Email" },
                  { value: "mail", label: "Via Mail" },
                  { value: "phone", label: "Via Phone" },
                ]}
              />
            </div>
            {deliveryMethod === "app" && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Contract Document URL *</label>
                <Input
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="Upload document first, then paste URL"
                  className="rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="primary"
              onClick={handleCreate}
              loading={isCreating}
              disabled={!contractNumber.trim() || !deliveryMethod || (deliveryMethod === "app" && !documentUrl)}
              className="h-10 rounded-lg bg-[#7061ED]! hover:bg-[#5f52d4]! border-0! font-semibold px-6"
            >
              Create & Send Contract
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Contract exists — show details and actions
  return (
    <div className="space-y-6">
      {/* Contract Details */}
      <div className="rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-800">Contract Details</h4>
          <Tag
            color={contractStatusColor[contract.status] || "default"}
            className="m-0! rounded-md! border-0! px-2.5! py-0.5! text-xs! font-semibold!"
          >
            {contractStatusLabel[contract.status] || contract.status}
          </Tag>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-xs text-slate-400">Contract Number</span>
            <p className="text-sm font-medium text-slate-700">{contract.contractNumber}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400">POD/PDR</span>
            <p className="text-sm font-medium text-slate-700">{contract.podPdrNumber || "—"}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Delivery Method</span>
            <p className="text-sm font-medium text-slate-700">
              {contract.deliveryMethod ? deliveryMethodLabel[contract.deliveryMethod] : "—"}
            </p>
          </div>
          {contract.activationDate && (
            <div>
              <span className="text-xs text-slate-400">Activation Date</span>
              <p className="text-sm font-medium text-slate-700">
                {new Date(contract.activationDate).toLocaleDateString("en-US")}
              </p>
            </div>
          )}
          {contract.expiryDate && (
            <div>
              <span className="text-xs text-slate-400">Expiry Date</span>
              <p className="text-sm font-medium text-slate-700">
                {new Date(contract.expiryDate).toLocaleDateString("en-US")}
              </p>
            </div>
          )}
          {contract.signedAt && (
            <div>
              <span className="text-xs text-slate-400">Signed At</span>
              <p className="text-sm font-medium text-slate-700">
                {new Date(contract.signedAt).toLocaleDateString("en-US")}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs text-slate-400">Created</span>
            <p className="text-sm font-medium text-slate-700">
              {new Date(contract.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
        </div>
      </div>

      {/* Documents */}
      {(contract.documentUrl || contract.signedDocumentUrl) && (
        <div className="rounded-xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Documents</h4>
          <div className="space-y-3">
            {contract.documentUrl && (
              <a
                href={contract.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                  <LuDownload className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Unsigned Contract</p>
                  <p className="text-xs text-slate-400">Sent to customer</p>
                </div>
              </a>
            )}
            {contract.signedDocumentUrl && (
              <a
                href={contract.signedDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-emerald-100 p-3 hover:bg-emerald-50 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                  <LuFileCheck2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Signed Contract</p>
                  <p className="text-xs text-slate-400">Uploaded by customer</p>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Actions based on status */}
      {contract.status === "draft" && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <h4 className="text-sm font-bold text-blue-800 mb-2">Send Contract</h4>
          <p className="text-sm text-blue-600 mb-3">
            The contract is in draft. Choose a delivery method and send it to the customer.
          </p>
          <div className="flex items-center gap-3">
            <Select
              value={deliveryMethod}
              onChange={setDeliveryMethod}
              placeholder="Delivery method"
              className="w-48"
              options={[
                { value: "app", label: "Through App" },
                { value: "email", label: "Via Email" },
                { value: "mail", label: "Via Mail" },
                { value: "phone", label: "Via Phone" },
              ]}
            />
            <Button
              type="primary"
              onClick={() => {
                if (!deliveryMethod) return;
                updateContract({
                  id: contract.id,
                  data: { status: "sent", deliveryMethod },
                });
              }}
              loading={isUpdatingContract}
              disabled={!deliveryMethod}
              className="h-9 rounded-lg bg-blue-600! hover:bg-blue-700! border-0! font-semibold"
            >
              Send Contract
            </Button>
          </div>
        </div>
      )}

      {contract.status === "sent" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <h4 className="text-sm font-bold text-amber-800">Waiting for Signature</h4>
          <p className="text-sm text-amber-600 mt-1">
            Contract has been sent via{" "}
            {contract.deliveryMethod ? deliveryMethodLabel[contract.deliveryMethod] : "unknown method"}.
            Waiting for the customer to sign and upload the signed document.
          </p>
        </div>
      )}

      {contract.status === "signed" && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <h4 className="text-sm font-bold text-emerald-800 mb-2">Confirm & Activate</h4>
          <p className="text-sm text-emerald-600 mb-3">
            The customer has signed the contract. Review the signed document and activate the utility.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Activation Date</label>
              <DatePicker
                value={activationDate}
                onChange={(date) => setActivationDate(date)}
                format="DD/MM/YYYY"
                className="w-full rounded-lg"
                placeholder="Select activation date"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Expiry Date</label>
              <DatePicker
                value={expiryDate}
                onChange={(date) => setExpiryDate(date)}
                format="DD/MM/YYYY"
                className="w-full rounded-lg"
                placeholder="Select expiry date"
              />
            </div>
          </div>
          <Button
            type="primary"
            onClick={() => handleUpdateStatus("active")}
            loading={isUpdatingContract}
            className="h-10 rounded-lg bg-emerald-600! hover:bg-emerald-700! border-0! font-semibold px-6"
          >
            Confirm & Activate Utility
          </Button>
        </div>
      )}

      {contract.status === "active" && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="h-5 w-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-emerald-800">Utility Active</h4>
          </div>
          <p className="text-sm text-emerald-600 mt-1">
            The utility has been activated. The customer can see it in their My Utilities section.
          </p>
        </div>
      )}
    </div>
  );
}

export default BillRequestDetailView;
