import { useState, useCallback } from "react";
import { App, Button, Input, InputNumber, Spin, Empty, Tag, Select, Table, Upload, Tooltip, DatePicker, Modal, message } from "antd";
import dayjs, { type Dayjs } from "dayjs";
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
  useGetBillNotesQuery,
  useAddBillNoteMutation,
  useUpdateBillNoteMutation,
  useDeleteBillNoteMutation,
  type IOfferWithSavings,
  type IBill,
  type IBillFile,
} from "../../redux/features/Bills/billApi";
import { PAYMENT_METHOD_LABELS } from "../../redux/features/Offers/offerApi";
import {
  useGetCaseByIdQuery,
  useUpdateCaseMutation,
  useVerifyDocumentMutation,
  useUploadCaseDocumentMutation,
  type ICase,
  type ICaseEvent,
  type ICaseDocument,
} from "../../redux/features/Cases/caseApi";
import { useAppSelector } from "../../redux/hooks";
import { server_url, server_origin } from "../../config";
import EditBillModal from "./EditBillModal";
import VerificationFileList from "./VerificationFileList";

/* ── Status & Step Configuration ─────────────────────────── */

/**
 * Pipeline order, mirroring `PIPELINE_STATUS_ORDER` on the server. Used only to
 * work out whether a chosen status is ahead of or behind the current one —
 * the admin is free to pick any of them, in any order.
 */
const pipelineStatusOrder = [
  "uploaded", "analyzing", "analyzed",
  "verification_review", "verification_required", "verified",
  "offer_sent", "offer_accepted",
  "contract_sent",
  "awaiting_activation", "activated",
];

const stepConfig = [
  { label: "Upload & Analysis", statuses: ["pending_email", "uploaded", "analyzing", "analyzed"] },
  { label: "Verification", statuses: ["verification_review", "verification_required", "verified"] },
  { label: "Offers", statuses: ["offer_sent", "offer_accepted"] },
  { label: "Contract", statuses: ["contract_sent"] },
  { label: "In Activation", statuses: ["awaiting_activation"] },
  { label: "Activated", statuses: ["activated"] },
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
  awaiting_activation: "In Activation",
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
  awaiting_activation: "processing",
  activated: "green",
  cancelled: "default",
};

/* ── Status dropdown configuration ───────────────────────── */

/**
 * Every status the administrator can set, grouped by pipeline stage.
 * Selection is not restricted to the step order — any entry can be picked at
 * any time, which moves the case forward or backward.
 */
const statusGroups: { label: string; statuses: string[] }[] = [
  { label: "Upload & Analysis", statuses: ["uploaded", "analyzing", "analyzed"] },
  { label: "Verification", statuses: ["verification_review", "verification_required", "verified"] },
  { label: "Offers", statuses: ["offer_sent", "offer_accepted"] },
  { label: "Contract", statuses: ["contract_sent"] },
  { label: "Activation", statuses: ["awaiting_activation", "activated"] },
  { label: "Other", statuses: ["cancelled"] },
];

/**
 * System-managed states. They are never offered as a destination, but they are
 * listed when the case is currently sitting in one so it can be moved out.
 */
const systemOnlyStatuses = ["pending_email", "error"];

/** Statuses that carry a message to the customer and open the request modal. */
const statusesRequiringMessage = ["verification_required"];

/**
 * Statuses that cannot be set without the activation and expiry dates, and so
 * open the dates modal instead of transitioning straight away. The server
 * enforces the same rule.
 */
const statusesRequiringDates = ["awaiting_activation"];

const statusDotClass: Record<string, string> = {
  pending_email: "bg-purple-400",
  uploaded: "bg-blue-400",
  analyzing: "bg-orange-400",
  analyzed: "bg-emerald-400",
  error: "bg-red-500",
  verification_review: "bg-amber-400",
  verification_required: "bg-red-400",
  verified: "bg-emerald-500",
  offer_sent: "bg-cyan-400",
  offer_accepted: "bg-purple-400",
  contract_sent: "bg-amber-500",
  awaiting_activation: "bg-blue-500",
  activated: "bg-emerald-600",
  cancelled: "bg-slate-400",
};

/* ── Helpers ──────────────────────────────────────────────── */

function getStatusDirection(from: string, to: string): "forward" | "backward" | "lateral" {
  const fromIdx = pipelineStatusOrder.indexOf(from);
  const toIdx = pipelineStatusOrder.indexOf(to);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return "lateral";
  return toIdx > fromIdx ? "forward" : "backward";
}

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

/** Italian date format — what the admins and the customers both read. */
const fmtDateIt = (val: string | null | undefined) => {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
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

/* ── Case Status Dropdown ────────────────────────────────── */

/**
 * Replaces the old "Advance Status" button: every status is selectable, in any
 * order, so a case can be moved forward or backward. The current status is
 * shown in the closed control and flagged in the list.
 */
function CaseStatusSelect({
  currentStatus,
  onSelect,
  loading = false,
  size = "middle",
  className = "",
}: {
  currentStatus: string;
  onSelect: (status: string) => void;
  loading?: boolean;
  size?: "small" | "middle";
  className?: string;
}) {
  const buildOption = (status: string) => ({
    value: status,
    label: statusLabel[status] || status,
    // The case is already here — nothing to change.
    disabled: status === currentStatus,
  });

  const options = [
    // A system-managed status is only listed while the case is parked in it.
    ...(systemOnlyStatuses.includes(currentStatus)
      ? [{ label: "Current", options: [buildOption(currentStatus)] }]
      : []),
    ...statusGroups.map((group) => ({
      label: group.label,
      options: group.statuses.map(buildOption),
    })),
  ];

  return (
    <Select
      value={currentStatus}
      onChange={(value) => onSelect(value as string)}
      loading={loading}
      disabled={loading}
      size={size}
      listHeight={420}
      popupMatchSelectWidth={300}
      className={`min-w-[230px] ${className}`}
      options={options}
      labelRender={() => (
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass[currentStatus] || "bg-slate-300"}`}
          />
          <span className="font-semibold text-slate-700">
            {statusLabel[currentStatus] || currentStatus}
          </span>
        </span>
      )}
      optionRender={(option) => {
        const status = String(option.value);
        const isCurrent = status === currentStatus;
        const direction = getStatusDirection(currentStatus, status);
        return (
          <div className="flex items-center justify-between gap-3">
            <span
              className={`flex min-w-0 items-center gap-2 ${
                isCurrent ? "font-semibold text-slate-800" : "text-slate-600"
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass[status] || "bg-slate-300"}`}
              />
              <span className="truncate">{statusLabel[status] || status}</span>
            </span>
            {isCurrent ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#7061ED] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                <FiCheck className="h-2.5 w-2.5" />
                Current
              </span>
            ) : direction === "backward" ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Back
              </span>
            ) : null}
          </div>
        );
      }}
    />
  );
}

/* ── Contextual admin actions ────────────────────────────── */

/** The statuses that have something for the admin to do right now. */
const statusesWithActions = [
  "verification_review",
  "verified",
  "offer_accepted",
  "contract_sent",
  "awaiting_activation",
];

interface CaseActionsPanelProps {
  billStatus: string;
  isTransitioning: boolean;
  onTransition: (targetStatus: string) => void;
  onRequestCorrections: () => void;
  onMoveToActivation: () => void;
  onGoToOffers: () => void;
}

/**
 * The next step, offered as a button. Rendered on both the Overview and the
 * Bill Data tab — it lives here rather than inline so the two can never drift.
 */
function CaseActionsPanel({
  billStatus,
  isTransitioning,
  onTransition,
  onRequestCorrections,
  onMoveToActivation,
  onGoToOffers,
}: CaseActionsPanelProps) {
  if (!statusesWithActions.includes(billStatus)) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-bold text-slate-700 mb-4">Actions</h3>
      <div className="flex flex-wrap gap-3">
        {billStatus === "verification_review" && (
          <>
            <Button
              type="primary"
              icon={<FiCheck />}
              loading={isTransitioning}
              onClick={() => onTransition("verified")}
              className="bg-emerald-500 hover:bg-emerald-600 border-0"
            >
              Approve — Mark Verified
            </Button>
            <Button danger icon={<FiSend />} onClick={onRequestCorrections}>
              Request Corrections
            </Button>
          </>
        )}
        {billStatus === "verified" && (
          <Button type="primary" icon={<FiSend />} onClick={onGoToOffers}>
            Send Offers
          </Button>
        )}
        {billStatus === "offer_accepted" && (
          <Button
            type="primary"
            icon={<FiSend />}
            loading={isTransitioning}
            onClick={() => onTransition("contract_sent")}
          >
            Send Contract to Customer
          </Button>
        )}
        {billStatus === "contract_sent" && (
          <Button
            type="primary"
            icon={<FiCheckCircle />}
            loading={isTransitioning}
            onClick={onMoveToActivation}
          >
            Move to In Activation
          </Button>
        )}
        {billStatus === "awaiting_activation" && (
          <Button
            type="primary"
            icon={<FiCheckCircle />}
            loading={isTransitioning}
            onClick={() => onTransition("activated")}
            className="bg-emerald-500 hover:bg-emerald-600 border-0"
          >
            Activate Utility
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Tab definitions ─────────────────────────────────────── */

const tabKeys = [
  { key: "overview", label: "Overview" },
  { key: "available_offers", label: "Offers" },
  { key: "bill_data", label: "Bill Data" },
  { key: "verification", label: "Verification" },
  { key: "notes", label: "Notes" },
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
  } = useGetBillByIdAdminQuery(billId!, { skip: !billId, refetchOnMountOrArgChange: true });
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
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationEditOpen, setVerificationEditOpen] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationDate, setActivationDate] = useState<Dayjs | null>(null);
  const [expiryDate, setExpiryDate] = useState<Dayjs | null>(null);

  const handleTransition = async (
    targetStatus: string,
    dates?: { activationDate: string; expiryDate: string },
  ) => {
    if (!bill) return;
    const previousStatus = bill.status;
    setIsTransitioning(true);
    try {
      await transitionBillStatus({ billId: bill.id, targetStatus, ...dates }).unwrap();
      const movedBack = getStatusDirection(previousStatus, targetStatus) === "backward";
      message.success(
        `${movedBack ? "Status moved back to" : "Status updated to"} "${
          statusLabel[targetStatus] || targetStatus
        }" — the customer has been notified.`,
      );
      refetch();
    } catch (err: any) {
      message.error(err?.data?.message?.[0] || err?.data?.message || "Failed to update status");
    } finally {
      setIsTransitioning(false);
    }
  };

  /**
   * Applies a status chosen from the dropdown. Any status can be picked, in any
   * order — except the two that cannot be applied on their own: a verification
   * request needs a message for the customer, and In Activation needs the dates
   * the supplier gave us. Both open a modal instead.
   */
  const handleStatusSelect = (targetStatus: string) => {
    if (!bill || targetStatus === bill.status) return;

    if (statusesRequiringMessage.includes(targetStatus)) {
      setShowVerificationModal(true);
      return;
    }

    if (statusesRequiringDates.includes(targetStatus)) {
      openActivationModal();
      return;
    }

    handleTransition(targetStatus);
  };

  /** Pre-fills with whatever the case already carries, so a re-run is an edit. */
  const openActivationModal = () => {
    setActivationDate(activeCase?.activationDate ? dayjs(activeCase.activationDate) : null);
    setExpiryDate(activeCase?.expiryDate ? dayjs(activeCase.expiryDate) : null);
    setShowActivationModal(true);
  };

  const handleMoveToActivation = async () => {
    if (!activationDate || !expiryDate) return;
    await handleTransition("awaiting_activation", {
      activationDate: activationDate.format("YYYY-MM-DD"),
      expiryDate: expiryDate.format("YYYY-MM-DD"),
    });
    setShowActivationModal(false);
  };

  const handleSendVerificationRequest = async () => {
    if (!bill) return;
    if (!verificationMessage.trim()) {
      message.warning("Please enter a message");
      return;
    }
    setIsTransitioning(true);
    try {
      await transitionBillStatus({
        billId: bill.id,
        targetStatus: "verification_required",
        message: verificationMessage,
      }).unwrap();
      message.success("Verification request sent");
      setShowVerificationModal(false);
      setVerificationMessage("");
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
                {bill.status === "offer_accepted" && "User has accepted an offer. Send them the contract."}
                {bill.status === "contract_sent" && "The customer is signing with the supplier. Move to In Activation once the supplier confirms."}
                {bill.status === "awaiting_activation" && "Utility is in activation. Mark as activated when ready."}
                {bill.status === "activated" && "Utility is activated and live."}
                {bill.status === "analyzing" && "Bill is being analyzed by the system."}
                {bill.status === "analyzed" && "Analysis complete. Moving to verification review."}
                {bill.status === "verification_required" && "Waiting for user to provide requested information."}
              </p>
            </div>

            <CaseActionsPanel
              billStatus={bill.status}
              isTransitioning={isTransitioning}
              onTransition={handleTransition}
              onRequestCorrections={() => setShowVerificationModal(true)}
              onMoveToActivation={openActivationModal}
              onGoToOffers={() => setActiveTab("available_offers")}
            />

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
        return (
          <BillDataTab
            bill={bill}
            isTransitioning={isTransitioning}
            handleTransition={handleTransition}
            onRequestCorrections={() => setShowVerificationModal(true)}
            onMoveToActivation={openActivationModal}
            onGoToOffers={() => setActiveTab("available_offers")}
          />
        );
      case "verification":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-700">Verification History</h3>
              <div className="flex items-center gap-2">
                {/* The uploaded documents are never re-analysed — the admin reads
                    them here and writes the values in by hand. */}
                <Button
                  size="small"
                  icon={<FiEdit2 className="h-3 w-3" />}
                  onClick={() => setVerificationEditOpen(true)}
                >
                  Edit Bill Data
                </Button>
                {bill.status === "verification_review" && bill.verifications?.some((v: any) => v.status === "submitted") && (
                  <Button danger size="small" onClick={() => setShowVerificationModal(true)}>
                    Request Further Corrections
                  </Button>
                )}
              </div>
            </div>
            {bill.verifications && bill.verifications.length > 0 ? (
              [...bill.verifications].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((v: any, idx: number) => (
                <div key={v.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Round header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Round {idx + 1}</span>
                      {/* Contract requests are no longer created, but old rounds
                          are still in this list — say which kind each one was. */}
                      {v.type === "contract" && (
                        <Tag color="purple" className="rounded-full! border-0! text-xs!">
                          SIGNED CONTRACT
                        </Tag>
                      )}
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
                      <p className="text-sm text-slate-700">{v.adminMessage}</p>
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

                        {v.files && v.files.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Uploaded Documents ({v.files.length})</p>
                            <VerificationFileList billId={bill.id} files={v.files} />
                          </div>
                        )}

                        {!v.userMessage && (!v.files || v.files.length === 0) && (
                          <p className="text-sm text-slate-400 italic">No documents submitted by user.</p>
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
      case "notes":
        return <NotesTab billId={bill.id} />;
      case "case_details":
        return (
          <CaseDetailsTab
            caseId={activeCase?.id ?? null}
            billStatus={bill.status}
            onStatusSelect={handleStatusSelect}
            statusUpdating={isTransitioning}
          />
        );
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

          {/* ── Case status control ────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200/70 py-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Case status
              </span>
              <CaseStatusSelect
                currentStatus={bill.status}
                onSelect={handleStatusSelect}
                loading={isTransitioning}
              />
            </div>
            <span className="text-xs text-slate-400">
              Pick any status — forward or backward. The customer is notified of every change.
            </span>
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

      {/* Manual bill data edit, opened from the verification review */}
      <EditBillModal
        bill={bill}
        open={verificationEditOpen}
        onClose={() => setVerificationEditOpen(false)}
      />

      {/* Verification Request Modal */}
      <Modal
        title="Request Verification from User"
        open={showVerificationModal}
        onCancel={() => { setShowVerificationModal(false); setVerificationMessage(""); }}
        onOk={handleSendVerificationRequest}
        confirmLoading={isTransitioning}
        okText="Send Request"
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Message to User *</label>
            <Input.TextArea
              rows={4}
              value={verificationMessage}
              onChange={(e) => setVerificationMessage(e.target.value)}
              placeholder="Explain what the user needs to send you..."
            />
          </div>
          <p className="text-xs text-slate-400">
            The user will receive this message and can respond by uploading a document or taking a
            photo from the app.
          </p>
        </div>
      </Modal>

      {/* Move to In Activation — the dates come from the supplier, so they are
          collected here rather than stamped automatically. */}
      <Modal
        title="Move to In Activation"
        open={showActivationModal}
        onCancel={() => setShowActivationModal(false)}
        onOk={handleMoveToActivation}
        confirmLoading={isTransitioning}
        okText="Move to In Activation"
        okButtonProps={{ disabled: !activationDate || !expiryDate }}
      >
        <div className="space-y-4 mt-4">
          <p className="text-sm text-slate-500">
            The customer has signed with the supplier. Enter the dates the supplier confirmed —
            the customer sees them on their utility straight away.
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Activation Date *
            </label>
            <DatePicker
              className="w-full"
              value={activationDate}
              onChange={(d) => {
                setActivationDate(d);
                // An expiry that is no longer after the activation date would be
                // rejected by the server; drop it rather than submit it.
                if (d && expiryDate && !expiryDate.isAfter(d, "day")) setExpiryDate(null);
              }}
              format="DD/MM/YYYY"
              placeholder="Select activation date"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Expiry Date *</label>
            <DatePicker
              className="w-full"
              value={expiryDate}
              onChange={setExpiryDate}
              disabledDate={(d) => !!activationDate && !d.isAfter(activationDate, "day")}
              format="DD/MM/YYYY"
              placeholder="Select expiry date"
            />
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
      title: "COMPENSATION",
      key: "compensation",
      width: 150,
      render: (_, record) => (
        <span className="text-xs text-slate-600 line-clamp-2">{record.compensation || "—"}</span>
      ),
    },
    {
      title: "PAYMENT METHOD",
      key: "paymentMethod",
      width: 150,
      render: (_, record) => (
        <span className="text-xs text-slate-600">
          {PAYMENT_METHOD_LABELS[record.paymentMethod] || "—"}
        </span>
      ),
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

function BillDataTab({
  bill,
  isTransitioning,
  handleTransition,
  onRequestCorrections,
  onMoveToActivation,
  onGoToOffers,
}: {
  bill: IBill;
  isTransitioning: boolean;
  handleTransition: (status: string) => void;
  onRequestCorrections: () => void;
  onMoveToActivation: () => void;
  onGoToOffers: () => void;
}) {
  const isElectricity = bill.billType === "electricity";
  const token = useAppSelector((state) => state.auth.token);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"pdf" | "image" | "other">("other");

  const billFiles: IBillFile[] = bill.files ?? [];
  const originalFiles = billFiles.filter((f) => !f.verificationId);
  const reuploadedFiles = billFiles.filter((f) => !!f.verificationId);

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
            <div className="space-y-3">
              {/* Original Upload */}
              {originalFiles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Original Upload</p>
                  <div className="space-y-2">
                    {originalFiles.map((bf, idx) => (
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
                </div>
              )}

              {/* Re-uploaded Documents */}
              {reuploadedFiles.length > 0 && (
                <div>
                  {originalFiles.length > 0 && <div className="border-t border-slate-200 my-2" />}
                  <p className="text-xs font-semibold text-slate-500 mb-1">Re-uploaded Documents</p>
                  <div className="space-y-2">
                    {reuploadedFiles.map((bf, idx) => (
                      <div key={bf.id} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-mono w-4">{idx + 1}.</span>
                        <span className="text-xs text-slate-600 truncate max-w-[120px]">
                          {bf.originalName || bf.fileUrl.split("/").pop()}
                        </span>
                        <Tag color="blue" className="text-[10px]! leading-tight! px-1! py-0! m-0!">Re-upload</Tag>
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
                </div>
              )}
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
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">Bill Data</h4>
        <Button
          type="primary"
          size="small"
          icon={<FiEdit2 className="h-3 w-3" />}
          onClick={() => setEditOpen(true)}
        >
          Edit Bill Data
        </Button>
      </div>

      <CaseActionsPanel
        billStatus={bill.status}
        isTransitioning={isTransitioning}
        onTransition={handleTransition}
        onRequestCorrections={onRequestCorrections}
        onMoveToActivation={onMoveToActivation}
        onGoToOffers={onGoToOffers}
      />

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

      <EditBillModal bill={bill} open={editOpen} onClose={() => setEditOpen(false)} />

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

const caseSubTabs: { key: string; label: string; counted?: boolean }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "case_data", label: "Case Data" },
  { key: "documents", label: "Documents", counted: true },
  { key: "activation", label: "Activation" },
];

function CaseDetailsTab({
  caseId,
  billStatus,
  onStatusSelect,
  statusUpdating,
}: {
  caseId: string | null;
  billStatus: string;
  onStatusSelect: (status: string) => void;
  statusUpdating: boolean;
}) {
  const { data: caseData, isLoading } = useGetCaseByIdQuery(caseId!, { skip: !caseId });
  const [subTab, setSubTab] = useState("timeline");

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

  const tabCounts: Record<string, number> = { documents: docCount };

  const renderSubTab = () => {
    switch (subTab) {
      case "timeline":
        return <CaseTimeline events={events} />;
      case "case_data":
        return <CaseDataSection caseData={caseData} customerName={customerName} />;
      case "documents":
        return <CaseDocumentsSection documents={caseData.documents || []} caseId={caseData.id} />;
      case "activation":
        return <CaseActivationSection caseData={caseData} billStatus={billStatus} />;
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
          {/* Pipeline status — the same value the dropdown on the right sets */}
          <Tag
            color={statusTagColor[billStatus] || "default"}
            className="m-0! rounded-md! border-0! px-2.5! py-0.5! text-xs! font-semibold!"
          >
            {statusLabel[billStatus] || billStatus}
          </Tag>
          <Tag className="m-0! rounded-md! border-0! bg-orange-50! px-2.5! py-0.5! text-xs! font-semibold! text-orange-600! capitalize!">
            {caseData.caseType?.replace("_", " ")}
          </Tag>
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
        <CaseStatusSelect
          currentStatus={billStatus}
          onSelect={onStatusSelect}
          loading={statusUpdating}
          size="small"
        />
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

/** One address block, in the shape every address on a case is stored. */
type CaseAddress = {
  street: string | null;
  streetNumber: string | null;
  city: string | null;
  postalCode: string | null;
  province: string | null;
};

/** Renders the five address fields as "Via Roma 10, 20100 Milano (MI)". */
const fmtAddress = (a: CaseAddress): string => {
  const street = [a.street, a.streetNumber].filter(Boolean).join(" ").trim();
  const town = [
    [a.postalCode, a.city].filter(Boolean).join(" ").trim(),
    a.province ? `(${a.province})` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  return [street, town].filter(Boolean).join(", ") || "—";
};

const paymentMethodLabel: Record<string, string> = {
  rid_bancario: "Direct debit (SDD)",
  postal_order: "Postal order",
  credit_card: "Credit card",
  bank_transfer: "Bank transfer",
};

const invoiceDeliveryLabel: Record<string, string> = {
  digital: "Digital (by email)",
  paper: "Paper (by post)",
};

const documentTypeLabel: Record<string, string> = {
  identity_document: "Identity document",
  id_card: "ID card",
  codice_fiscale: "Codice Fiscale",
  partita_iva: "Partita IVA",
  bill: "Bill",
  contract: "Contract",
  signed_contract: "Signed contract",
};

type DataRow = {
  label: string;
  value: string;
  /** Spans both columns — for addresses and other long values. */
  wide?: boolean;
  /** Identifiers (IBAN, POD, email) keep the casing they were entered with. */
  raw?: boolean;
};

type DataGroup = { title: string; rows?: DataRow[]; content?: React.ReactNode };

function CaseDataSection({
  caseData,
  customerName,
}: {
  caseData: ICase;
  customerName: string;
}) {
  const bill = caseData.bill;
  const dash = (v: string | null | undefined) => (v && v.trim() ? v : "—");

  const supply: CaseAddress = {
    street: caseData.supplyStreet,
    streetNumber: caseData.supplyStreetNumber,
    city: caseData.supplyCity,
    postalCode: caseData.supplyPostalCode,
    province: caseData.supplyProvince,
  };
  const residential: CaseAddress = {
    street: caseData.residentialStreet,
    streetNumber: caseData.residentialStreetNumber,
    city: caseData.residentialCity,
    postalCode: caseData.residentialPostalCode,
    province: caseData.residentialProvince,
  };
  const shipping: CaseAddress = {
    street: caseData.shippingStreet,
    streetNumber: caseData.shippingStreetNumber,
    city: caseData.shippingCity,
    postalCode: caseData.shippingPostalCode,
    province: caseData.shippingProvince,
  };

  // Cases opened before the structured address fields existed only carry the
  // OCR'd supply line on the bill — fall back to it so the row is never blank.
  const supplyLine = fmtAddress(supply);
  const supplyDisplay = supplyLine !== "—" ? supplyLine : dash(bill?.supplyAddress);

  // The supplier the customer is leaving is only linked to a supplier record
  // when the OCR'd name matched one, so fall back to the name off the bill.
  const fromSupplier = dash(caseData.fromSupplier?.name || bill?.supplierName);

  const isDirectDebit = caseData.paymentMethod === "rid_bancario";
  const isPaper = caseData.invoiceDelivery === "paper";
  const ibanHolder = [caseData.ibanHolderFirstName, caseData.ibanHolderLastName]
    .filter(Boolean)
    .join(" ");

  const documents = caseData.documents || [];
  const verifiedCount = documents.filter((d) => d.verified).length;

  const groups: DataGroup[] = [
    {
      title: "Customer Information",
      rows: [
        { label: "Name", value: customerName },
        { label: "Email", value: dash(caseData.user?.email), raw: true },
        { label: "Phone", value: dash(caseData.user?.phone), raw: true },
        {
          label: "Codice Fiscale",
          value: dash(caseData.user?.codiceFiscale || bill?.codiceFiscale),
          raw: true,
        },
        ...(bill?.partitaIva
          ? [{ label: "Partita IVA", value: bill.partitaIva, raw: true }]
          : []),
        { label: "Case Type", value: dash(caseData.caseType?.replace("_", " ")) },
        { label: "Priority", value: dash(caseData.priority) },
      ],
    },
    {
      title: "Delivery Address",
      rows: [
        { label: "Supply Address", value: supplyDisplay, wide: true },
        {
          label: bill?.billType === "gas" ? "PDR" : "POD",
          value: dash(bill?.podNumber || bill?.pdrNumber),
          raw: true,
        },
        { label: "Meter Number", value: dash(bill?.meterNumber), raw: true },
      ],
    },
    {
      title: "Residential Address",
      rows: [
        {
          label: "Same as supply address",
          value: caseData.residentialSameAsSupply ? "Yes" : "No",
        },
        {
          label: "Residence",
          value: caseData.residentialSameAsSupply
            ? supplyDisplay
            : fmtAddress(residential),
          wide: true,
        },
      ],
    },
    {
      title: "Payment Method",
      rows: [
        {
          label: "Method",
          value: caseData.paymentMethod
            ? paymentMethodLabel[caseData.paymentMethod] || caseData.paymentMethod
            : "—",
        },
        ...(isDirectDebit
          ? [
              { label: "IBAN", value: dash(caseData.iban), raw: true },
              {
                label: "Account Holder",
                value: ibanHolder || customerName,
              },
              {
                label: "Holder Codice Fiscale",
                value: dash(caseData.ibanHolderTaxCode || caseData.user?.codiceFiscale),
                raw: true,
              },
            ]
          : []),
      ],
    },
    {
      title: "Invoice Delivery",
      rows: [
        {
          label: "Method",
          value: caseData.invoiceDelivery
            ? invoiceDeliveryLabel[caseData.invoiceDelivery] || caseData.invoiceDelivery
            : "—",
        },
        ...(caseData.invoiceDelivery === "digital"
          ? [
              {
                label: "Invoice Email",
                value: dash(caseData.invoiceEmail || caseData.user?.email),
                raw: true,
              },
            ]
          : []),
        ...(isPaper
          ? [
              {
                label: "Ships to supply address",
                value: caseData.shippingSameAsSupply ? "Yes" : "No",
              },
              {
                label: "Shipping Address",
                value: caseData.shippingSameAsSupply
                  ? supplyDisplay
                  : fmtAddress(shipping),
                wide: true,
              },
            ]
          : []),
      ],
    },
    {
      title: "Identity Verification",
      content:
        documents.length === 0 ? (
          <p className="text-sm text-slate-400">No identity documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">
              {documents.length} document{documents.length === 1 ? "" : "s"} uploaded ·{" "}
              {verifiedCount} verified
            </p>
            <div className="flex flex-wrap gap-2">
              {documents.map((doc) => (
                <span
                  key={doc.id}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    doc.verified
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                  title={`${documentTypeLabel[doc.documentType] || doc.documentType} · uploaded ${fmtDate(doc.createdAt)}`}
                >
                  {doc.verified ? (
                    <FiCheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <LuClock3 className="h-3.5 w-3.5" />
                  )}
                  <span className="max-w-[220px] truncate">{doc.fileName}</span>
                </span>
              ))}
            </div>
          </div>
        ),
    },
    {
      title: "Supplier & Offer",
      rows: [
        { label: "From Supplier", value: fromSupplier },
        { label: "To Supplier", value: dash(caseData.toSupplier?.name) },
        { label: "Selected Offer", value: dash(caseData.selectedOffer?.name) },
        {
          label: "Estimated Annual Value",
          value: fmt(caseData.estimatedAnnualValue) || "—",
          raw: true,
        },
        {
          label: "SLA Deadline",
          value: caseData.slaDeadline ? fmtDate(caseData.slaDeadline) : "—",
        },
      ],
    },
    {
      title: "Dates",
      rows: [
        { label: "Case Number", value: dash(caseData.caseNumber), raw: true },
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
          {g.content ?? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {g.rows?.map((r) => (
                <div key={r.label} className={r.wide ? "sm:col-span-2" : undefined}>
                  <span className="text-xs text-slate-400">{r.label}</span>
                  <p
                    className={`text-sm font-medium text-slate-700 ${
                      r.raw ? "break-words" : "capitalize"
                    }`}
                  >
                    {r.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CaseDocumentsSection({ documents, caseId }: { documents: ICaseDocument[]; caseId: string }) {
  const token = useAppSelector((state) => state.auth.token);
  const [verifyDocument, { isLoading: isVerifying }] = useVerifyDocumentMutation();
  const [uploadCaseDocument] = useUploadCaseDocumentMutation();
  const [uploading, setUploading] = useState(false);
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
            documentType: "identity_document",
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

  const allVerified = documents.length > 0 && documents.every((d) => d.verified);

  const renderDocRow = (doc: ICaseDocument) => (
    <div
      key={doc.id}
      className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/50"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${doc.verified ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"}`}>
          <FiFileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">{doc.fileName}</p>
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
        {!doc.verified ? (
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
            color="green"
            className="m-0! rounded-full! border-0! text-xs!"
          >
            Verified
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
                color={documents.length === 0 ? "red" : allVerified ? "green" : "orange"}
                className="m-0! rounded-full! border-0! text-xs! font-semibold!"
              >
                {documents.length === 0 ? "Not Uploaded" : allVerified ? "Verified" : "Pending Review"}
              </Tag>
            </div>
            {documents.length > 0 && (
              <span className="text-xs text-slate-400">
                {documents.filter((d) => d.verified).length}/{documents.length} verified
              </span>
            )}
          </div>

          {documents.length > 0 && (
            <div className="space-y-3 mb-4">
              {documents.map((doc) => renderDocRow(doc))}
            </div>
          )}

          {/* Admin Upload Identity Documents */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-3 flex-wrap">
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

/* ── Case Activation Section ───────────────────────────────── */

/**
 * Everything the case records about the switch itself.
 *
 * Contracts are signed with the supplier, outside this application, so there is
 * no document to send, review or store here — only the two dates the supplier
 * confirmed, which the customer sees on their utility. They stay editable
 * because suppliers move activation dates around.
 */
function CaseActivationSection({
  caseData,
  billStatus,
}: {
  caseData: ICase;
  billStatus: string;
}) {
  const { message } = App.useApp();
  const [updateCase, { isLoading: isSaving }] = useUpdateCaseMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [activationDate, setActivationDate] = useState<Dayjs | null>(null);
  const [expiryDate, setExpiryDate] = useState<Dayjs | null>(null);

  const isLiveUtility = billStatus === "awaiting_activation" || billStatus === "activated";

  const startEditing = () => {
    setActivationDate(caseData.activationDate ? dayjs(caseData.activationDate) : null);
    setExpiryDate(caseData.expiryDate ? dayjs(caseData.expiryDate) : null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!activationDate || !expiryDate) return;
    try {
      await updateCase({
        id: caseData.id,
        data: {
          activationDate: activationDate.format("YYYY-MM-DD"),
          expiryDate: expiryDate.format("YYYY-MM-DD"),
        },
      }).unwrap();
      message.success("Activation dates updated");
      setIsEditing(false);
    } catch (err: any) {
      message.error(err?.data?.message?.[0] || err?.data?.message || "Failed to save dates");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-800">Activation</h4>
          {isLiveUtility && !isEditing && (
            <Button size="small" icon={<FiEdit2 className="h-3 w-3" />} onClick={startEditing}>
              Edit dates
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Activation Date *</label>
                <DatePicker
                  className="w-full"
                  value={activationDate}
                  onChange={(d) => {
                    setActivationDate(d);
                    if (d && expiryDate && !expiryDate.isAfter(d, "day")) setExpiryDate(null);
                  }}
                  format="DD/MM/YYYY"
                  placeholder="Select activation date"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Expiry Date *</label>
                <DatePicker
                  className="w-full"
                  value={expiryDate}
                  onChange={setExpiryDate}
                  disabledDate={(d) => !!activationDate && !d.isAfter(activationDate, "day")}
                  format="DD/MM/YYYY"
                  placeholder="Select expiry date"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="primary"
                loading={isSaving}
                disabled={!activationDate || !expiryDate}
                onClick={handleSave}
              >
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <span className="text-xs text-slate-400">Contract Sent On</span>
              <p className="text-sm font-medium text-slate-700">
                {fmtDateIt(caseData.contractSentAt)}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Activation Date</span>
              <p className="text-sm font-medium text-slate-700">
                {fmtDateIt(caseData.activationDate)}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Expiry Date</span>
              <p className="text-sm font-medium text-slate-700">
                {fmtDateIt(caseData.expiryDate)}
              </p>
            </div>
          </div>
        )}
      </div>

      {billStatus === "contract_sent" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <h4 className="text-sm font-bold text-amber-800">Out for signature</h4>
          <p className="text-sm text-amber-600 mt-1">
            The customer is signing with the supplier. Nothing happens in the app until the
            supplier confirms — then move the case to In Activation with the two dates they gave
            you.
          </p>
        </div>
      )}

      {billStatus === "awaiting_activation" && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <h4 className="text-sm font-bold text-blue-800">Switch in progress</h4>
          <p className="text-sm text-blue-600 mt-1">
            The customer already sees this utility in My Utilities, with the activation date above.
            Mark it activated once the supply is live.
          </p>
        </div>
      )}

      {billStatus === "activated" && (
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

/* ── Notes Tab ─────────────────────────────────────────── */

function NotesTab({ billId }: { billId: string }) {
  const { message } = App.useApp();
  const { data: notes, isLoading } = useGetBillNotesQuery(billId);
  const [addNote, { isLoading: isAdding }] = useAddBillNoteMutation();
  const [updateNote] = useUpdateBillNoteMutation();
  const [deleteNote] = useDeleteBillNoteMutation();
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleAdd = async () => {
    if (!content.trim()) return;
    try {
      await addNote({ billId, content: content.trim() }).unwrap();
      message.success("Note added");
      setContent("");
    } catch {
      message.error("Failed to add note");
    }
  };

  const handleEdit = (noteId: string, currentContent: string) => {
    setEditingId(noteId);
    setEditContent(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    try {
      await updateNote({ billId, noteId: editingId, content: editContent.trim() }).unwrap();
      message.success("Note updated");
      setEditingId(null);
      setEditContent("");
    } catch {
      message.error("Failed to update note");
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote({ billId, noteId }).unwrap();
      message.success("Note deleted");
    } catch {
      message.error("Failed to delete note");
    }
  };

  return (
    <div className="space-y-5">
      {/* Add note form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Add Note</h3>
        <Input.TextArea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a note about this bill..."
          className="resize-none rounded-xl! border-slate-200"
        />
        <div className="flex justify-end">
          <Button
            type="primary"
            disabled={!content.trim()}
            onClick={handleAdd}
            loading={isAdding}
            size="small"
            className="rounded-lg bg-[#7061ED]! hover:bg-[#5f52d4]! font-semibold"
          >
            Add Note
          </Button>
        </div>
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" />
        </div>
      ) : !notes || notes.length === 0 ? (
        <Empty description="No notes yet" />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-xl border border-slate-200 p-5">
              {editingId === note.id ? (
                <div className="space-y-3">
                  <Input.TextArea
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="resize-none rounded-xl! border-slate-200"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="small" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      disabled={!editContent.trim()}
                      onClick={handleSaveEdit}
                      className="rounded-lg bg-[#7061ED]! hover:bg-[#5f52d4]! font-semibold"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      <span className="text-[#7061ED] font-medium">
                        {note.createdBy
                          ? `${note.createdBy.firstName} ${note.createdBy.lastName}`
                          : "Admin"}
                      </span>
                      {" · "}
                      {new Date(note.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {" "}
                      {new Date(note.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="text"
                      size="small"
                      onClick={() => handleEdit(note.id, note.content)}
                      className="text-xs text-[#7061ED]"
                    >
                      Edit
                    </Button>
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={() => handleDelete(note.id)}
                      className="text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BillRequestDetailView;
