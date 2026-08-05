import { useState, useCallback } from "react";
import { App, Button, Spin, Empty, Tag, Tooltip, InputNumber, Table, Modal, Input, Checkbox } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FiArrowLeft,
  FiDownload,
  FiEye,
  FiSend,
  FiUser,
  FiFileText,
  FiZap,
  FiMail,
  FiAlertTriangle,
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
  useRequestVerificationMutation,
  type IBill,
  type IBillFile,
  type IOfferWithSavings,
} from "../../redux/features/Bills/billApi";
import { useAppSelector } from "../../redux/hooks";
import { server_url } from "../../config";

const statusConfig: Record<string, { color: string; label: string }> = {
  pending_email: { color: "purple", label: "Pending (Email)" },
  uploaded: { color: "blue", label: "Uploaded" },
  analyzing: { color: "orange", label: "Analyzing" },
  analyzed: { color: "green", label: "Analyzed" },
  error: { color: "red", label: "Error" },
  verification_required: { color: "volcano", label: "Verification Required" },
  offer_sent: { color: "cyan", label: "Offer Sent" },
  case_created: { color: "purple", label: "Case Created" },
  contract_sent: { color: "gold", label: "Contract Sent" },
  contract_signed: { color: "orange", label: "Contract Signed" },
  activated: { color: "green", label: "Activated" },
  cancelled: { color: "default", label: "Cancelled" },
};

const fmt = (val: number | null | undefined, decimals = 2): string | null =>
  val != null ? `€ ${Number(val).toFixed(decimals)}` : null;

const fmtNum = (val: number | null | undefined, unit = ""): string | null =>
  val != null ? `${Number(val).toLocaleString("it-IT", { maximumFractionDigits: 2 })} ${unit}`.trim() : null;

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
  const { message, notification } = App.useApp();
  const navigate = useNavigate();
  const { billId } = useParams();
  const { data: bill, isLoading, refetch } = useGetBillByIdAdminQuery(billId!, {
    skip: !billId,
  });
  const { data: allOffers, isLoading: offersLoading } = useGetAllOffersForBillQuery(billId!, {
    skip: !billId || bill?.status === "pending_email",
  });
  const [sendSelectedOffers, { isLoading: isSending }] = useSendSelectedOffersMutation();
  const [requestVerification, { isLoading: isRequestingVerification }] = useRequestVerificationMutation();
  const token = useAppSelector((state) => state.auth.token);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [savingsOverrides, setSavingsOverrides] = useState<Record<string, number>>({});
  const [docPreviewOpen, setDocPreviewOpen] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewLoading, setDocPreviewLoading] = useState<string | null>(null);
  const [docPreviewType, setDocPreviewType] = useState<"pdf" | "image" | "other">("other");
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyFields, setVerifyFields] = useState<string[]>([]);
  const [verifyReupload, setVerifyReupload] = useState(false);

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
  const hasActiveCase = bill.switchCases?.some(
    (c) => !["cancelled", "rejected"].includes(c.status),
  ) ?? false;

  const billFiles: IBillFile[] = bill.files ?? [];

  const fetchFileBlobByUrl = useCallback(async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch file");
    return res.blob();
  }, [token]);

  const detectFileType = (blob: Blob, fileUrl?: string): "pdf" | "image" | "other" => {
    const mime = blob.type.toLowerCase();
    if (mime === "application/pdf") return "pdf";
    if (mime.startsWith("image/")) return "image";
    if (fileUrl?.toLowerCase().endsWith(".pdf")) return "pdf";
    if (fileUrl && /\.(jpg|jpeg|png)$/i.test(fileUrl)) return "image";
    return "other";
  };

  const handleDocView = async (bf: IBillFile) => {
    setDocPreviewLoading(bf.id);
    try {
      const url = `${server_url}bills/${bill.id}/files/${bf.id}`;
      const blob = await fetchFileBlobByUrl(url);
      setDocPreviewType(detectFileType(blob, bf.fileUrl));
      const objUrl = URL.createObjectURL(blob);
      setDocPreviewUrl(objUrl);
      setDocPreviewOpen(true);
    } catch {
      message.error("Failed to load document");
    } finally {
      setDocPreviewLoading(null);
    }
  };

  const handleDocDownload = async (bf: IBillFile) => {
    try {
      const url = `${server_url}bills/${bill.id}/files/${bf.id}`;
      const blob = await fetchFileBlobByUrl(url);
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      const ext = bf.fileUrl?.split(".").pop() || "pdf";
      a.download = bf.originalName || `bill-${bill.id.slice(0, 8)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch {
      message.error("Failed to download document");
    }
  };

  // Legacy single-file fallback handlers
  const handleLegacyDocView = async () => {
    setDocPreviewLoading("legacy");
    try {
      const url = `${server_url}bills/${bill.id}/file`;
      const blob = await fetchFileBlobByUrl(url);
      setDocPreviewType(detectFileType(blob, bill.fileUrl ?? undefined));
      const objUrl = URL.createObjectURL(blob);
      setDocPreviewUrl(objUrl);
      setDocPreviewOpen(true);
    } catch {
      message.error("Failed to load document");
    } finally {
      setDocPreviewLoading(null);
    }
  };

  const handleLegacyDocDownload = async () => {
    try {
      const url = `${server_url}bills/${bill.id}/file`;
      const blob = await fetchFileBlobByUrl(url);
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      const ext = bill.fileUrl?.split(".").pop() || "pdf";
      a.download = `bill-${bill.id.slice(0, 8)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch {
      message.error("Failed to download document");
    }
  };

  const handleRequestVerification = async () => {
    if (!verifyMessage.trim()) {
      message.warning("Please enter a message for the user");
      return;
    }
    try {
      await requestVerification({
        billId: bill.id,
        message: verifyMessage,
        missingFields: verifyFields,
        requireReupload: verifyReupload,
      }).unwrap();
      message.success("Verification request sent to user");
      setVerifyModalOpen(false);
      setVerifyMessage("");
      setVerifyFields([]);
      setVerifyReupload(false);
      refetch();
    } catch {
      message.error("Failed to send verification request");
    }
  };

  const FIELD_LABELS: Record<string, string> = {
    podNumber: "POD Number",
    pdrNumber: "PDR Number",
    totalAmount: "Total Amount",
    consumptionKwh: "Consumption (kWh)",
    consumptionSmc: "Consumption (Smc)",
    costPerUnit: "Cost per Unit",
    fixedCharges: "Fixed Charges",
    taxes: "Taxes",
    billingPeriodStart: "Billing Period Start",
    billingPeriodEnd: "Billing Period End",
    supplyAddress: "Supply Address",
    codiceFiscale: "Codice Fiscale",
    partitaIva: "Partita IVA",
    contractNumber: "Contract Number",
    meterNumber: "Meter Number",
    customerName: "Account Holder",
    supplierName: "Supplier Name",
  };

  const handleCloseDocPreview = () => {
    setDocPreviewOpen(false);
    if (docPreviewUrl) {
      URL.revokeObjectURL(docPreviewUrl);
      setDocPreviewUrl(null);
    }
  };

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

    const result = await sendSelectedOffers({ billId: bill.id, offers: offersPayload });

    if ("error" in result) {
      const errData = (result.error as { data?: { message?: string | string[] } })?.data;
      const msg = errData?.message;
      const errorText = Array.isArray(msg) ? msg.join(", ") : typeof msg === "string" ? msg : "Failed to send offers";
      notification.error({
        message: "Cannot send offers",
        description: errorText,
        duration: 6,
      });
    } else {
      message.success(`${selectedRowKeys.length} offer(s) sent to user`);
      setSelectedRowKeys([]);
      refetch();
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
              {bill.source === "email" && (
                <Tag color="purple" className="rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold">
                  <span className="flex items-center gap-1"><FiMail className="h-3 w-3" /> Via Email</span>
                </Tag>
              )}
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
                {bill.totalAmount != null ? (
                  <p className="mt-1 text-2xl font-bold text-slate-800">{fmt(bill.totalAmount)}</p>
                ) : (
                  <p className="mt-1 text-xs italic text-amber-500">Not found in document</p>
                )}
              </div>
              <InfoRow label="Cost per Unit" value={bill.costPerUnit != null ? `€ ${Number(bill.costPerUnit).toFixed(6)}` : null} />
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
                    : null
                }
              />
            </div>
          </Card>

          {/* Customer & Supply Details */}
          <Card title="Customer & Supply Details" icon={<FiUser className="h-4 w-4 text-blue-500" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Account Holder" value={bill.customerName} />
              <InfoRow label="Supply Address" value={bill.supplyAddress} />
              <InfoRow label="Codice Fiscale" value={bill.codiceFiscale} mono />
              <InfoRow label="Partita IVA" value={bill.partitaIva} mono />
              <InfoRow label={isElectricity ? "POD Number" : "PDR Number"} value={isElectricity ? bill.podNumber : bill.pdrNumber} mono />
              <InfoRow label="Contract No." value={bill.contractNumber} mono />
              <InfoRow label="Meter No." value={bill.meterNumber} mono />
            </div>
          </Card>

          {/* Available Offers */}
          {bill.status !== "pending_email" && (
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
              caseCreated={hasActiveCase}
            />
          )}
        </div>

        {/* Right Column / Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card title="Actions">
            <div className="space-y-3">
              {bill.status === "pending_email" ? (
                <div className="rounded-lg bg-purple-50 border border-purple-200 px-3 py-2.5">
                  <p className="text-xs font-semibold text-purple-800">Pending email bill</p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    Upload the document via OCR before sending offers.
                  </p>
                </div>
              ) : hasActiveCase ? (
                <div className="rounded-lg bg-purple-50 border border-purple-200 px-3 py-2.5">
                  <p className="text-xs font-semibold text-purple-800">Case in progress</p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    User has accepted an offer. Manage the case from Case Management.
                  </p>
                </div>
              ) : (
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
              )}
              {bill.status === "offer_sent" && !hasActiveCase && (
                <p className="text-xs text-center text-slate-400">
                  Offers have been sent. You can still send additional offers.
                </p>
              )}
              {bill.status === "verification_required" && (
                <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2.5">
                  <p className="text-xs font-semibold text-orange-800">Verification requested</p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    Waiting for the user to provide the requested information.
                  </p>
                </div>
              )}
              {!hasActiveCase && bill.status !== "pending_email" && bill.status !== "verification_required" && (
                <Button
                  block
                  icon={<FiAlertTriangle />}
                  onClick={() => setVerifyModalOpen(true)}
                  className="!border-orange-300 !text-orange-600 hover:!bg-orange-50"
                >
                  Request Verification
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
              value={bill.supplierName || bill.supplier?.name || (bill.rawAnalysisData?.ocrSupplierName as string) || null}
            />
          </Card>

          {/* Documents */}
          <Card title={`Documents${billFiles.length > 0 ? ` (${billFiles.length})` : ""}`} icon={<FiFileText className="h-4 w-4 text-slate-500" />}>
            {billFiles.length > 0 ? (
              <div className="space-y-3">
                {billFiles.map((bf, idx) => (
                  <div key={bf.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                      <FiFileText className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {bf.originalName || bf.fileUrl.split("/").pop()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {bf.mimeType === "application/pdf" ? "PDF" : "Image"}
                        {bf.fileSize ? ` · ${(bf.fileSize / 1024).toFixed(0)} KB` : ""}
                        {billFiles.length > 1 ? ` · File ${idx + 1}` : ""}
                      </p>
                    </div>
                    <Tooltip title="View">
                      <button
                        type="button"
                        onClick={() => handleDocView(bf)}
                        disabled={docPreviewLoading === bf.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 transition hover:bg-indigo-100 disabled:opacity-50"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip title="Download">
                      <button
                        type="button"
                        onClick={() => handleDocDownload(bf)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                      >
                        <FiDownload className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                ))}
              </div>
            ) : bill.fileUrl ? (
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
                <Tooltip title="View document">
                  <button
                    type="button"
                    onClick={handleLegacyDocView}
                    disabled={docPreviewLoading === "legacy"}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 transition hover:bg-indigo-100 disabled:opacity-50"
                  >
                    <FiEye className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip title="Download file">
                  <button
                    type="button"
                    onClick={handleLegacyDocDownload}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                  >
                    <FiDownload className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-purple-50 p-3">
                <FiMail className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-purple-700">No document attached yet</p>
                  <p className="text-xs text-purple-500">Waiting for admin to upload the bill received via email</p>
                </div>
              </div>
            )}
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

      {/* Verification Request Modal */}
      <Modal
        open={verifyModalOpen}
        onCancel={() => setVerifyModalOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <FiAlertTriangle className="h-4 w-4 text-orange-500" />
            Request Verification from User
          </span>
        }
        width={600}
        centered
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setVerifyModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={isRequestingVerification}
              onClick={handleRequestVerification}
              disabled={!verifyMessage.trim()}
              className="!bg-orange-500 hover:!bg-orange-600 !border-0"
            >
              Send to User
            </Button>
          </div>
        }
      >
        <div className="space-y-5 py-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Message to User *</label>
            <Input.TextArea
              rows={3}
              placeholder="Explain what's wrong or missing (e.g. 'The bill is hard to read, please re-upload a clearer copy')"
              value={verifyMessage}
              onChange={(e) => setVerifyMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Select Missing Fields (user will fill these manually)</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <Checkbox
                  key={key}
                  checked={verifyFields.includes(key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setVerifyFields((prev) => [...prev, key]);
                    } else {
                      setVerifyFields((prev) => prev.filter((f) => f !== key));
                    }
                  }}
                >
                  <span className="text-xs text-slate-600">{label}</span>
                </Checkbox>
              ))}
            </div>
          </div>

          <div>
            <Checkbox
              checked={verifyReupload}
              onChange={(e) => setVerifyReupload(e.target.checked)}
            >
              <span className="text-sm font-medium text-slate-700">Request document re-upload</span>
            </Checkbox>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">
              Ask the user to upload a clearer or complete version of the bill
            </p>
          </div>
        </div>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        open={docPreviewOpen}
        onCancel={handleCloseDocPreview}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseDocPreview}>Close</Button>
          </div>
        }
        title={
          <span className="flex items-center gap-2">
            <FiFileText className="h-4 w-4 text-indigo-500" />
            Bill Document
          </span>
        }
        width={900}
        centered
        destroyOnClose
      >
        {docPreviewUrl && (
          <div className="flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden" style={{ minHeight: 500 }}>
            {docPreviewType === "pdf" ? (
              <iframe
                src={docPreviewUrl}
                title="Bill Document"
                className="w-full border-0 rounded-lg"
                style={{ height: 600 }}
              />
            ) : docPreviewType === "image" ? (
              <img
                src={docPreviewUrl}
                alt="Bill Document"
                className="max-w-full max-h-[600px] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-12">
                <FiFileText className="h-12 w-12 text-slate-300" />
                <p className="text-sm text-slate-500">
                  Preview not available for this file type. Please download the file to view it.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
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
    {value ? (
      <p className={`mt-0.5 text-sm font-semibold text-slate-700 ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    ) : (
      <p className="mt-0.5 text-xs italic text-amber-500">Not found in document</p>
    )}
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
  caseCreated?: boolean;
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
  caseCreated,
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
        const price = (record.marketType === "variable" || record.marketType === "indexed")
          ? record.spread
          : (isElectricity ? record.pricePerKwh : record.pricePerSmc);
        return (
          <span className="text-sm font-bold text-slate-700">
            {price != null ? `€ ${Number(price).toFixed(4)}` : "—"}
          </span>
        );
      },
      sorter: (a, b) => {
        const getPrice = (r: typeof a) =>
          (r.marketType === "variable" || r.marketType === "indexed")
            ? (r.spread ?? 999)
            : (isElectricity ? (r.pricePerKwh ?? 999) : (r.pricePerSmc ?? 999));
        return getPrice(a) - getPrice(b);
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
        <span className="text-xs text-slate-600">{record.contractDurationDays >= 30 ? `${Math.floor(record.contractDurationDays / 30)} mo` : `${record.contractDurationDays} days`}</span>
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
      {/* Case created banner */}
      {caseCreated && (
        <div className="mb-4 rounded-lg bg-purple-50 border border-purple-200 px-4 py-3">
          <p className="text-sm font-semibold text-purple-800">
            User has accepted an offer and a case has been created.
          </p>
          <p className="text-xs text-purple-600 mt-0.5">
            No more offers can be sent for this bill.
          </p>
        </div>
      )}

      {/* Send action bar */}
      {!caseCreated && selectedRowKeys.length > 0 && (
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
          rowSelection={caseCreated ? undefined : {
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
