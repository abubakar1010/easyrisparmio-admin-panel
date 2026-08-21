import { useMemo, useState } from "react";
import { Button, Select, Spin, Tag, Upload, message } from "antd";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiSend,
  FiMail,
  FiFileText,
  FiX,
  FiUpload,
} from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";
import {
  useGetBillsAdminQuery,
  useExtractBillDataMutation,
  useAdminUploadEmailBillMutation,
  type IBillExtractionResult,
} from "../../redux/features/Bills/billApi";
import { useSearchUsersQuery } from "../../redux/features/Users/clientApi";
import { formatMoney, formatQuantity, formatUnitPrice } from "../../utils/format";

const { Dragger } = Upload;

const confidenceColor: Record<string, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-red-500",
};

const confidenceTagColor: Record<string, string> = {
  high: "green",
  medium: "orange",
  low: "red",
};

const OCRBills = () => {
  // Email bill upload state
  const [emailBillType, setEmailBillType] = useState<"electricity" | "gas">("electricity");
  const [emailUserSearch, setEmailUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

  // Two-phase OCR extraction state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<IBillExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const { data } = useGetBillsAdminQuery({ page: 1, limit: 100 });
  const [extractBillData] = useExtractBillDataMutation();
  const [adminUploadEmailBill, { isLoading: isUploadingEmail }] = useAdminUploadEmailBillMutation();
  const { data: searchedUsers } = useSearchUsersQuery(emailUserSearch, {
    skip: emailUserSearch.length < 2,
  });

  const bills = data?.data || [];

  // KPI computed values
  const kpis = useMemo(() => {
    const uploaded = bills.filter((b) => b.status === "uploaded").length;
    const pendingEmail = bills.filter((b) => b.status === "pending_email").length;
    const offerSent = bills.filter((b) => b.status === "offer_sent").length;
    const analyzed = bills.filter((b) => b.status === "analyzed").length;
    const errors = bills.filter((b) => b.status === "error").length;
    return { uploaded, pendingEmail, offerSent, analyzed, errors };
  }, [bills]);

  // Phase A: Extract OCR data and show preview
  const handleExtract = async (file: File) => {
    if (!selectedUserId) {
      message.warning("Please select a user first");
      return;
    }
    setPendingFile(file);
    setIsExtracting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("billType", emailBillType);
    try {
      const result = await extractBillData(formData).unwrap();
      setExtractedData(result);
    } catch {
      message.error("OCR extraction failed. Please try again.");
      setPendingFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  // Phase B: Upload with confirmed extracted data
  const handleConfirmUpload = async () => {
    if (!pendingFile || !selectedUserId) return;
    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("billType", emailBillType);
    formData.append("userId", selectedUserId);
    if (extractedData) {
      formData.append("extractedData", JSON.stringify(extractedData));
    }
    try {
      await adminUploadEmailBill(formData).unwrap();
      message.success("Bill uploaded with OCR data successfully");
      setExtractedData(null);
      setPendingFile(null);
      setSelectedUserId(undefined);
      setEmailUserSearch("");
    } catch {
      message.error("Failed to upload bill");
    }
  };

  const handleCancelExtraction = () => {
    setExtractedData(null);
    setPendingFile(null);
  };

  const isElectricity = emailBillType === "electricity";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Uploaded",
            value: kpis.uploaded,
            icon: <HiOutlineDocumentText className="h-5 w-5" />,
            bg: "bg-amber-100 text-amber-600",
          },
          {
            label: "Pending Email",
            value: kpis.pendingEmail,
            icon: <FiMail className="h-5 w-5" />,
            bg: "bg-purple-100 text-purple-600",
          },
          {
            label: "Offer Sent",
            value: kpis.offerSent,
            icon: <FiSend className="h-5 w-5" />,
            bg: "bg-cyan-100 text-cyan-600",
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

      {/* Upload Email Bill Section */}
      <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiMail className="h-5 w-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-800">Upload Email Bill</h3>
          <span className="text-xs text-slate-400">— For bills received via email from users</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Bill Type
            </p>
            <Select
              value={emailBillType}
              onChange={(v) => setEmailBillType(v)}
              disabled={!!extractedData || isExtracting}
              className="w-44 [&_.ant-select-selector]:rounded-lg"
              options={[
                { value: "electricity", label: "Electricity" },
                { value: "gas", label: "Gas" },
              ]}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Associate with User
            </p>
            <Select
              showSearch
              allowClear
              placeholder="Search user by email..."
              value={selectedUserId}
              onSearch={(v) => setEmailUserSearch(v)}
              onChange={(v) => setSelectedUserId(v)}
              disabled={!!extractedData || isExtracting}
              filterOption={false}
              className="w-full sm:w-80 [&_.ant-select-selector]:rounded-lg"
              options={(searchedUsers || []).map((u) => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName} (${u.email})`,
              }))}
              notFoundContent={
                emailUserSearch.length < 2
                  ? <span className="text-slate-400 text-xs">Type at least 2 characters...</span>
                  : <span className="text-slate-400 text-xs">No users found</span>
              }
            />
          </div>
        </div>

        {/* File Drop Zone - hidden when preview is showing */}
        {!extractedData && (
          <Dragger
            multiple={false}
            showUploadList={false}
            disabled={isExtracting || isUploadingEmail || !selectedUserId}
            beforeUpload={(file) => {
              handleExtract(file as unknown as File);
              return false;
            }}
            accept=".pdf,.jpg,.jpeg,.png"
            className={`flex-1 bg-white! border-2! border-dashed! ${
              selectedUserId ? "border-purple-300! hover:border-purple-500!" : "border-slate-200! opacity-60"
            } transition-colors rounded-xl`}
          >
            <div className="flex flex-col items-center justify-center h-full py-8">
              {isExtracting ? (
                <div className="flex flex-col items-center gap-3">
                  <Spin size="large" />
                  <p className="text-sm font-semibold text-indigo-600">Extracting OCR data...</p>
                  <p className="text-xs text-slate-400">Analyzing bill with AI Vision. This may take a moment.</p>
                </div>
              ) : (
                <>
                  <div className="h-12 w-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4">
                    <FiMail className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700 mb-1">
                    {selectedUserId ? "Drop email bill here" : "Select a user first"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    PDF, JPG, PNG — bill received via email from user
                  </p>
                </>
              )}
            </div>
          </Dragger>
        )}

        {/* OCR Extraction Preview */}
        {extractedData && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <FiFileText className="h-5 w-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800">OCR Extraction Preview</h4>
                <Tag color={confidenceTagColor[extractedData.overallConfidence] || "default"} className="rounded-full border-0 text-xs font-semibold">
                  {extractedData.overallConfidence} confidence
                </Tag>
                {pendingFile && (
                  <span className="text-xs text-slate-400 ml-2">{pendingFile.name}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button icon={<FiX className="h-3.5 w-3.5" />} onClick={handleCancelExtraction} disabled={isUploadingEmail}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<FiUpload className="h-3.5 w-3.5" />}
                  onClick={handleConfirmUpload}
                  loading={isUploadingEmail}
                  className="!bg-[#7061ED] hover:!bg-[#5a4ed4]"
                >
                  Confirm Upload
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <PreviewField label="Supplier" value={extractedData.supplierName} confidence={extractedData.confidence?.supplierName} />
              <PreviewField
                label={isElectricity ? "POD Number" : "PDR Number"}
                value={isElectricity ? extractedData.podNumber : extractedData.pdrNumber}
                confidence={isElectricity ? extractedData.confidence?.podNumber : extractedData.confidence?.pdrNumber}
                mono
              />
              <PreviewField
                label="Total Amount"
                value={formatMoney(extractedData.totalAmount, { fallback: null })}
                confidence={extractedData.confidence?.totalAmount}
              />
              <PreviewField
                label={isElectricity ? "Consumption (kWh)" : "Consumption (Smc)"}
                value={
                  isElectricity
                    ? formatQuantity(extractedData.consumptionKwh, "kWh", { fallback: null })
                    : formatQuantity(extractedData.consumptionSmc, "Smc", { fallback: null })
                }
                confidence={isElectricity ? extractedData.confidence?.consumptionKwh : extractedData.confidence?.consumptionSmc}
              />
              <PreviewField
                label="Cost per Unit"
                value={formatUnitPrice(extractedData.costPerUnit, undefined, { fallback: null })}
                confidence={extractedData.confidence?.costPerUnit}
              />
              <PreviewField
                label="Fixed Charges"
                value={formatMoney(extractedData.fixedCharges, { fallback: null })}
                confidence={extractedData.confidence?.fixedCharges}
              />
              <PreviewField
                label="Taxes"
                value={formatMoney(extractedData.taxes, { fallback: null })}
                confidence={extractedData.confidence?.taxes}
              />
              <PreviewField
                label="Billing Period"
                value={
                  extractedData.billingPeriodStart
                    ? `${extractedData.billingPeriodStart} — ${extractedData.billingPeriodEnd || "?"}`
                    : null
                }
                confidence={extractedData.confidence?.billingPeriodStart}
              />
              <PreviewField label="Customer Name" value={extractedData.customerName} confidence={extractedData.confidence?.customerName} />
              <PreviewField label="Contract No." value={extractedData.contractNumber} confidence={extractedData.confidence?.contractNumber} mono />
              <PreviewField label="Meter No." value={extractedData.meterNumber} confidence={extractedData.confidence?.meterNumber} mono />
              <PreviewField label="Codice Fiscale" value={extractedData.codiceFiscale} confidence={extractedData.confidence?.codiceFiscale} mono />
              <PreviewField label="Partita IVA" value={extractedData.partitaIva} confidence={extractedData.confidence?.partitaIva} mono />
            </div>

            {/* The address is stored as these five fields, so this is what has
                to be checked — the line underneath is only how it was printed,
                and a plausible-looking line can still have split badly. */}
            <div className="mt-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Supply Address</span>
                {extractedData.supplyAddress && (
                  <span className="text-xs text-slate-400 truncate">as printed: {extractedData.supplyAddress}</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <PreviewField label="Street" value={extractedData.supplyStreet} confidence={extractedData.confidence?.supplyStreet} />
                <PreviewField label="No." value={extractedData.supplyStreetNumber} confidence={extractedData.confidence?.supplyStreetNumber} />
                <PreviewField label="City" value={extractedData.supplyCity} confidence={extractedData.confidence?.supplyCity} />
                <PreviewField label="CAP" value={extractedData.supplyPostalCode} confidence={extractedData.confidence?.supplyPostalCode} mono />
                <PreviewField label="Province" value={extractedData.supplyProvince} confidence={extractedData.confidence?.supplyProvince} />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default OCRBills;

// ─── Preview Field Component ─────────────────────────────

interface PreviewFieldProps {
  label: string;
  value?: string | null;
  confidence?: "high" | "medium" | "low" | null;
  mono?: boolean;
}

const PreviewField = ({ label, value, confidence, mono }: PreviewFieldProps) => (
  <div className="rounded-lg bg-white border border-slate-200/70 p-3">
    <div className="flex items-center gap-1.5 mb-1">
      {confidence && (
        <span
          className={`inline-block h-2 w-2 rounded-full ${confidenceColor[confidence] || "bg-slate-300"}`}
          title={`${confidence} confidence`}
        />
      )}
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-sm font-semibold text-slate-700 truncate ${mono ? "font-mono" : ""}`}>
      {value || <span className="text-slate-300">—</span>}
    </p>
  </div>
);
