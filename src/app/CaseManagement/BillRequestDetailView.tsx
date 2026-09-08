import { useState, useCallback, useContext, useMemo, useRef, createContext } from "react";
import { App, Button, Input, InputNumber, Spin, Empty, Tag, Select, Table, Upload, Tooltip, DatePicker, Modal, message } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { SortOrder } from "antd/es/table/interface";
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
  LuHouse,
  LuMail,
  LuBuilding2,
  LuRotateCcw,
  LuGripVertical,
  LuStar,
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
  useReorderBillOffersMutation,
  applyOfferOrderLocally,
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
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { cn } from "../../utils/cn";
import { formatMoney, formatQuantity, formatUnitPrice } from "../../utils/format";
import { server_url, server_origin } from "../../config";
import EditBillModal from "./EditBillModal";
import EditCaseModal from "./EditCaseModal";
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

/* Both yield null rather than a dash for a missing figure, so the detail rows
   that render `value` drop out entirely instead of showing an empty amount. */
const fmt = (val: number | null | undefined): string | null =>
  formatMoney(val, { fallback: null });

const fmtNum = (val: number | null | undefined, unit = ""): string | null =>
  formatQuantity(val, unit, { fallback: null });

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
  const [reorderBillOffers] = useReorderBillOffersMutation();
  const [transitionBillStatus] = useTransitionBillStatusMutation();
  const dispatch = useAppDispatch();
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
  const offerOrderSave = useRef<Promise<unknown>>(Promise.resolve());

  /**
   * Saves the order the customer sees the offers in.
   *
   * The list on screen moves first and is saved after, so a dropped row stays
   * where it was let go instead of springing back for the length of the round
   * trip. The saves are chained rather than fired off in parallel: each one
   * carries the whole run, so two overlapping requests could land the wrong way
   * round and leave the server holding an order the admin only passed through
   * on the way to the one they wanted.
   */
  const handleReorderOffers = useCallback(
    (offerIds: string[]) => {
      if (!billId) return;
      dispatch(applyOfferOrderLocally(billId, offerIds));
      offerOrderSave.current = offerOrderSave.current
        .catch(() => undefined)
        .then(() => reorderBillOffers({ billId, offerIds }).unwrap())
        .catch((err: { data?: { message?: string | string[] } }) => {
          const msg = err?.data?.message;
          notification.error({
            message: "Could not save the offer order",
            description: Array.isArray(msg)
              ? msg.join(", ")
              : typeof msg === "string"
                ? msg
                : "The customer still sees the previous order — the list has been reloaded.",
            duration: 6,
          });
        });
    },
    [billId, dispatch, reorderBillOffers, notification],
  );

  /**
   * Keeps the tick order meaningful.
   *
   * `selectedRowKeys` is not just a set here — its order is the order the batch
   * will be sent in, and so the order the customer will first see. Ant Design
   * hands back the selection in table order on every change, which would undo
   * any arranging the admin had done, so the offers still ticked keep the
   * places they were given and only the new ones join the end.
   */
  const handleSelectionChange = useCallback((keys: React.Key[]) => {
    setSelectedRowKeys((previous) => {
      const stillTicked = new Set(keys.map(String));
      const kept = previous.filter((key) => stillTicked.has(String(key)));
      const keptKeys = new Set(kept.map(String));
      return [...kept, ...keys.filter((key) => !keptKeys.has(String(key)))];
    });
  }, []);

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

    // `selectedRowKeys` is held in the order the admin arranged, so the batch
    // goes out in it — that is the order the customer first sees, and it is
    // settled here rather than after the fact.
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
            onSelectionChange={handleSelectionChange}
            onReorderQueued={setSelectedRowKeys}
            savingsOverrides={savingsOverrides}
            onSavingsChange={(offerId, value) =>
              setSavingsOverrides((prev) => ({ ...prev, [offerId]: value }))
            }
            onSendOffers={handleSendOffers}
            onReorderOffers={handleReorderOffers}
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
            bill={bill}
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

/**
 * The two runs of offers the admin arranges.
 *
 * `sent` is the list the customer already has, and moving within it writes
 * straight through to the server. `queued` is the batch ticked but not yet
 * sent: it is arranged here first and goes out in that order, so the customer's
 * list is right the first time rather than needing a second pass afterwards.
 *
 * They are arranged separately because only one of them exists on the server. A
 * queued offer has no row to renumber yet, so it cannot be dropped among the
 * sent ones; once sent it joins the end of that run and moves freely.
 */
type OfferRun = "sent" | "queued";

/**
 * What a row needs in order to be dropped onto.
 *
 * It travels by context because Ant Design builds the `<tr>` elements itself
 * and gives no way to pass props down to them — only a component to build them
 * with.
 */
type OfferDragState = {
  draggingId: string | null;
  overId: string | null;
  /** Position in the customer's list, 1-based; undefined for an offer in neither run. */
  positionOf: (offerId: string) => number | undefined;
  /** Which run the offer sits in, or null when it is in neither. */
  runOf: (offerId: string) => OfferRun | null;
  /** Whether the offer can be picked up at all — a lone offer has nothing to swap with. */
  canDrag: (offerId: string) => boolean;
  /** The row the offer would land on, or null once the cursor leaves the run. */
  onDragOverRow: (offerId: string | null) => void;
  onDropOnRow: (offerId: string) => void;
};

const OfferDragContext = createContext<OfferDragState | null>(null);

type OfferRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  "data-row-key"?: string;
};

/**
 * A table row that a dragged offer can be dropped onto.
 *
 * The drag starts from the handle in the ORDER cell rather than from the row,
 * because the row carries an editable savings field and a row-wide `draggable`
 * would swallow every attempt to select the text inside it. The row only
 * receives the drop, and marks the edge the offer would land on.
 */
function DroppableOfferRow({ children, className, ...props }: OfferRowProps) {
  const drag = useContext(OfferDragContext);
  const offerId = props["data-row-key"];

  // A row only takes the drop when it shares a run with the offer in flight:
  // the two are arranged in different places — one on the server, one in the
  // batch waiting to go — so an offer cannot cross from one into the other.
  const draggedRun = drag?.draggingId ? drag.runOf(drag.draggingId) : null;
  const ownRun = offerId ? (drag?.runOf(offerId) ?? null) : null;
  const accepts = !!offerId && !!draggedRun && ownRun === draggedRun;

  const isDropTarget =
    !!drag && accepts && drag.overId === offerId && drag.draggingId !== offerId;

  // Dragging down, the offer lands under the row it was dropped on; dragging
  // up, above it. The line is drawn on the cells rather than the row: a
  // collapsed table border swallows a border set on the `<tr>` itself.
  const draggedPosition = drag?.draggingId
    ? drag.positionOf(drag.draggingId)
    : undefined;
  const ownPosition = offerId ? drag?.positionOf(offerId) : undefined;
  const landsBelow =
    isDropTarget &&
    draggedPosition !== undefined &&
    ownPosition !== undefined &&
    ownPosition > draggedPosition;

  return (
    <tr
      {...props}
      onDragOver={(event) => {
        if (!drag?.draggingId || !offerId) return;
        // Dragging out past the run takes the line with it. Without this it
        // would sit on the last offer passed over, pointing at a place the row
        // can no longer be dropped.
        if (!accepts) {
          drag.onDragOverRow(null);
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        drag.onDragOverRow(offerId);
      }}
      onDrop={(event) => {
        if (!drag?.draggingId || !offerId || !accepts) return;
        event.preventDefault();
        drag.onDropOnRow(offerId);
      }}
      className={cn(
        className,
        drag?.draggingId === offerId && "opacity-40",
        isDropTarget &&
          (landsBelow
            ? "[&>td]:border-b-2 [&>td]:border-b-violet-500"
            : "[&>td]:border-t-2 [&>td]:border-t-violet-500"),
      )}
    >
      {children}
    </tr>
  );
}

function AvailableOffersTab({
  offers,
  isLoading: isLoadingOffers,
  isElectricity,
  selectedRowKeys,
  onSelectionChange,
  onReorderQueued,
  savingsOverrides,
  onSavingsChange,
  onSendOffers,
  onReorderOffers,
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
  onReorderQueued: (keys: React.Key[]) => void;
  savingsOverrides: Record<string, number>;
  onSavingsChange: (offerId: string, value: number) => void;
  onSendOffers: () => void;
  onReorderOffers: (offerIds: string[]) => void;
  isSending: boolean;
  billStatus: string;
  caseCreated: boolean;
  userSelectedOfferId: string | null;
}) {
  const unit = isElectricity ? "kWh" : "Smc";

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [sortedColumn, setSortedColumn] = useState<React.Key | null>(null);
  const [sortDirection, setSortDirection] = useState<SortOrder>(null);

  /**
   * The list the customer already has, in the order the admin put it in. The
   * API returns the sent offers first and already ordered, so this holds
   * whatever they arranged even while an Ant Design sorter is rearranging what
   * is drawn on screen.
   */
  const sentOrder = useMemo(
    () => offers.filter((offer) => offer.isSent).map((offer) => offer.id),
    [offers],
  );

  /**
   * The batch ticked but not yet sent, in the order it will go out in.
   *
   * The tick order is the arrangement — `selectedRowKeys` is kept ordered for
   * exactly this — so the admin settles the customer's order while composing
   * the batch rather than having to fix it up after sending.
   */
  const queuedOrder = useMemo(() => {
    const sent = new Set(sentOrder);
    const known = new Set(offers.map((offer) => offer.id));
    return selectedRowKeys
      .map(String)
      .filter((id) => known.has(id) && !sent.has(id));
  }, [selectedRowKeys, offers, sentOrder]);

  /** Both runs end to end: the places the customer's list will have, in order. */
  const arrangement = useMemo(
    () => [...sentOrder, ...queuedOrder],
    [sentOrder, queuedOrder],
  );
  const positions = useMemo(
    () => new Map(arrangement.map((id, index) => [id, index + 1])),
    [arrangement],
  );
  const sentIds = useMemo(() => new Set(sentOrder), [sentOrder]);
  const queuedIds = useMemo(() => new Set(queuedOrder), [queuedOrder]);

  // A sorter rearranges the rows on screen without touching the arrangement, so
  // dropping a row under one would mean nothing — the position it was let go
  // over is not the position it would take. The handles come back the moment
  // the sort is cleared.
  //
  // Once the customer has chosen, the app stops showing them this bill's offers
  // at all, so there is no list left to arrange either.
  const isSorted = sortDirection !== null && sortedColumn !== null;
  const reorderingAllowed = !isSorted && !caseCreated;

  const runOf = (offerId: string): OfferRun | null =>
    sentIds.has(offerId) ? "sent" : queuedIds.has(offerId) ? "queued" : null;

  const runFor = (run: OfferRun) => (run === "sent" ? sentOrder : queuedOrder);

  /** A run of one has nothing to swap with, so its handle stays inert. */
  const canDrag = (offerId: string) => {
    const run = runOf(offerId);
    return reorderingAllowed && run !== null && runFor(run).length > 1;
  };

  /**
   * Moves an offer within its own run. A sent offer is renumbered on the
   * server; a queued one only rearranges the batch that has yet to go out.
   */
  const move = (offerId: string, toIndex: number) => {
    const run = runOf(offerId);
    if (!run) return;
    const list = runFor(run);
    const fromIndex = list.indexOf(offerId);
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      toIndex >= list.length ||
      toIndex === fromIndex
    ) {
      return;
    }
    const next = [...list];
    next.splice(toIndex, 0, next.splice(fromIndex, 1)[0]);
    if (run === "sent") onReorderOffers(next);
    else onReorderQueued(next);
  };

  /** Puts the keyboard back on the handle after the row moved out from under it. */
  const refocusHandle = (offerId: string) => {
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-offer-handle="${offerId}"]`)
        ?.focus();
    });
  };

  const dragState: OfferDragState = {
    draggingId,
    overId,
    positionOf: (offerId) => positions.get(offerId),
    runOf,
    canDrag,
    onDragOverRow: (offerId) => setOverId((current) => (current === offerId ? current : offerId)),
    onDropOnRow: (offerId) => {
      const run = draggingId ? runOf(draggingId) : null;
      if (draggingId && run) move(draggingId, runFor(run).indexOf(offerId));
      setDraggingId(null);
      setOverId(null);
    },
  };

  /**
   * The rows in the order they are arranged: the customer's list first, then
   * the batch waiting to go, then the rest of the catalogue in the price order
   * the API gave it. Ticking an offer lifts it into the run so it sits next to
   * the others it will be sent with, and can be dragged among them.
   */
  const orderedOffers = useMemo(() => {
    const rank = new Map(arrangement.map((id, index) => [id, index]));
    return [...offers].sort((a, b) => {
      const left = rank.get(a.id);
      const right = rank.get(b.id);
      if (left === undefined && right === undefined) return 0;
      if (left === undefined) return 1;
      if (right === undefined) return -1;
      return left - right;
    });
  }, [offers, arrangement]);

  const columns: ColumnsType<IOfferWithSavings> = [
    {
      title: "ORDER",
      key: "displayOrder",
      width: 78,
      render: (_, record) => {
        const position = positions.get(record.id);
        if (position === undefined) {
          return (
            <Tooltip title="Tick this offer to give it a place in the customer's list, then drag it where you want it.">
              <span className="text-xs text-slate-300">—</span>
            </Tooltip>
          );
        }
        const run = runOf(record.id);
        const draggable = canDrag(record.id);
        return (
          <div className="flex items-center gap-1.5">
            <Tooltip
              title={
                draggable
                  ? run === "queued"
                    ? "Drag to set the order these will be sent in — or focus this handle and use ↑ ↓"
                    : "Drag to set the order the customer sees — or focus this handle and use ↑ ↓"
                  : caseCreated
                    ? "The customer has already chosen — the order no longer changes what they see"
                    : isSorted
                      ? "Clear the column sort to rearrange the order"
                      : run === "queued"
                        ? "Tick another offer to arrange the batch before sending it"
                        : "There is nothing to reorder yet — only one offer has been sent"
              }
            >
              <span
                data-offer-handle={record.id}
                role="button"
                aria-label={
                  `Reorder ${record.name}, position ${position} of ${arrangement.length}` +
                  (run === "queued" ? " — waiting to be sent" : "")
                }
                aria-disabled={!draggable}
                tabIndex={draggable ? 0 : -1}
                draggable={draggable}
                onDragStart={(event) => {
                  const row = event.currentTarget.closest("tr");
                  // Without this the ghost following the cursor is the handle
                  // alone, and there is no telling which offer is in flight.
                  if (row) {
                    event.dataTransfer.setDragImage(row, 24, row.clientHeight / 2);
                  }
                  event.dataTransfer.effectAllowed = "move";
                  // Firefox refuses to start a drag that carries no data.
                  event.dataTransfer.setData("text/plain", record.id);
                  setDraggingId(record.id);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setOverId(null);
                }}
                onKeyDown={(event) => {
                  if (!draggable || !run) return;
                  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                  event.preventDefault();
                  const withinRun = runFor(run).indexOf(record.id);
                  move(record.id, withinRun + (event.key === "ArrowUp" ? -1 : 1));
                  refocusHandle(record.id);
                }}
                className={cn(
                  "flex items-center rounded text-slate-300 outline-none",
                  draggable
                    ? "cursor-grab hover:text-violet-500 focus-visible:ring-2 focus-visible:ring-violet-400 active:cursor-grabbing"
                    : "cursor-not-allowed",
                )}
              >
                <LuGripVertical className="h-4 w-4" />
              </span>
            </Tooltip>
            <Tooltip
              title={
                run === "queued"
                  ? `Position ${position} of ${arrangement.length} once this batch is sent`
                  : undefined
              }
            >
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  run === "queued"
                    ? "text-amber-600 underline decoration-dashed decoration-amber-400 underline-offset-4"
                    : "text-slate-700",
                )}
              >
                {position}
              </span>
            </Tooltip>
          </div>
        );
      },
      align: "left",
    },
    {
      title: "OFFER",
      key: "name",
      width: 200,
      render: (_, record) => (
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{record.name}</p>
          <p className="text-xs text-slate-400 truncate">{record.supplier?.name || "—"}</p>
          {positions.get(record.id) === 1 && (
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                runOf(record.id) === "queued"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-violet-50 text-violet-600",
              )}
            >
              <LuStar className="h-2.5 w-2.5" />
              {runOf(record.id) === "queued"
                ? "Will be shown first"
                : "Shown first in app"}
            </span>
          )}
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
            {formatUnitPrice(price)}
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
      sortOrder: sortedColumn === "price" ? sortDirection : null,
      align: "right",
    },
    {
      title: "FIXED FEE",
      key: "fixedFee",
      width: 90,
      render: (_, record) => (
        <span className="text-xs text-slate-600">{formatMoney(record.fixedMonthlyFee)}</span>
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
      sortOrder: sortedColumn === "savings" ? sortDirection : null,
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
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              {selectedRowKeys.length} offer{selectedRowKeys.length > 1 ? "s" : ""} selected
            </p>
            {queuedOrder.length > 1 && !isSorted && (
              <p className="text-xs text-emerald-700 mt-0.5">
                They will be sent in the order shown at the top of the table — drag the
                handles to change it before sending.
              </p>
            )}
          </div>
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
        const sentCount = sentOrder.length;
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

      {/* How the order works, and how to get the handles back when a sort hides them */}
      {arrangement.length > 1 && !caseCreated && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2">
          <p className="text-xs text-violet-700">
            {isSorted ? (
              <>
                The rows are sorted for browsing only — the customer still sees the order
                you set. Clear the sort to rearrange it.
              </>
            ) : (
              <>
                <span className="font-semibold">
                  Drag the handles to set the order the customer sees.
                </span>{" "}
                The offer at the top is shown first in the app. Nothing is re-sorted by
                price or savings on top of it.
                {queuedOrder.length > 0 && sentOrder.length > 0 && (
                  <>
                    {" "}
                    The{" "}
                    <span className="font-semibold text-amber-600">amber</span> positions
                    are the batch you have yet to send: arrange it now and it joins the end
                    of the list in that order.
                  </>
                )}
              </>
            )}
          </p>
          {isSorted && (
            <Button
              size="small"
              onClick={() => {
                setSortedColumn(null);
                setSortDirection(null);
              }}
            >
              Clear sort
            </Button>
          )}
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
              {sentOrder.length > 0 && (
                <span className="text-slate-400 font-normal ml-1">
                  ({sentOrder.length} already sent)
                </span>
              )}
            </h4>
          </div>
          <OfferDragContext.Provider value={dragState}>
            <Table<IOfferWithSavings>
              rowKey="id"
              columns={columns}
              dataSource={orderedOffers}
              size="small"
              // Paging would put part of the arranged run on one page and the
              // drop targets on another, so it has to stay whole. Only the
              // catalogue below it is paged.
              pagination={
                offers.length > Math.max(20, arrangement.length)
                  ? {
                      pageSize: Math.max(20, arrangement.length),
                      showSizeChanger: false,
                    }
                  : false
              }
              scroll={{ x: 980 }}
              onChange={(_pagination, _filters, sorter) => {
                const active = Array.isArray(sorter) ? sorter[0] : sorter;
                setSortedColumn(active?.order ? (active.columnKey ?? null) : null);
                setSortDirection(active?.order ?? null);
              }}
              components={{ body: { row: DroppableOfferRow } }}
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
          </OfferDragContext.Provider>
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
      const ext = bf.fileUrl?.split(".").pop() || "pdf";
      await downloadAuthedFile(
        `${server_url}bills/${bill.id}/files/${bf.id}`,
        token,
        bf.originalName || `bill-${bill.id.slice(0, 8)}.${ext}`,
      );
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
          value: formatUnitPrice(bill.costPerUnit, undefined, { fallback: null }),
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
  { key: "case_data", label: "Case Overview" },
  { key: "timeline", label: "Timeline" },
  { key: "documents", label: "Documents", counted: true },
  { key: "activation", label: "Activation" },
];

function CaseDetailsTab({
  caseId,
  bill,
  onStatusSelect,
  statusUpdating,
}: {
  caseId: string | null;
  /** The bill this case was opened from — the overview quotes the OCR off it. */
  bill: IBill;
  onStatusSelect: (status: string) => void;
  statusUpdating: boolean;
}) {
  const { data: caseData, isLoading } = useGetCaseByIdQuery(caseId!, { skip: !caseId });
  const [subTab, setSubTab] = useState("case_data");
  const billStatus = bill.status;

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
        return <CaseDataSection caseData={caseData} bill={bill} customerName={customerName} />;
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
  value: React.ReactNode;
  /**
   * Title-cases the value. Opt-in rather than opt-out: nearly everything a case
   * holds is an identifier or something a person typed — capitalising a
   * province entered "mi" would render it "Mi" — and only the handful of enum
   * values stored lower-cased actually want it.
   */
  cap?: boolean;
  /**
   * Puts the label on its own line with the value beneath it, across the whole
   * card. For the rows whose value is a file name — a half-width column in a
   * four-across grid truncates those to three characters.
   */
  stacked?: boolean;
};

/** One numbered card of the case overview grid. */
type DataCard = {
  /** Identifies the card across rearrangements — never its position. */
  key: CardKey;
  title: string;
  rows?: DataRow[];
  /** Cards whose contents are not label/value pairs — addresses, documents. */
  content?: React.ReactNode;
};

/**
 * Hands the browser a file the API only serves to an authenticated request.
 *
 * An anchor cannot point straight at the endpoint — both bill files and case
 * documents sit behind the bearer token — so the bytes are fetched first and
 * offered as an object URL. Throws on a failed fetch; the caller decides what
 * to tell the admin.
 */
async function downloadAuthedFile(url: string, token: string | null, fileName: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Failed to fetch file");
  const objectUrl = URL.createObjectURL(await res.blob());
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

/**
 * What this supply uses in a year, mirroring `MetersService.annualConsumption`
 * on the server so the admin reads the same figure the customer sees in the
 * app: the consumption printed on the bill scaled by how many of its own
 * billing periods fit in a year, falling back to six — the common Italian
 * bimonthly cycle — for a bill the OCR read a consumption off but no dates.
 * Null when there is no consumption at all, so the row shows a dash rather
 * than a zero the admin would read as a fact.
 */
function annualConsumption(bill: IBill): number | null {
  const raw = bill.billType === "gas" ? bill.consumptionSmc : bill.consumptionKwh;
  const consumption = raw == null ? null : Number(raw);
  if (consumption == null || !Number.isFinite(consumption) || consumption <= 0) return null;

  const start = bill.billingPeriodStart ? new Date(bill.billingPeriodStart).getTime() : NaN;
  const end = bill.billingPeriodEnd ? new Date(bill.billingPeriodEnd).getTime() : NaN;
  const periodDays =
    !Number.isNaN(start) && !Number.isNaN(end) && end > start
      ? (end - start) / 86_400_000
      : 0;

  return Math.round(consumption * (periodDays > 0 ? 365 / periodDays : 6));
}

/** Date and time, for the rows where the hour of the upload is the point. */
const fmtDateTime = (val: string | null | undefined) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
    return `${fmtDateIt(val)} ${d.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return val;
  }
};

/**
 * The order the cards read in until an admin rearranges them, and what the
 * "Reset layout" button puts back. Arrived at by the admins arranging the
 * screen themselves; an admin who drags a card still overrides it, and theirs
 * wins on every later visit.
 */
const DEFAULT_CARD_ORDER = [
  "customer",
  "addresses",
  "utility",
  "offer",
  "bill_ocr",
  "case",
  "documents",
  "payment",
] as const;

type CardKey = (typeof DEFAULT_CARD_ORDER)[number];

/**
 * Where an admin's own arrangement is kept.
 *
 * The order is a personal reading preference rather than anything about the
 * case — two admins on the same case may each want their own — so it lives in
 * the browser and never reaches the server.
 */
const CARD_ORDER_STORAGE_KEY = "easyrisparmio:case-overview-card-order";

/**
 * The saved arrangement, reconciled with the cards that exist today.
 *
 * Keys that no longer name a card are dropped and cards added since the order
 * was saved are appended, so releasing a new card never hides it from an admin
 * who arranged the screen before it existed.
 */
function readStoredCardOrder(): CardKey[] {
  try {
    const raw = localStorage.getItem(CARD_ORDER_STORAGE_KEY);
    if (!raw) return [...DEFAULT_CARD_ORDER];
    const stored: unknown = JSON.parse(raw);
    if (!Array.isArray(stored)) return [...DEFAULT_CARD_ORDER];
    const known = [
      ...new Set(
        stored.filter((key): key is CardKey =>
          (DEFAULT_CARD_ORDER as readonly string[]).includes(key as string),
        ),
      ),
    ];
    return [...known, ...DEFAULT_CARD_ORDER.filter((key) => !known.includes(key))];
  } catch {
    // A browser that refuses storage, or a value some other tab corrupted —
    // either way the default order is a perfectly good screen.
    return [...DEFAULT_CARD_ORDER];
  }
}

/** What a card needs in order to be picked up and dropped onto. */
type CardDragState = {
  draggingKey: CardKey | null;
  overKey: CardKey | null;
  /** Where the card sits in the arrangement, 1-based. */
  positionOf: (key: CardKey) => number;
  total: number;
  onDragStart: (key: CardKey) => void;
  onDragEnd: () => void;
  /** The card the one in flight would land on, or null once it leaves the grid. */
  onDragOverCard: (key: CardKey | null) => void;
  onDropOnCard: (key: CardKey) => void;
  /** Keyboard equivalent — moves the card by one place in either direction. */
  onNudge: (key: CardKey, delta: number) => void;
};

/**
 * One numbered card, which the admin can drag into the place they want it.
 *
 * The drag starts from the handle rather than the card, so selecting a value
 * to copy — an IBAN, a POD — still works everywhere inside it. The card itself
 * only receives the drop, and marks the edge the card in flight would land on.
 */
function OverviewCard({
  cardKey,
  title,
  drag,
  children,
}: {
  cardKey: CardKey;
  title: string;
  drag: CardDragState;
  children: React.ReactNode;
}) {
  const position = drag.positionOf(cardKey);
  const isDropTarget = drag.overKey === cardKey && drag.draggingKey !== cardKey;
  // Dragged forward, the card lands after the one it was dropped on; dragged
  // back, before it. An inset bar rather than a border, so marking the target
  // does not shift the grid by the width of it.
  const landsAfter =
    isDropTarget && drag.draggingKey != null && position > drag.positionOf(drag.draggingKey);

  return (
    <div
      data-card={cardKey}
      onDragOver={(event) => {
        if (!drag.draggingKey) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        drag.onDragOverCard(cardKey);
      }}
      onDrop={(event) => {
        if (!drag.draggingKey) return;
        event.preventDefault();
        drag.onDropOnCard(cardKey);
      }}
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        drag.draggingKey === cardKey && "opacity-40",
        isDropTarget &&
          (landsAfter
            ? "shadow-[inset_-3px_0_0_0_#7061ED]"
            : "shadow-[inset_3px_0_0_0_#7061ED]"),
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-[#7061ED] text-[11px] font-bold text-white">
          {position}
        </span>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <Tooltip title="Drag to rearrange the cards — or focus this handle and use ← →">
          <span
            data-card-handle={cardKey}
            role="button"
            aria-label={`Reorder ${title}, card ${position} of ${drag.total}`}
            tabIndex={0}
            draggable
            onDragStart={(event) => {
              const card = event.currentTarget.closest<HTMLElement>("[data-card]");
              // Without this the ghost following the cursor is the handle
              // alone, and there is no telling which card is in flight.
              if (card) event.dataTransfer.setDragImage(card, 24, 24);
              event.dataTransfer.effectAllowed = "move";
              // Firefox refuses to start a drag that carries no data.
              event.dataTransfer.setData("text/plain", cardKey);
              drag.onDragStart(cardKey);
            }}
            onDragEnd={drag.onDragEnd}
            onKeyDown={(event) => {
              const delta =
                event.key === "ArrowLeft" || event.key === "ArrowUp"
                  ? -1
                  : event.key === "ArrowRight" || event.key === "ArrowDown"
                    ? 1
                    : 0;
              if (!delta) return;
              event.preventDefault();
              drag.onNudge(cardKey, delta);
            }}
            className="ml-auto flex cursor-grab items-center rounded text-slate-300 outline-none transition-colors hover:text-[#7061ED] focus-visible:ring-2 focus-visible:ring-violet-400 active:cursor-grabbing"
          >
            <LuGripVertical className="h-4 w-4" />
          </span>
        </Tooltip>
      </div>
      {children}
    </div>
  );
}

/** Label left, value right — the shape all but the address and document cards take. */
function CardRows({ rows }: { rows: DataRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((r) =>
        r.stacked ? (
          <div key={r.label}>
            <span className="text-xs leading-snug text-slate-400">{r.label}</span>
            <div className="mt-1 text-sm font-medium text-slate-700">{r.value}</div>
          </div>
        ) : (
          <div key={r.label} className="flex items-start justify-between gap-3">
            <span className="w-[44%] shrink-0 text-xs leading-snug text-slate-400">
              {r.label}
            </span>
            <span
              className={`min-w-0 break-words text-right text-sm font-medium text-slate-700 ${
                r.cap ? "capitalize" : ""
              }`}
            >
              {r.value}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

/** One address on the Addresses card: icon, what it is, then the line itself. */
function AddressBlock({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <p className="mt-1 break-words text-sm text-slate-500">{value}</p>
        {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
      </div>
    </div>
  );
}

/** A file the admin can pull down, wherever the API keeps it. */
type OverviewFile = {
  id: string;
  /** What this file is — the label the row is filed under. */
  group: string;
  name: string;
  uploadedAt: string;
  /** Authenticated endpoint the bytes come from. */
  url: string;
  /** Only identity documents carry a verification state; bill files do not. */
  verified?: boolean;
};

function FileRow({
  file,
  onDownload,
  busy,
}: {
  file: OverviewFile;
  onDownload: (file: OverviewFile) => void;
  busy: boolean;
}) {
  return (
    <div>
      <span className="text-xs leading-snug text-slate-400">{file.group}</span>
      <div className="mt-0.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDownload(file)}
          disabled={busy}
          title={file.name}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800 disabled:opacity-50"
        >
          <FiFileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{file.name}</span>
        </button>
        <span className="shrink-0 text-xs text-slate-400">{fmtDateIt(file.uploadedAt)}</span>
        {file.verified != null && (
          <span
            title={file.verified ? "Verified" : "Awaiting verification"}
            className={file.verified ? "text-emerald-500" : "text-amber-500"}
          >
            {file.verified ? (
              <FiCheckCircle className="h-3.5 w-3.5" />
            ) : (
              <LuClock3 className="h-3.5 w-3.5" />
            )}
          </span>
        )}
        <button
          type="button"
          onClick={() => onDownload(file)}
          disabled={busy}
          title="Download"
          className="shrink-0 text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-50"
        >
          <LuDownload className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Everything the switch is filed against, on one screen.
 *
 * Laid out as seven numbered cards rather than one long column: an admin
 * checking a case reads across a supplier's requirements — who the customer is,
 * where the supply is, what the meter says, what the bill said, how it is paid
 * for, what they signed, what was uploaded — and a card per question lets them
 * find one without scrolling past the other six.
 */
function CaseDataSection({
  caseData,
  bill,
  customerName,
}: {
  caseData: ICase;
  /** The full bill the case was opened from — the case's own copy is a subset. */
  bill: IBill;
  customerName: string;
}) {
  const token = useAppSelector((state) => state.auth.token);
  const dash = (v: string | null | undefined) => (v && v.trim() ? v : "—");
  const [editing, setEditing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [cardOrder, setCardOrder] = useState<CardKey[]>(readStoredCardOrder);
  const [draggingKey, setDraggingKey] = useState<CardKey | null>(null);
  const [overKey, setOverKey] = useState<CardKey | null>(null);

  const isCustomOrder = cardOrder.some((key, i) => key !== DEFAULT_CARD_ORDER[i]);

  /**
   * Lifts a card out of the arrangement and puts it back at `toIndex`, saving
   * the result. A browser refusing storage still rearranges the screen for the
   * rest of the visit — the preference simply does not outlive it.
   */
  const moveCard = (key: CardKey, toIndex: number) => {
    const from = cardOrder.indexOf(key);
    const to = Math.max(0, Math.min(cardOrder.length - 1, toIndex));
    if (from === -1 || from === to) return;
    const next = [...cardOrder];
    next.splice(from, 1);
    next.splice(to, 0, key);
    setCardOrder(next);
    try {
      localStorage.setItem(CARD_ORDER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* nothing saved — the arrangement still holds for this visit */
    }
  };

  const resetCardOrder = () => {
    setCardOrder([...DEFAULT_CARD_ORDER]);
    try {
      localStorage.removeItem(CARD_ORDER_STORAGE_KEY);
    } catch {
      /* nothing was saved to clear */
    }
  };

  /** Keeps the keyboard on the card it just moved, rather than on the place it left. */
  const refocusHandle = (key: CardKey) => {
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-card-handle="${key}"]`)?.focus();
    });
  };

  const cardDrag: CardDragState = {
    draggingKey,
    overKey,
    positionOf: (key) => cardOrder.indexOf(key) + 1,
    total: cardOrder.length,
    onDragStart: setDraggingKey,
    onDragEnd: () => {
      setDraggingKey(null);
      setOverKey(null);
    },
    onDragOverCard: (key) => setOverKey((current) => (current === key ? current : key)),
    onDropOnCard: (key) => {
      if (draggingKey) moveCard(draggingKey, cardOrder.indexOf(key));
      setDraggingKey(null);
      setOverKey(null);
    },
    onNudge: (key, delta) => {
      moveCard(key, cardOrder.indexOf(key) + delta);
      refocusHandle(key);
    },
  };

  const isElectricity = bill.billType === "electricity";
  const unit = isElectricity ? "kWh" : "Smc";

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
  const supplyDisplay = supplyLine !== "—" ? supplyLine : dash(bill.supplyAddress);

  // What is stored wins. The flag is only the fallback, for cases saved before
  // a block declared identical to the supply address was kept as a copy of it.
  const resolveAddress = (address: CaseAddress, sameAsSupply: boolean): string => {
    const line = fmtAddress(address);
    if (line !== "—") return line;
    return sameAsSupply ? supplyDisplay : "—";
  };

  // A company has a registered office and no residence: same columns, and the
  // only honest word for what is in them depends on who filed the case.
  const isBusinessCase =
    caseData.user?.role === "business" || !!caseData.user?.businessProfile;

  const residentialDisplay = resolveAddress(residential, caseData.residentialSameAsSupply);
  const shippingDisplay = resolveAddress(shipping, caseData.shippingSameAsSupply);

  // The supplier the customer is leaving is only linked to a supplier record
  // when the OCR'd name matched one, so fall back to the name off the bill.
  const fromSupplier = dash(caseData.fromSupplier?.name || bill.supplierName);

  const isDirectDebit = caseData.paymentMethod === "rid_bancario";
  const isPaper = caseData.invoiceDelivery === "paper";
  const ibanHolder = [caseData.ibanHolderFirstName, caseData.ibanHolderLastName]
    .filter(Boolean)
    .join(" ");

  // The customer's own tax ID, which is what the holder columns held implicitly
  // on cases filed before the app sent them for its own customer.
  const customerTaxId =
    caseData.user?.codiceFiscale ||
    caseData.user?.businessProfile?.partitaIva ||
    bill.codiceFiscale ||
    bill.partitaIva;
  const legacyHolderTaxCode = ibanHolder ? null : customerTaxId;

  const offer = caseData.selectedOffer;
  // Variable and indexed offers quote a spread over the market index rather
  // than a price of their own — the same rule the offers table renders by.
  const offerPrice =
    offer?.marketType === "variable" || offer?.marketType === "indexed"
      ? offer?.spread
      : isElectricity
        ? offer?.pricePerKwh
        : offer?.pricePerSmc;

  const documents = caseData.documents || [];
  const billFiles: IBillFile[] = bill.files ?? [];

  const files: OverviewFile[] = [
    ...billFiles.map((bf) => ({
      id: `bill-${bf.id}`,
      group: bf.verificationId ? "Re-uploaded Bill" : "Uploaded Bill",
      name: bf.originalName || bf.fileUrl.split("/").pop() || "bill",
      uploadedAt: bf.createdAt,
      url: `${server_url}bills/${bill.id}/files/${bf.id}`,
    })),
    ...documents.map((doc) => ({
      id: `doc-${doc.id}`,
      group: documentTypeLabel[doc.documentType] || doc.documentType,
      name: doc.fileName,
      uploadedAt: doc.createdAt,
      url: `${server_url}cases/${caseData.id}/documents/${doc.id}/file`,
      verified: doc.verified,
    })),
  ];

  const handleDownload = async (file: OverviewFile) => {
    setDownloadingId(file.id);
    try {
      await downloadAuthedFile(file.url, token, file.name);
    } catch {
      message.error("Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  // The bill the case was opened from, as opposed to anything re-uploaded
  // later during verification — what "the original" means on the OCR card.
  const originalBillFiles = files.filter((f) => f.group === "Uploaded Bill");

  const cards: DataCard[] = [
    {
      key: "customer",
      title: "Customer Data",
      rows: [
        { label: "First Name", value: dash(caseData.user?.firstName) },
        { label: "Last Name", value: dash(caseData.user?.lastName) },
        {
          // On a business account this is the person signing for the company,
          // not the company — whose number is the VAT row below.
          label: isBusinessCase ? "Tax Code (signatory)" : "Tax Code",
          value: dash(caseData.user?.codiceFiscale || bill.codiceFiscale),
        },
        // The account's own VAT number where there is one; the bill's OCR'd
        // value is the fallback, since a business account holds it on its
        // profile rather than on the user row. Absent entirely for a private
        // customer, who has no VAT number to be missing.
        ...(caseData.user?.businessProfile?.partitaIva || bill.partitaIva
          ? [
              {
                label: "VAT Number",
                value: (caseData.user?.businessProfile?.partitaIva || bill.partitaIva) as string,
              },
            ]
          : []),
        { label: "Email", value: dash(caseData.user?.email) },
        // Where a company's invoices are actually delivered. Shown next to the
        // VAT number because that is the pair a supplier asks for.
        ...(caseData.user?.businessProfile?.pecEmail
          ? [{ label: "PEC", value: caseData.user.businessProfile.pecEmail }]
          : []),
        ...(caseData.user?.businessProfile?.sdiCode
          ? [
              {
                label: "SDI Code",
                value: caseData.user.businessProfile.sdiCode,
              },
            ]
          : []),
        { label: "Phone", value: dash(caseData.user?.phone) },
      ],
    },
    {
      key: "addresses",
      title: "Addresses",
      content: (
        <div className="space-y-4">
          <AddressBlock
            icon={<LuBuilding2 className="h-3.5 w-3.5" />}
            label="Supply Address"
            value={supplyDisplay}
          />
          <AddressBlock
            icon={<LuHouse className="h-3.5 w-3.5" />}
            label={isBusinessCase ? "Registered Office" : "Residential Address"}
            value={residentialDisplay}
            note={caseData.residentialSameAsSupply ? "Same as supply address" : undefined}
          />
          <AddressBlock
            icon={<LuMail className="h-3.5 w-3.5" />}
            label="Billing / Shipping Address"
            // Only paper invoices are posted anywhere, so for a digital case
            // there is no shipping address to be missing.
            value={isPaper ? shippingDisplay : "Digital invoices — nothing is posted"}
            note={isPaper && caseData.shippingSameAsSupply ? "Same as supply address" : undefined}
          />
        </div>
      ),
    },
    {
      key: "utility",
      title: "Utility & Consumption",
      rows: [
        {
          label: "Utility Type",
          value: (
            <Tag
              color={isElectricity ? "blue" : "orange"}
              className="m-0! rounded-md! border-0! px-2! py-0! text-xs! font-semibold!"
            >
              <span className="flex items-center gap-1">
                {isElectricity ? <LuZap className="h-2.5 w-2.5" /> : <LuFlame className="h-2.5 w-2.5" />}
                {isElectricity ? "Electricity" : "Gas"}
              </span>
            </Tag>
          ),
        },
        { label: "POD / PDR", value: dash(bill.podNumber || bill.pdrNumber) },
        { label: "Current Supplier", value: fromSupplier },
        { label: "Meter Number", value: dash(bill.meterNumber) },
        { label: "Contract Number", value: dash(bill.contractNumber) },
        {
          label: "Annual Consumption (est.)",
          value: formatQuantity(annualConsumption(bill), unit),
        },
      ],
    },
    {
      key: "payment",
      title: "Payment & Billing",
      rows: [
        {
          label: "Payment Method",
          value: caseData.paymentMethod
            ? paymentMethodLabel[caseData.paymentMethod] || caseData.paymentMethod
            : "—",
        },
        // A postal order has no account behind it, so there is no holder to
        // describe. Under direct debit the whole block always shows, including
        // when the account is the customer's own — the mandate is filed against
        // these values whoever they belong to.
        ...(isDirectDebit
          ? [
              // 27 unbroken characters — the one value with no space in it
              // long enough to need the width of the whole card.
              { label: "IBAN", value: dash(caseData.iban), stacked: true },
              {
                label: "Account Holder",
                // Cases filed before the app sent the holder for its own
                // customer have the columns empty; the contract holder is who
                // it was, so name them rather than showing a dash.
                value: ibanHolder || customerName,
              },
              {
                label: "Holder Tax Code / VAT",
                value: dash(caseData.ibanHolderTaxCode || legacyHolderTaxCode),
              },
              {
                label: "IBAN Holder Matches Contract Holder",
                // Whether the mandate needs a second signature turns on this,
                // so an unasked question is reported as unasked rather than
                // answered "No".
                value:
                  caseData.ibanSameAsContract == null ? (
                    <Tag className="m-0! rounded-md! border-0! bg-slate-100! px-2! py-0! text-xs! font-semibold! text-slate-500!">
                      Not recorded
                    </Tag>
                  ) : caseData.ibanSameAsContract ? (
                    <Tag color="green" className="m-0! rounded-md! border-0! px-2! py-0! text-xs! font-semibold!">
                      Yes
                    </Tag>
                  ) : (
                    <Tag color="orange" className="m-0! rounded-md! border-0! px-2! py-0! text-xs! font-semibold!">
                      No — third party
                    </Tag>
                  ),
              },
            ]
          : []),
        {
          label: "Invoice Delivery Method",
          value: caseData.invoiceDelivery
            ? invoiceDeliveryLabel[caseData.invoiceDelivery] || caseData.invoiceDelivery
            : "—",
        },
        ...(caseData.invoiceDelivery === "digital"
          ? [
              {
                label: "Invoice Email",
                value: dash(caseData.invoiceEmail || caseData.user?.email),
              },
            ]
          : []),
      ],
    },
    {
      key: "bill_ocr",
      title: "Bill Data / OCR",
      rows: [
        {
          label: "Bill Period",
          value:
            bill.billingPeriodStart || bill.billingPeriodEnd
              ? `${fmtDateIt(bill.billingPeriodStart)} — ${fmtDateIt(bill.billingPeriodEnd)}`
              : "—",
        },
        { label: "Upload Date", value: fmtDateTime(bill.createdAt) },
        { label: "Total Bill Amount", value: formatMoney(bill.totalAmount) },
        {
          label: "Period Consumption",
          value: formatQuantity(isElectricity ? bill.consumptionKwh : bill.consumptionSmc, unit),
        },
        { label: "Cost per Unit", value: formatUnitPrice(bill.costPerUnit, unit) },
        { label: "Fixed Charges", value: formatMoney(bill.fixedCharges) },
        { label: "Taxes", value: formatMoney(bill.taxes) },
        {
          label: "Detected Supplier",
          value: dash(
            bill.supplierName ||
              bill.supplier?.name ||
              (bill.rawAnalysisData?.ocrSupplierName as string),
          ),
        },
        { label: "Detected Supply Address", value: dash(bill.supplyAddress) },
        {
          label: originalBillFiles.length > 1 ? "Original Uploaded Files" : "Original Uploaded File",
          stacked: true,
          value:
            originalBillFiles.length > 0 ? (
              <div className="space-y-1">
                {originalBillFiles.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleDownload(f)}
                    disabled={downloadingId === f.id}
                    title={f.name}
                    className="flex w-full items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800 disabled:opacity-50"
                  >
                    <FiFileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-left">{f.name}</span>
                    <LuDownload className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            ) : bill.fileUrl ? (
              // Bills stored before the files table existed carry the upload
              // on the bill row itself, where there is no endpoint to fetch it.
              <span className="text-slate-400">1 file (legacy)</span>
            ) : (
              "—"
            ),
        },
      ],
    },
    {
      key: "offer",
      title: "Offer / Contract",
      rows: [
        {
          label: "Selected Supplier",
          value: dash(caseData.toSupplier?.name || offer?.supplier?.name),
        },
        { label: "Offer Name", value: dash(offer?.name) },
        // Supplier tariff codes run long and carry no spaces to break at.
        { label: "Offer Code", value: dash(offer?.offerCode), stacked: true },
        { label: "Price Type", value: dash(offer?.marketType), cap: true },
        {
          label: offer?.marketType === "fixed" ? "Energy Price" : "Spread",
          value: formatUnitPrice(offerPrice, unit),
        },
        {
          label: "Fixed Energy Costs",
          value:
            offer?.fixedMonthlyFee == null
              ? "—"
              : `${formatMoney(offer.fixedMonthlyFee)} / month`,
        },
        {
          label: "Duration",
          value:
            offer?.contractDurationDays == null
              ? "—"
              : offer.contractDurationDays >= 30
                ? `${Math.floor(offer.contractDurationDays / 30)} months`
                : `${offer.contractDurationDays} days`,
        },
        { label: "Estimated Annual Value", value: formatMoney(caseData.estimatedAnnualValue) },
        { label: "Predicted Activation Date", value: fmtDateIt(caseData.activationDate) },
      ],
    },
    {
      key: "documents",
      title: "Documents",
      content:
        files.length === 0 ? (
          <p className="text-xs text-slate-400">Nothing uploaded on this case yet.</p>
        ) : (
          <div className="space-y-3">
            {files.map((f) => (
              <FileRow
                key={f.id}
                file={f}
                onDownload={handleDownload}
                busy={downloadingId === f.id}
              />
            ))}
          </div>
        ),
    },
    {
      key: "case",
      title: "Case Handling",
      rows: [
        { label: "Case Number", value: dash(caseData.caseNumber) },
        { label: "Case Type", value: dash(caseData.caseType?.replace("_", " ")), cap: true },
        { label: "Priority", value: dash(caseData.priority), cap: true },
        {
          label: "Assigned Agent",
          // Named rather than dashed when nobody holds it: an unassigned case
          // is a state someone has to act on, not a value that is missing.
          value: caseData.assignedAgent
            ? `${caseData.assignedAgent.firstName} ${caseData.assignedAgent.lastName}`.trim() ||
              caseData.assignedAgent.email
            : "Unassigned",
        },
        { label: "SLA Deadline", value: fmtDateIt(caseData.slaDeadline) },
        {
          label: "SLA Days",
          value: caseData.slaDaysTotal == null ? "—" : `${caseData.slaDaysTotal} days`,
        },
        { label: "Contract Sent On", value: fmtDateIt(caseData.contractSentAt) },
        { label: "Expiry Date", value: fmtDateIt(caseData.expiryDate) },
        { label: "Created", value: fmtDateIt(caseData.createdAt) },
        { label: "Last Updated", value: fmtDateIt(caseData.updatedAt) },
      ],
    },
  ];

  // The cards as this admin arranged them. `cardOrder` is reconciled against
  // the cards that exist, so every key in it resolves to one.
  const byKey = new Map(cards.map((card) => [card.key, card]));
  const orderedCards = cardOrder.flatMap((key) => {
    const card = byKey.get(key);
    return card ? [card] : [];
  });

  return (
    <div className="space-y-5">
      {/* One button for the whole tab: every field below is corrected in the
          same modal, so the admin never has to guess which card owns one. */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Case Overview</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Everything the switch is filed against, and every field of it is corrected in one
            modal — the supply point read off the bill and the customer's own record included,
            saved back to the bill and the account behind the scenes. Only the offer's tariff
            terms are read-only: they belong to the offer, and editing a copy of them here would
            let the two drift apart. Drag a card by its handle to put it where you want it — the
            arrangement is remembered on this browser.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isCustomOrder && (
            <Button size="small" icon={<LuRotateCcw className="h-3 w-3" />} onClick={resetCardOrder}>
              Reset layout
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            icon={<FiEdit2 className="h-3 w-3" />}
            onClick={() => setEditing(true)}
          >
            Edit Case Data
          </Button>
        </div>
      </div>

      {/* Cards keep their own height and line up at the top, so a short card
          next to the OCR one does not stretch to match it. */}
      <div
        // Three across rather than four: at the 14px the rest of the dashboard
        // sets its values in, a quarter-width card is too narrow for a label
        // and a value on one line, and every identifier breaks mid-token.
        className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3"
        // Dropping in the gaps between cards would otherwise leave the marked
        // card highlighted with nothing having moved.
        onDragOver={(event) => {
          if (!draggingKey) return;
          event.preventDefault();
          // Only when the cursor is in the gaps: an event bubbling up from a
          // card has already marked that card as the target.
          if (event.target === event.currentTarget) setOverKey(null);
        }}
        onDrop={() => {
          setDraggingKey(null);
          setOverKey(null);
        }}
      >
        {orderedCards.map((card) => (
          <OverviewCard key={card.key} cardKey={card.key} title={card.title} drag={cardDrag}>
            {card.content ?? <CardRows rows={card.rows ?? []} />}
          </OverviewCard>
        ))}
      </div>

      {/* The bill goes in too: the supply point the switch is filed against is
          bill data, and an admin correcting a POD should not have to find out
          which tab owns it. */}
      <EditCaseModal
        caseData={caseData}
        bill={bill}
        open={editing}
        onClose={() => setEditing(false)}
      />
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
      await downloadAuthedFile(
        `${server_url}cases/${caseId}/documents/${doc.id}/file`,
        token,
        doc.fileName,
      );
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
