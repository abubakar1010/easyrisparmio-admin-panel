import { useState } from "react";
import { Button, Spin, Empty, Tag, message, Tooltip } from "antd";
import {
  FiArrowLeft,
  FiDownload,
  FiRefreshCw,
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
  LuShieldCheck,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import {
  useGetBillByIdAdminQuery,
  useReanalyzeBillMutation,
  useSendOffersToUserMutation,
  type IBill,
  type IBillAnalysis,
} from "../../redux/features/Bills/billApi";

const statusConfig: Record<string, { color: string; label: string }> = {
  uploaded: { color: "blue", label: "Uploaded" },
  analyzing: { color: "orange", label: "Analyzing" },
  analyzed: { color: "green", label: "Analyzed" },
  error: { color: "red", label: "Error" },
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
  const [reanalyzeBill, { isLoading: isReanalyzing }] = useReanalyzeBillMutation();
  const [sendOffers, { isLoading: isSending }] = useSendOffersToUserMutation();
  const [showRawJson, setShowRawJson] = useState(false);

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
  const analysis = bill.analysis;
  const ocrData = bill.rawAnalysisData as Record<string, unknown> | null;
  const isElectricity = bill.billType === "electricity";
  const offers = (analysis?.recommendedOffers || []) as IRecommendedOffer[];

  const handleReanalyze = async () => {
    try {
      await reanalyzeBill(bill.id).unwrap();
      message.success("Re-analysis started");
      refetch();
    } catch {
      message.error("Failed to start re-analysis");
    }
  };

  const handleSendOffers = async () => {
    try {
      await sendOffers(bill.id).unwrap();
      message.success("Offers sent to user");
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

          {/* Analysis Results */}
          {analysis && <AnalysisCard analysis={analysis} />}

          {/* Recommended Offers */}
          {offers.length > 0 && (
            <Card title={`Recommended Offers (${offers.length})`} icon={<FiZap className="h-4 w-4 text-amber-500" />}>
              <div className="space-y-3">
                {offers.map((offer, i) => (
                  <OfferRow key={offer.id || i} offer={offer} isElectricity={isElectricity} />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column / Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card title="Actions">
            <div className="space-y-3">
              <Button
                block
                icon={<FiRefreshCw />}
                loading={isReanalyzing}
                onClick={handleReanalyze}
                disabled={bill.status === "analyzing"}
              >
                {isReanalyzing ? "Analyzing..." : "Re-analyze Bill"}
              </Button>
              {bill.status === "analyzed" && offers.length > 0 && (
                <Button
                  block
                  type="primary"
                  icon={<FiSend />}
                  loading={isSending}
                  onClick={handleSendOffers}
                  disabled={analysis?.offersSentToUser}
                  className="!bg-emerald-500 hover:!bg-emerald-600"
                >
                  {analysis?.offersSentToUser ? "Offers Already Sent" : "Send Offers to User"}
                </Button>
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

const AnalysisCard = ({ analysis }: { analysis: IBillAnalysis }) => (
  <Card title="Analysis Results" icon={<LuShieldCheck className="h-4 w-4 text-emerald-500" />}>
    {/* Savings highlight */}
    <div className="mb-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white">
      <p className="text-xs font-medium text-emerald-100">Potential Savings</p>
      <p className="mt-1 text-3xl font-extrabold">
        € {Number(analysis.potentialSavings).toFixed(2)}
      </p>
      <p className="mt-1 text-xs text-emerald-100">per billing period</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <InfoRow label="Current Monthly Average" value={fmt(analysis.currentMonthlyAvg)} />
      <InfoRow label="Recommended Market" value={analysis.recommendedMarketType} />
      {analysis.confidenceScore != null && (
        <div>
          <p className="text-xs text-slate-400">Analysis Confidence</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${Number(analysis.confidenceScore) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {(Number(analysis.confidenceScore) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
      <InfoRow
        label="Offers Sent"
        value={analysis.offersSentToUser ? "Yes" : "Not yet"}
      />
    </div>

    {analysis.analysisSummary && (
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-medium text-slate-500">Summary</p>
        <p className="mt-1 text-sm text-slate-700">{analysis.analysisSummary}</p>
      </div>
    )}
  </Card>
);

interface IRecommendedOffer {
  id?: string;
  name?: string;
  supplierName?: string;
  pricePerKwh?: number;
  pricePerSmc?: number;
  fixedMonthlyFee?: number;
  energyType?: string;
  marketType?: string;
  contractDurationMonths?: number;
  isGreenEnergy?: boolean;
  estimatedSavings?: number;
}

const OfferRow = ({
  offer,
  isElectricity,
}: {
  offer: IRecommendedOffer;
  isElectricity: boolean;
}) => {
  const price = isElectricity ? offer.pricePerKwh : offer.pricePerSmc;
  const unit = isElectricity ? "kWh" : "Smc";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
        <FiZap className="h-5 w-5 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">
          {offer.name || "Unnamed Offer"}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {offer.supplierName || "Unknown"} · {offer.marketType || "—"} ·{" "}
          {offer.contractDurationMonths ? `${offer.contractDurationMonths} months` : "—"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {offer.isGreenEnergy && (
          <Tooltip title="Green energy">
            <LuLeaf className="h-4 w-4 text-emerald-500" />
          </Tooltip>
        )}
        <div className="text-right">
          <p className="text-xs text-slate-400">Price/{unit}</p>
          <p className="text-sm font-bold text-slate-700">
            {price != null ? `€ ${Number(price).toFixed(4)}` : "—"}
          </p>
        </div>
        {offer.estimatedSavings != null && offer.estimatedSavings > 0 && (
          <div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-right">
            <p className="text-[10px] text-emerald-600">Save</p>
            <p className="text-xs font-bold text-emerald-700">
              € {Number(offer.estimatedSavings).toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
