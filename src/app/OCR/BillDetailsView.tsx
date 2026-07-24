import { useState, useMemo } from "react";
import { Button, Spin, Empty, Tag, message, Tooltip, InputNumber, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FiArrowLeft,
  FiDownload,
  FiSend,
  FiUser,
  FiFileText,
  FiZap,
} from "react-icons/fi";
import {
  LuZap,
  LuFlame,
  LuChartColumnIncreasing,
  LuLeaf,
  LuPackageSearch,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import {
  useGetBillByIdAdminQuery,
  useGetAllOffersForBillQuery,
  useSendSelectedOffersMutation,
  type IBill,
  type IOfferWithSavings,
} from "../../redux/features/Bills/billApi";

const statusConfig: Record<string, { color: string; label: string }> = {
  uploaded: { color: "blue", label: "Uploaded" },
  analyzing: { color: "orange", label: "Analyzing" },
  analyzed: { color: "green", label: "Analyzed" },
  error: { color: "red", label: "Error" },
  offer_sent: { color: "cyan", label: "Offer Sent" },
  case_created: { color: "purple", label: "Case Created" },
};

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

const fmt = (val: number | null | undefined, decimals = 2) =>
  val != null ? `€ ${Number(val).toFixed(decimals)}` : "—";

const fmtNum = (val: number | null | undefined, unit = "") =>
  val != null ? `${Number(val).toLocaleString("it-IT", { maximumFractionDigits: 2 })} ${unit}`.trim() : "—";

const fmtDate = (val: string | null | undefined) => {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return val;
  }
};

const BillDetailsView = () => {
  const navigate = useNavigate();
  const { billId } = useParams();
  const { data: bill, isLoading, refetch } = useGetBillByIdAdminQuery(billId!, {
    skip: !billId,
  });
  const { data: allOffers, isLoading: offersLoading } = useGetAllOffersForBillQuery(billId!, {
    skip: !billId,
  });
  const [sendSelectedOffers, { isLoading: isSending }] = useSendSelectedOffersMutation();
  const [showRawJson, setShowRawJson] = useState(false);
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
        <Empty description="Bill not found" />
        <Button onClick={() => navigate("/ocr")} icon={<FiArrowLeft />}>
          Back to Bills
        </Button>
      </div>
    );
  }

  const status = statusConfig[bill.status] || statusConfig.uploaded;
  const ocrData = bill.rawAnalysisData as Record<string, unknown> | null;
  const isElectricity = bill.billType === "electricity";

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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="link"
            className="!p-0 text-slate-500 hover:text-slate-700"
            onClick={() => navigate("/ocr")}
          >
            <FiArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">
                Bill #{bill.id.slice(0, 8)}
              </h1>
              <Tag
                color={status.color}
                className="rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold"
              >
                {status.label}
              </Tag>
              <Tag
                className="rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold"
                color={isElectricity ? "blue" : "orange"}
              >
                {isElectricity ? (
                  <span className="flex items-center gap-1"><LuZap className="h-3 w-3" /> Electricity</span>
                ) : (
                  <span className="flex items-center gap-1"><LuFlame className="h-3 w-3" /> Gas</span>
                )}
              </Tag>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Uploaded {fmtDate(bill.createdAt)} · Updated {fmtDate(bill.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* OCR Extracted Data */}
          {ocrData && !ocrData.ocrError && (
            <Card title="OCR Extracted Data" icon={<FiFileText className="h-4 w-4 text-indigo-500" />}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Supplier (OCR)" value={ocrData.supplierName as string} />
                <InfoRow label={isElectricity ? "POD Number" : "PDR Number"} value={(isElectricity ? ocrData.podNumber : ocrData.pdrNumber) as string} mono />
                <InfoRow label="Contract Number" value={ocrData.contractNumber as string} />
                <InfoRow label="Meter Number" value={ocrData.meterNumber as string} />
                <InfoRow label="Customer Address" value={ocrData.customerAddress as string} />
                {ocrData.confidence != null && (
                  <div>
                    <p className="text-xs text-slate-400">OCR Confidence</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-indigo-500"
                          style={{ width: `${Number(ocrData.confidence) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        {(Number(ocrData.confidence) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {ocrData.rawText && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{ocrData.rawText as string}</p>
                </div>
              )}
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="mt-3 text-xs font-medium text-indigo-500 hover:text-indigo-700"
              >
                {showRawJson ? "Hide" : "Show"} raw JSON
              </button>
              {showRawJson && (
                <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-200">
                  {JSON.stringify(ocrData, null, 2)}
                </pre>
              )}
            </Card>
          )}

          {/* OCR Error */}
          {ocrData?.ocrError && (
            <Card title="OCR Status" icon={<FiFileText className="h-4 w-4 text-red-500" />}>
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-sm font-medium text-red-700">
                  OCR extraction failed: {ocrData.ocrError as string}
                </p>
              </div>
            </Card>
          )}

          {/* Financial Breakdown */}
          <Card title="Financial Breakdown" icon={<LuChartColumnIncreasing className="h-4 w-4 text-emerald-500" />}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Total Amount</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{fmt(bill.totalAmount)}</p>
              </div>
              <InfoRow label="Cost per Unit" value={bill.costPerUnit != null ? `€ ${Number(bill.costPerUnit).toFixed(6)}` : "—"} />
              <InfoRow label="Fixed Charges" value={fmt(bill.fixedCharges)} />
              <InfoRow label="Taxes" value={fmt(bill.taxes)} />
              <InfoRow
                label={isElectricity ? "Consumption (kWh)" : "Consumption (Smc)"}
                value={fmtNum(isElectricity ? bill.consumptionKwh : bill.consumptionSmc, isElectricity ? "kWh" : "Smc")}
              />
              <InfoRow
                label="Billing Period"
                value={
                  bill.billingPeriodStart || bill.billingPeriodEnd
                    ? `${fmtDate(bill.billingPeriodStart)} — ${fmtDate(bill.billingPeriodEnd)}`
                    : "—"
                }
              />
            </div>
          </Card>

          {/* Customer & Supply Details */}
          {(bill.supplyAddress || bill.codiceFiscale || bill.partitaIva || bill.contractNumber || bill.meterNumber || bill.customerName) && (
            <Card title="Customer & Supply Details" icon={<FiUser className="h-4 w-4 text-blue-500" />}>
              <div className="grid gap-4 sm:grid-cols-2">
                {bill.customerName && <InfoRow label="Account Holder" value={bill.customerName} />}
                {bill.supplyAddress && <InfoRow label="Supply Address" value={bill.supplyAddress} />}
                {bill.codiceFiscale && <InfoRow label="Codice Fiscale" value={bill.codiceFiscale} mono />}
                {bill.partitaIva && <InfoRow label="Partita IVA" value={bill.partitaIva} mono />}
                {bill.contractNumber && <InfoRow label="Contract No." value={bill.contractNumber} mono />}
                {bill.meterNumber && <InfoRow label="Meter No." value={bill.meterNumber} mono />}
              </div>
            </Card>
          )}

          {/* Available Offers */}
          <AvailableOffersCard
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
        </div>

        {/* Right Column / Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card title="Actions">
            <div className="space-y-3">
              <Button
                block
                type="primary"
                icon={<FiSend />}
                loading={isSending}
                onClick={handleSendOffers}
                disabled={selectedRowKeys.length === 0}
                className="!bg-emerald-500 hover:!bg-emerald-600"
              >
                {selectedRowKeys.length > 0
                  ? `Send ${selectedRowKeys.length} Offer${selectedRowKeys.length > 1 ? "s" : ""} to User`
                  : "Select Offers to Send"}
              </Button>
              {bill.status === "offer_sent" && (
                <p className="text-xs text-center text-slate-400">
                  Offers have been sent. You can still send additional offers.
                </p>
              )}
            </div>
          </Card>

          {/* User Info */}
          {bill.user && (
            <Card title="Customer" icon={<FiUser className="h-4 w-4 text-blue-500" />}>
              <div className="space-y-2">
                <InfoRow label="Name" value={`${bill.user.firstName} ${bill.user.lastName}`} />
                <InfoRow label="Email" value={bill.user.email} />
              </div>
            </Card>
          )}

          {/* Supplier */}
          <Card title="Supplier">
            <InfoRow
              label="Current Supplier"
              value={bill.supplier?.name || "Not matched"}
            />
          </Card>

          {/* Document */}
          <Card title="Document" icon={<FiFileText className="h-4 w-4 text-slate-500" />}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <FiFileText className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">
                  {bill.fileUrl.split("/").pop()}
                </p>
                <p className="text-xs text-slate-400">
                  {bill.fileUrl.endsWith(".pdf") ? "PDF" : "Image"}
                </p>
              </div>
              <Tooltip title="Download file">
                <a
                  href={`${serverUrl}/${bill.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                >
                  <FiDownload className="h-4 w-4" />
                </a>
              </Tooltip>
            </div>
          </Card>

          {/* IDs */}
          <Card title="Identifiers">
            <div className="space-y-2">
              <InfoRow label="Bill ID" value={bill.id} mono />
              {bill.podNumber && <InfoRow label="POD" value={bill.podNumber} mono />}
              {bill.pdrNumber && <InfoRow label="PDR" value={bill.pdrNumber} mono />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BillDetailsView;

// ─── Sub Components ──────────────────────────────────────

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Card = ({ title, icon, children }: CardProps) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-2">
      {icon && (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
    </div>
    {children}
  </div>
);

interface InfoRowProps {
  label: string;
  value?: string | null;
  mono?: boolean;
}

const InfoRow = ({ label, value, mono }: InfoRowProps) => (
  <div>
    <p className="text-xs text-slate-400">{label}</p>
    <p className={`mt-0.5 text-sm font-semibold text-slate-700 ${mono ? "font-mono" : ""}`}>
      {value || "—"}
    </p>
  </div>
);

// ─── Available Offers Card ──────────────────────────────

interface AvailableOffersCardProps {
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
}

const AvailableOffersCard = ({
  offers,
  isLoading,
  isElectricity,
  selectedRowKeys,
  onSelectionChange,
  savingsOverrides,
  onSavingsChange,
  onSendOffers,
  isSending,
  billStatus,
}: AvailableOffersCardProps) => {
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
    <Card title={`Available Offers (${offers.length})`} icon={<LuPackageSearch className="h-4 w-4 text-amber-500" />}>
      {/* Send action bar */}
      {selectedRowKeys.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
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
        <div className="mb-4 rounded-lg bg-cyan-50 px-3 py-2">
          <p className="text-xs text-cyan-700">
            Offers have already been sent for this bill. You can still select and send additional offers.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" />
        </div>
      ) : offers.length === 0 ? (
        <Empty description="No active offers available for this bill type" />
      ) : (
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
      )}
    </Card>
  );
};
