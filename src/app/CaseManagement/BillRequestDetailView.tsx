import { useState, useCallback } from "react";
import { App, Button, Input, InputNumber, Spin, Empty, Tag, Select, Table, Upload, Tooltip, DatePicker, Modal } from "antd";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiEdit2,
  FiEye,
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
  LuClock3,
  LuDownload,
} from "react-icons/lu";
import { FiDownload } from "react-icons/fi";
import { useNavigate, useParams } from "react-router";
import {
  useGetBillByIdAdminQuery,
  useGetAllOffersForBillQuery,
  useSendSelectedOffersMutation,
  useTransitionBillStatusMutation,
  type IOfferWithSavings,
  type IBill,
  type IBillFile,
} from "../../redux/features/Bills/billApi";
import {
  useGetCaseByIdQuery,
  useUpdateCaseMutation,
  useVerifyDocumentMutation,
  useUploadCaseDocumentMutation,
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
import { useAppSelector } from "../../redux/hooks";
import { server_url, server_origin } from "../../config";

/* ── Field Labels ───────────────────────────────────────── */

const FIELD_LABELS: Record<string, string> = {
  podNumber: "POD Number",
  pdrNumber: "PDR Number",
  totalAmount: "Total Amount",
  consumptionKwh: "Consumption (kWh)",
  consumptionSmc: "Consumption (Smc)",
  costPerUnit: "Cost Per Unit",
  fixedCharges: "Fixed Charges",
  taxes: "Taxes",
  billingPeriodStart: "Billing Period Start",
  billingPeriodEnd: "Billing Period End",
  supplyAddress: "Supply Address",
  codiceFiscale: "Codice Fiscale",
  partitaIva: "Partita IVA",
  contractNumber: "Contract Number",
  meterNumber: "Meter Number",
  customerName: "Customer Name",
  supplierName: "Supplier Name",
};

const FIELD_OPTIONS = Object.entries(FIELD_LABELS).map(([value, label]) => ({ value, label }));

/* ── Status & Step Configuration ─────────────────────────── */

const billStatusOrder = [
  "pending_email", "uploaded", "analyzing", "analyzed",
  "verification_review", "verification_required", "verified",
  "offer_sent", "offer_accepted",
  "contract_sent", "contract_signed", "contract_review", "contract_verification_required", "contract_verified",
  "awaiting_activation", "activated",
  "cancelled",
];

const stepConfig = [
  { label: "Upload & Analysis", statuses: ["pending_email", "uploaded", "analyzing", "analyzed"] },
  { label: "Verification", statuses: ["verification_review", "verification_required", "verified"] },
  { label: "Offers", statuses: ["offer_sent", "offer_accepted"] },
  { label: "Contract", statuses: ["contract_sent", "contract_signed", "contract_review", "contract_verification_required", "contract_verified"] },
  { label: "Activation", statuses: ["awaiting_activation", "activated"] },
];

const statusLabel: Record<string, string> = {
  pending_email: "Pending (Email)",
  uploaded: "Uploaded",
  analyzing: "Analyzing",
  analyzed: "Analyzed",
  error: "Error",
  verification_review: "Verification Review",
  verification_required: "Verification Required",
  verified: "Verified",
  offer_sent: "Offer Sent",
  offer_accepted: "Offer Accepted",
  contract_sent: "Contract Sent",
  contract_signed: "Contract Signed",
  contract_review: "Contract Review",
  contract_verification_required: "Contract Verification Required",
  contract_verified: "Contract Verified",
  awaiting_activation: "Awaiting Activation",
  activated: "Activated",
  cancelled: "Cancelled",
};

const statusTagColor: Record<string, string> = {
  pending_email: "purple",
  uploaded: "blue",
  analyzing: "orange",
  analyzed: "green",
  error: "red",
  verification_review: "gold",
  verification_required: "volcano",
  verified: "green",
  offer_sent: "cyan",
  offer_accepted: "purple",
  contract_sent: "gold",
  contract_signed: "orange",
  contract_review: "gold",
  contract_verification_required: "volcano",
  contract_verified: "green",
  awaiting_activation: "processing",
  activated: "green",
  cancelled: "default",
};

/* ── Helpers ──────────────────────────────────────────────── */

function getStepIndex(billStatus: string): number {
  for (let i = 0; i < stepConfig.length; i++) {
    if (stepConfig[i].statuses.includes(billStatus)) return i;
  }
  return -1;
}

function getStepStates(billStatus: string): ("done" | "current" | "pending")[] {
  const currentStep = getStepIndex(billStatus);
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

const fmt = (val: number | null | undefined, decimals = 2): string | null =>
  val != null ? `€ ${Number(val).toFixed(decimals)}` : null;

const fmtNum = (val: number | null | undefined, unit = ""): string | null =>
  val != null
    ? `${Number(val).toLocaleString("it-IT", { maximumFractionDigits: 2 })} ${unit}`.trim()
    : null;

/* ── Tab definitions ─────────────────────────────────────── */

const tabKeys = [
  { key: "overview", label: "Overview" },
  { key: "available_offers", label: "Offers" },
  { key: "bill_data", label: "Bill Data" },
  { key: "verification", label: "Verification" },
  { key: "case_details", label: "Case Details" },
] as const;

/* ── Main Component ──────────────────────────────────────── */

const BillRequestDetailView = () => {
  const { message, notification } = App.useApp();
  const navigate = useNavigate();
  const { billId } = useParams();
  const {
    data: bill,
    isLoading,
    refetch,
  } = useGetBillByIdAdminQuery(billId!, { skip: !billId });
  const { data: allOffers, isLoading: offersLoading } = useGetAllOffersForBillQuery(billId!, {
    skip: !billId || bill?.status === "pending_email",
  });
  const [sendSelectedOffers, { isLoading: isSending }] = useSendSelectedOffersMutation();
  const [transitionBillStatus] = useTransitionBillStatusMutation();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [savingsOverrides, setSavingsOverrides] = useState<Record<string, number>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showContractVerificationModal, setShowContractVerificationModal] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationFields, setVerificationFields] = useState<string[]>([]);
  const [requireReupload, setRequireReupload] = useState(false);

  const handleTransition = async (targetStatus: string) => {
    setIsTransitioning(true);
    try {
      await transitionBillStatus({ billId: bill.id, targetStatus }).unwrap();
      message.success(`Status updated to ${statusLabel[targetStatus] || targetStatus}`);
      refetch();
    } catch (err: any) {
      message.error(err?.data?.message?.[0] || err?.data?.message || "Failed to update status");
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleSendVerificationRequest = async (isContract = false) => {
    if (!verificationMessage.trim()) {
      message.warning("Please enter a message");
      return;
    }
    setIsTransitioning(true);
    try {
      await transitionBillStatus({
        billId: bill.id,
        targetStatus: isContract ? "contract_verification_required" : "verification_required",
        message: verificationMessage,
        missingFields: verificationFields,
        requireReupload,
      }).unwrap();
      message.success("Verification request sent");
      setShowVerificationModal(false);
      setShowContractVerificationModal(false);
      setVerificationMessage("");
      setVerificationFields([]);
      setRequireReupload(false);
      refetch();
    } catch (err: any) {
      message.error(err?.data?.message?.[0] || err?.data?.message || "Failed to send request");
    } finally {
      setIsTransitioning(false);
    }
  };

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
  const activeCase = bill.switchCases?.length
    ? [...bill.switchCases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;
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

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Current Status</h3>
              <Tag color={statusTagColor[bill.status]} className="rounded-full! px-4! py-1! text-sm! font-semibold! border-0!">
                {statusLabel[bill.status] || bill.status}
              </Tag>
              <p className="text-sm text-slate-500 mt-2">
                {bill.status === "verification_review" && "Review the extracted bill data. Approve or request corrections from the user."}
                {bill.status === "verified" && "Bill data verified. You can now send offers to the user."}
                {bill.status === "offer_sent" && "Offers have been sent. Waiting for the user to select an offer."}
                {bill.status === "offer_accepted" && "User has accepted an offer. Create and send the contract."}
                {bill.status === "contract_sent" && "Contract sent to user. Waiting for signed contract."}
                {bill.status === "contract_signed" && "User signed the contract. It's now in review."}
                {bill.status === "contract_review" && "Review the signed contract. Approve or request corrections."}
                {bill.status === "contract_verified" && "Contract approved. Move to awaiting activation."}
                {bill.status === "awaiting_activation" && "Waiting for supplier activation. Mark as activated when ready."}
                {bill.status === "activated" && "Utility is activated and live."}
                {bill.status === "analyzing" && "Bill is being analyzed by the system."}
                {bill.status === "analyzed" && "Analysis complete. Moving to verification review."}
                {bill.status === "verification_required" && "Waiting for user to provide requested information."}
                {bill.status === "contract_verification_required" && "Waiting for user to re-submit corrected contract."}
              </p>
            </div>

            {/* Contextual Admin Actions */}
            {["verification_review", "verified", "offer_accepted", "contract_review", "contract_verified", "awaiting_activation"].includes(bill.status) && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Actions</h3>
                <div className="flex flex-wrap gap-3">
                  {bill.status === "verification_review" && (
                    <>
                      <Button
                        type="primary"
                        icon={<FiCheck />}
                        loading={isTransitioning}
                        onClick={() => handleTransition("verified")}
                        className="bg-emerald-500 hover:bg-emerald-600 border-0"
                      >
                        Approve — Mark Verified
                      </Button>
                      <Button
                        danger
                        icon={<FiSend />}
                        onClick={() => setShowVerificationModal(true)}
                      >
                        Request Corrections
                      </Button>
                    </>
                  )}
                  {bill.status === "verified" && (
                    <Button
                      type="primary"
                      icon={<FiSend />}
                      onClick={() => setActiveTab("available_offers")}
                    >
                      Send Offers
                    </Button>
                  )}
                  {bill.status === "offer_accepted" && (
                    <Button
                      type="primary"
                      icon={<FiSend />}
                      onClick={() => setActiveTab("case_details")}
                    >
                      Create & Send Contract
                    </Button>
                  )}
                  {bill.status === "contract_review" && (
                    <>
                      <Button
                        type="primary"
                        icon={<FiCheck />}
                        loading={isTransitioning}
                        onClick={() => handleTransition("contract_verified")}
                        className="bg-emerald-500 hover:bg-emerald-600 border-0"
                      >
                        Approve Contract
                      </Button>
                      <Button
                        danger
                        icon={<FiSend />}
                        onClick={() => setShowContractVerificationModal(true)}
                      >
                        Request Re-submission
                      </Button>
                    </>
                  )}
                  {bill.status === "contract_verified" && (
                    <Button
                      type="primary"
                      icon={<FiCheckCircle />}
                      loading={isTransitioning}
                      onClick={() => handleTransition("awaiting_activation")}
                    >
                      Move to Awaiting Activation
                    </Button>
                  )}
                  {bill.status === "awaiting_activation" && (
                    <Button
                      type="primary"
                      icon={<FiCheckCircle />}
                      loading={isTransitioning}
                      onClick={() => handleTransition("activated")}
                      className="bg-emerald-500 hover:bg-emerald-600 border-0"
                    >
                      Activate Utility
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Activated success banner */}
            {bill.status === "activated" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-3">
                <FiCheckCircle className="text-emerald-500 h-6 w-6 flex-shrink-0" />
                <div>
                  <p className="text-emerald-700 font-semibold">Utility Activated</p>
                  <p className="text-emerald-600 text-sm">This utility has been successfully activated.</p>
                </div>
              </div>
            )}

            {/* Case info section (visible from offer_accepted onward) */}
            {activeCase && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Case Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Case Number</span>
                    <p className="font-semibold text-slate-700">{activeCase.caseNumber || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Type</span>
                    <p className="font-semibold text-slate-700 capitalize">{activeCase.caseType || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Priority</span>
                    <p className="font-semibold text-slate-700 capitalize">{activeCase.priority || "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
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
            caseCreated={!!activeCase && !["cancelled", "rejected"].includes(activeCase.status)}
            userSelectedOfferId={activeCase?.selectedOfferId ?? null}
          />
        );
      case "bill_data":
        return <BillDataTab bill={bill} />;
      case "verification":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-700">Verification History</h3>
              {bill.status === "verification_review" && bill.verifications?.some((v: any) => v.status === "submitted") && (
                <Button danger size="small" onClick={() => setShowVerificationModal(true)}>
                  Request Further Corrections
                </Button>
              )}
            </div>
            {bill.verifications && bill.verifications.length > 0 ? (
              [...bill.verifications].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((v: any, idx: number) => (
                <div key={v.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Round header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Round {idx + 1}</span>
                      <Tag color={v.status === "pending" ? "orange" : v.status === "submitted" ? "blue" : "green"} className="rounded-full! border-0! text-xs!">
                        {v.status === "pending" ? "AWAITING USER" : v.status === "submitted" ? "USER RESPONDED" : "RESOLVED"}
                      </Tag>
                    </div>
                    <span className="text-xs text-slate-400">{fmtDate(v.createdAt)}</span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Admin request */}
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                        <FiSend className="h-3 w-3" /> Admin Request
                      </p>
                      <p className="text-sm text-slate-700 mb-3">{v.adminMessage}</p>

                      <div className="flex flex-wrap gap-3">
                        {v.missingFields?.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Missing Fields</p>
                            <div className="flex flex-wrap gap-1">
                              {v.missingFields.map((f: string) => (
                                <Tag key={f} color="volcano" className="text-xs!">{FIELD_LABELS[f] || f}</Tag>
                              ))}
                            </div>
                          </div>
                        )}
                        {v.requireReupload && (
                          <div>
                            <Tag color="red" className="text-xs!">Re-upload Required</Tag>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User response */}
                    {v.status !== "pending" && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                          <LuMessageSquare className="h-3 w-3" /> User Response
                        </p>

                        {v.userMessage && (
                          <p className="text-sm text-slate-700 mb-3">{v.userMessage}</p>
                        )}

                        {v.userData && Object.keys(v.userData).length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-slate-400 mb-1">Submitted Data</p>
                            <div className="bg-white rounded-lg border border-blue-100 divide-y divide-blue-50">
                              {Object.entries(v.userData).map(([key, value]) => (
                                <div key={key} className="flex justify-between px-3 py-2 text-sm">
                                  <span className="text-slate-500">{FIELD_LABELS[key] || key}</span>
                                  <span className="text-slate-800 font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {v.files && v.files.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Uploaded Documents ({v.files.length})</p>
                            <div className="space-y-1">
                              {v.files.map((f: any) => (
                                <div key={f.id} className="flex items-center justify-between bg-white rounded-lg border border-blue-100 px-3 py-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {f.mimeType?.startsWith("image/") ? (
                                      <LuScanLine className="h-4 w-4 text-indigo-500 shrink-0" />
                                    ) : (
                                      <FiFileText className="h-4 w-4 text-red-500 shrink-0" />
                                    )}
                                    <span className="text-sm text-slate-700 truncate">{f.originalName || f.fileUrl.split("/").pop()}</span>
                                    {f.fileSize && <span className="text-xs text-slate-400 shrink-0">{(f.fileSize / 1024).toFixed(0)} KB</span>}
                                  </div>
                                  <a
                                    href={`${server_origin}${f.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 shrink-0 ml-2"
                                  >
                                    <FiEye className="h-3 w-3" /> View
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!v.userMessage && (!v.userData || Object.keys(v.userData).length === 0) && (!v.files || v.files.length === 0) && (
                          <p className="text-sm text-slate-400 italic">No details submitted by user.</p>
                        )}
                      </div>
                    )}

                    {v.resolvedAt && (
                      <p className="text-xs text-slate-400">Resolved: {fmtDate(v.resolvedAt)}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <Empty description="No verification history" />
            )}
          </div>
        );
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

          <div className="pb-2" />
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

      {/* Verification Request Modal */}
      <Modal
        title="Request Verification from User"
        open={showVerificationModal}
        onCancel={() => { setShowVerificationModal(false); setVerificationMessage(""); setVerificationFields([]); setRequireReupload(false); }}
        onOk={() => handleSendVerificationRequest(false)}
        confirmLoading={isTransitioning}
        okText="Send Request"
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Message to User *</label>
            <Input.TextArea
              rows={3}
              value={verificationMessage}
              onChange={(e) => setVerificationMessage(e.target.value)}
              placeholder="Explain what information is missing or incorrect..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Missing Fields</label>
            <Select
              mode="multiple"
              className="w-full mt-1"
              value={verificationFields}
              onChange={setVerificationFields}
              placeholder="Select fields that need correction"
              options={FIELD_OPTIONS}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={requireReupload}
              onChange={(e) => setRequireReupload(e.target.checked)}
              id="requireReupload"
            />
            <label htmlFor="requireReupload" className="text-sm text-slate-700">Require document re-upload</label>
          </div>
        </div>
      </Modal>

      {/* Contract Verification Request Modal */}
      <Modal
        title="Request Contract Re-submission"
        open={showContractVerificationModal}
        onCancel={() => { setShowContractVerificationModal(false); setVerificationMessage(""); setVerificationFields([]); setRequireReupload(false); }}
        onOk={() => handleSendVerificationRequest(true)}
        confirmLoading={isTransitioning}
        okText="Send Request"
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Message to User *</label>
            <Input.TextArea
              rows={3}
              value={verificationMessage}
              onChange={(e) => setVerificationMessage(e.target.value)}
              placeholder="Explain what needs to be corrected in the contract..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Missing Fields</label>
            <Select
              mode="multiple"
              className="w-full mt-1"
              value={verificationFields}
              onChange={setVerificationFields}
              placeholder="Select fields that need correction"
              options={FIELD_OPTIONS}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={requireReupload}
              onChange={(e) => setRequireReupload(e.target.checked)}
              id="contractRequireReupload"
            />
            <label htmlFor="contractRequireReupload" className="text-sm text-slate-700">Require document re-upload</label>
          </div>
        </div>
      </Modal>
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
  caseCreated,
  userSelectedOfferId,
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
  caseCreated: boolean;
  userSelectedOfferId: string | null;
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
    {
      title: "",
      key: "sentStatus",
      width: 120,
      render: (_, record) => (
        <div className="flex flex-col items-center gap-1">
          {record.id === userSelectedOfferId && (
            <Tag color="purple" className="border-0! rounded-full! text-[10px]! font-bold! m-0!">
              User Selected
            </Tag>
          )}
          {record.isSent && record.id !== userSelectedOfferId && (
            <Tag color="green" className="border-0! rounded-full! text-[10px]! font-bold! m-0!">
              Already Sent
            </Tag>
          )}
        </div>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Pending email banner */}
      {billStatus === "pending_email" && (
        <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-3">
          <p className="text-sm font-semibold text-purple-800">
            This bill was submitted via email and is awaiting document upload.
          </p>
          <p className="text-xs text-purple-600 mt-0.5">
            Upload the bill document through the OCR tab before sending offers.
          </p>
        </div>
      )}

      {/* Case created banner */}
      {caseCreated && (
        <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-3">
          <p className="text-sm font-semibold text-purple-800">
            User has accepted an offer and a case has been created.
          </p>
          <p className="text-xs text-purple-600 mt-0.5">
            No more offers can be sent for this bill. The user-selected offer is highlighted below.
          </p>
        </div>
      )}

      {/* Send action bar */}
      {!caseCreated && billStatus !== "pending_email" && selectedRowKeys.length > 0 && (
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

      {!caseCreated && (() => {
        const sentCount = offers.filter((o) => o.isSent).length;
        if (billStatus === "offer_sent" || sentCount > 0) {
          return (
            <div className="rounded-lg bg-cyan-50 px-3 py-2">
              <p className="text-xs text-cyan-700">
                {sentCount > 0
                  ? `${sentCount} offer${sentCount > 1 ? "s" : ""} already sent to user. You can still select and send additional offers.`
                  : "Offers have already been sent for this bill. You can still select and send additional offers."}
              </p>
            </div>
          );
        }
        return null;
      })()}

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
              {(() => {
                const sentCount = offers.filter((o) => o.isSent).length;
                return sentCount > 0 ? (
                  <span className="text-slate-400 font-normal ml-1">
                    ({sentCount} already sent)
                  </span>
                ) : null;
              })()}
            </h4>
          </div>
          <Table<IOfferWithSavings>
            rowKey="id"
            columns={columns}
            dataSource={offers}
            size="small"
            pagination={offers.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
            scroll={{ x: 900 }}
            rowSelection={caseCreated || billStatus === "pending_email" ? undefined : {
              type: "checkbox",
              selectedRowKeys,
              onChange: onSelectionChange,
              getCheckboxProps: (record: IOfferWithSavings) => ({
                disabled: record.isSent === true,
              }),
            }}
            rowClassName={(record) =>
              record.id === userSelectedOfferId ? "bg-purple-50/70" : ""
            }
            className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:text-[10px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-row]:hover:bg-slate-50/30 [&_.ant-table-cell]:py-3"
          />
        </>
      )}
    </div>
  );
}

/* ── Bill Data Tab ──────────────────────────────────────── */

function BillDataTab({ bill }: { bill: IBill }) {
  const isElectricity = bill.billType === "electricity";
  const token = useAppSelector((state) => state.auth.token);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"pdf" | "image" | "other">("other");

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

  const handleView = async (bf: IBillFile) => {
    setPreviewLoading(bf.id);
    try {
      const url = `${server_url}bills/${bill.id}/files/${bf.id}`;
      const blob = await fetchFileBlobByUrl(url);
      setPreviewType(detectFileType(blob, bf.fileUrl));
      const objUrl = URL.createObjectURL(blob);
      setPreviewUrl(objUrl);
      setPreviewOpen(true);
    } catch {
      message.error("Failed to load document");
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleDownload = async (bf: IBillFile) => {
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

  const handleClosePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const groups = [
    {
      title: "Bill Overview",
      rows: [
        {
          label: "Bill Type",
          value: (
            <Tag color={isElectricity ? "blue" : "orange"} className="m-0!">
              <span className="flex items-center gap-1">
                {isElectricity ? <LuZap className="h-3 w-3" /> : <LuFlame className="h-3 w-3" />}
                {isElectricity ? "Electricity" : "Gas"}
              </span>
            </Tag>
          ),
        },
        {
          label: "Status",
          value: (
            <Tag color={statusTagColor[bill.status] || "default"} className="m-0!">
              {statusLabel[bill.status] || bill.status}
            </Tag>
          ),
        },
        { label: "Upload Date", value: fmtDate(bill.createdAt) },
        { label: "Last Updated", value: fmtDate(bill.updatedAt) },
        {
          label: `Uploaded Documents${billFiles.length > 0 ? ` (${billFiles.length})` : ""}`,
          value: billFiles.length > 0 ? (
            <div className="space-y-2">
              {billFiles.map((bf, idx) => (
                <div key={bf.id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono w-4">{idx + 1}.</span>
                  <span className="text-xs text-slate-600 truncate max-w-[120px]">
                    {bf.originalName || bf.fileUrl.split("/").pop()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleView(bf)}
                    disabled={previewLoading === bf.id}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                  >
                    <FiEye className="h-3 w-3" />
                    {previewLoading === bf.id ? "..." : "View"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(bf)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
                  >
                    <LuDownload className="h-3 w-3" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : bill.fileUrl ? (
            <span className="text-xs text-slate-500">1 file (legacy)</span>
          ) : "—",
        },
      ],
    },
    {
      title: "Financial Breakdown",
      rows: [
        { label: "Total Amount", value: fmt(bill.totalAmount) },
        {
          label: "Cost per Unit",
          value: bill.costPerUnit != null ? `€ ${Number(bill.costPerUnit).toFixed(6)}` : null,
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
              : null,
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
            : bill.customerName || null,
        },
        { label: "Email", value: bill.user?.email || null },
        { label: "Supply Address", value: bill.supplyAddress || null },
        { label: "Codice Fiscale", value: bill.codiceFiscale || null },
        { label: "Partita IVA", value: bill.partitaIva || null },
      ],
    },
    {
      title: "Supply Details",
      rows: [
        { label: "Supplier", value: bill.supplierName || bill.supplier?.name || (bill.rawAnalysisData?.ocrSupplierName as string) || null },
        { label: isElectricity ? "POD Number" : "PDR Number", value: (isElectricity ? bill.podNumber : bill.pdrNumber) || null },
        ...(isElectricity && bill.pdrNumber ? [{ label: "PDR Number", value: bill.pdrNumber }] : []),
        ...(!isElectricity && bill.podNumber ? [{ label: "POD Number", value: bill.podNumber }] : []),
        { label: "Contract Number", value: bill.contractNumber || null },
        { label: "Meter Number", value: bill.meterNumber || null },
        ...(bill.meterId ? [{ label: "Meter ID", value: bill.meterId }] : []),
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
                {r.value ? (
                  <div className="text-sm font-medium text-slate-700 mt-0.5">{r.value}</div>
                ) : (
                  <p className="text-xs italic text-amber-500 mt-0.5">Not found in document</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Document Preview Modal */}
      <Modal
        open={previewOpen}
        onCancel={handleClosePreview}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleClosePreview}>Close</Button>
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
        {previewUrl && (
          <div className="flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden" style={{ minHeight: 500 }}>
            {previewType === "pdf" ? (
              <iframe
                src={previewUrl}
                title="Bill Document"
                className="w-full border-0 rounded-lg"
                style={{ height: 600 }}
              />
            ) : previewType === "image" ? (
              <img
                src={previewUrl}
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
        return <CaseDocumentsSection documents={caseData.documents || []} caseId={caseData.id} />;
      case "contract":
        return <CaseContractSection caseData={caseData} />;
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

const IDENTITY_DOC_TYPES = ["id_card", "codice_fiscale", "partita_iva"];

function CaseDocumentsSection({ documents, caseId }: { documents: ICaseDocument[]; caseId: string }) {
  const token = useAppSelector((state) => state.auth.token);
  const [verifyDocument, { isLoading: isVerifying }] = useVerifyDocumentMutation();
  const [uploadCaseDocument] = useUploadCaseDocumentMutation();
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("id_card");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ICaseDocument | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchDocBlob = useCallback(async (doc: ICaseDocument) => {
    const url = `${server_url}cases/${caseId}/documents/${doc.id}/file`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch document");
    return res.blob();
  }, [caseId, token]);

  const handleView = async (doc: ICaseDocument) => {
    setLoadingId(doc.id);
    try {
      const blob = await fetchDocBlob(doc);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewDoc(doc);
      setPreviewOpen(true);
    } catch {
      message.error("Failed to load document");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDownload = async (doc: ICaseDocument) => {
    try {
      const blob = await fetchDocBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      message.error("Failed to download document");
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewDoc(null);
  };

  const handleVerify = async (docId: string) => {
    try {
      await verifyDocument({ caseId, docId }).unwrap();
      message.success("Document verified");
    } catch {
      message.error("Failed to verify document");
    }
  };

  const handleMultiUpload = async (fileList: File[]) => {
    setUploading(true);
    let successCount = 0;
    for (const file of fileList) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${server_origin}/api/v1/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const result = await res.json();
        const url = result?.data?.url || result?.url;
        if (res.ok && url) {
          await uploadCaseDocument({
            caseId,
            documentType: selectedDocType,
            fileUrl: url,
            fileName: file.name,
          }).unwrap();
          successCount++;
        }
      } catch {
        // continue with remaining files
      }
    }
    setUploading(false);
    if (successCount > 0) {
      message.success(`${successCount} document(s) uploaded successfully`);
    } else {
      message.error("Failed to upload documents");
    }
  };

  const isPdf = (doc: ICaseDocument) => doc.mimeType === "application/pdf" || doc.fileName.endsWith(".pdf");
  const isImage = (doc: ICaseDocument) => doc.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png)$/i.test(doc.fileName);

  const identityDocs = documents.filter((d) => IDENTITY_DOC_TYPES.includes(d.documentType));
  const otherDocs = documents.filter((d) => !IDENTITY_DOC_TYPES.includes(d.documentType));
  const allVerified = identityDocs.length > 0 && identityDocs.every((d) => d.verified);

  const renderDocRow = (doc: ICaseDocument, isIdentity: boolean) => (
    <div
      key={doc.id}
      className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/50"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isIdentity ? (doc.verified ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500") : "bg-blue-50 text-blue-500"}`}>
          <FiFileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">{doc.fileName}</p>
          <p className="text-xs text-slate-400 capitalize">
            {doc.documentType?.replace("_", " ")}
            {doc.fileSizeBytes != null && ` • ${(doc.fileSizeBytes / 1024 / 1024).toFixed(1)} MB`}
            {doc.uploadedBy && ` • by ${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`}
          </p>
          {doc.verified && doc.verifiedAt && (
            <p className="text-[10px] text-emerald-500 mt-0.5">
              Verified on {new Date(doc.verifiedAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleView(doc)}
          disabled={loadingId === doc.id}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
        >
          <FiEye className="h-3.5 w-3.5" />
          {loadingId === doc.id ? "..." : "View"}
        </button>
        <button
          type="button"
          onClick={() => handleDownload(doc)}
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
        >
          <FiDownload className="h-3.5 w-3.5" />
          Download
        </button>
        {isIdentity && !doc.verified ? (
          <Button
            size="small"
            type="primary"
            loading={isVerifying}
            onClick={() => handleVerify(doc.id)}
            className="h-7 rounded-lg bg-emerald-500! hover:bg-emerald-600! border-0! text-xs! font-semibold!"
            icon={<FiCheck className="h-3 w-3" />}
          >
            Verify
          </Button>
        ) : (
          <Tag
            color={doc.verified ? "green" : "default"}
            className="m-0! rounded-full! border-0! text-xs!"
          >
            {doc.verified ? "Verified" : "Pending"}
          </Tag>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Identity Verification Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-800">Identity Verification</h4>
              <Tag
                color={identityDocs.length === 0 ? "red" : allVerified ? "green" : "orange"}
                className="m-0! rounded-full! border-0! text-xs! font-semibold!"
              >
                {identityDocs.length === 0 ? "Not Uploaded" : allVerified ? "Verified" : "Pending Review"}
              </Tag>
            </div>
            {identityDocs.length > 0 && (
              <span className="text-xs text-slate-400">
                {identityDocs.filter((d) => d.verified).length}/{identityDocs.length} verified
              </span>
            )}
          </div>

          {identityDocs.length > 0 && (
            <div className="space-y-3 mb-4">
              {identityDocs.map((doc) => renderDocRow(doc, true))}
            </div>
          )}

          {/* Admin Upload Identity Documents */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                size="small"
                value={selectedDocType}
                onChange={setSelectedDocType}
                className="w-40 [&_.ant-select-selector]:rounded-lg!"
                options={[
                  { value: "id_card", label: "ID Card" },
                  { value: "codice_fiscale", label: "Codice Fiscale" },
                  { value: "partita_iva", label: "Partita IVA" },
                ]}
              />
              <Upload
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                multiple
                showUploadList={false}
                beforeUpload={(_file, fileList) => {
                  handleMultiUpload(fileList as unknown as File[]);
                  return false;
                }}
              >
                <Button
                  icon={<LuUpload className="h-4 w-4" />}
                  loading={uploading}
                  className="h-8 rounded-lg text-xs!"
                >
                  Upload Identity Documents
                </Button>
              </Upload>
              <span className="text-xs text-slate-400">PDF, JPG, PNG, WebP — select multiple files</span>
            </div>
          </div>
        </div>

        {/* Other Documents Section */}
        {otherDocs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Other Documents</h4>
            <div className="space-y-3">
              {otherDocs.map((doc) => renderDocRow(doc, false))}
            </div>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      <Modal
        open={previewOpen}
        onCancel={handleClosePreview}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleClosePreview}>Close</Button>
            {previewDoc && (
              <Button
                type="primary"
                icon={<FiDownload className="h-3.5 w-3.5" />}
                onClick={() => handleDownload(previewDoc)}
                className="bg-emerald-500! hover:bg-emerald-600! border-0!"
              >
                Download
              </Button>
            )}
          </div>
        }
        title={
          <span className="flex items-center gap-2">
            <FiFileText className="h-4 w-4 text-indigo-500" />
            {previewDoc?.fileName || "Document"}
          </span>
        }
        width={900}
        centered
        destroyOnClose
      >
        {previewUrl && previewDoc && (
          <div className="flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden" style={{ minHeight: 500 }}>
            {isPdf(previewDoc) ? (
              <iframe
                src={previewUrl}
                title="Document Preview"
                className="w-full border-0 rounded-lg"
                style={{ height: 600 }}
              />
            ) : isImage(previewDoc) ? (
              <img
                src={previewUrl}
                alt={previewDoc.fileName}
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
    </>
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
                href={contract.documentUrl.startsWith("http") ? contract.documentUrl : `${server_origin}/${contract.documentUrl.replace(/^\//, "")}`}
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
                href={contract.signedDocumentUrl.startsWith("http") ? contract.signedDocumentUrl : `${server_origin}/${contract.signedDocumentUrl.replace(/^\//, "")}`}
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
              onClick={async () => {
                if (!deliveryMethod) return;
                try {
                  await updateContract({
                    id: contract.id,
                    data: { status: "sent", deliveryMethod },
                  }).unwrap();
                  message.success("Contract sent to customer");
                } catch {
                  message.error("Failed to send contract");
                }
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
