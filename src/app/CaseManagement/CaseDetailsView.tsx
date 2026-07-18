import { useState } from "react";
import { Button, Input, Spin, Empty, Tag, Select, Upload, message } from "antd";
import {
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiSend,
} from "react-icons/fi";
import {
  LuArrowRight,
  LuBadgeDollarSign,
  LuDownload,
  LuFileCheck2,
  LuFilePlus2,
  LuMessageSquare,
  LuScanLine,
  LuUpload,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
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

const statusOrder = [
  "new",
  "in_progress",
  "documents_pending",
  "contract_sent",
  "contract_signed",
  "activated",
];

const stepConfig = [
  { label: "In Analysis", maxIdx: 1 },
  { label: "Result Available", maxIdx: 2 },
  { label: "Contract to Sign", maxIdx: 3 },
  { label: "In Progress", maxIdx: 4 },
  { label: "Activated", maxIdx: 5 },
];

const statusLabel: Record<string, string> = {
  new: "New",
  in_progress: "In Analysis",
  documents_pending: "Result Available",
  contract_sent: "Contract to Sign",
  contract_signed: "In Progress",
  activated: "Activated",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const statusTagColor: Record<string, string> = {
  new: "blue",
  in_progress: "processing",
  documents_pending: "default",
  contract_sent: "red",
  contract_signed: "orange",
  activated: "green",
  rejected: "red",
  cancelled: "default",
};

const caseTypeColor: Record<string, string> = {
  switch: "orange",
  transfer: "cyan",
  takeover: "purple",
  new_connection: "blue",
};

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

/* ── Helpers ──────────────────────────────────────────────── */

function getStepStates(status: string): ("done" | "current" | "pending")[] {
  const idx = statusOrder.indexOf(status);
  if (idx < 0) return stepConfig.map(() => "pending");
  return stepConfig.map((step, i) => {
    if (idx >= step.maxIdx) return "done";
    if (i === 0 ? idx <= step.maxIdx : idx > stepConfig[i - 1].maxIdx && idx <= step.maxIdx)
      return "current";
    return "pending";
  });
}

function getNextStatus(current: string): string | null {
  const idx = statusOrder.indexOf(current);
  return idx >= 0 && idx < statusOrder.length - 1 ? statusOrder[idx + 1] : null;
}

/* ── Tab definitions ─────────────────────────────────────── */

const tabKeys = [
  { key: "timeline", label: "Timeline" },
  { key: "case_data", label: "Case data" },
  { key: "documents", label: "Documents", counted: true },
  { key: "contract", label: "Contract" },
  { key: "communications", label: "Communications", counted: true },
  { key: "internal_notes", label: "Internal notes" },
  { key: "commission", label: "Commission" },
] as const;

/* ── Main Component ──────────────────────────────────────── */

const CaseDetailsView = () => {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const { data: caseData, isLoading } = useGetCaseByIdQuery(caseId!, { skip: !caseId });
  const [updateCase, { isLoading: isUpdating }] = useUpdateCaseMutation();
  const [activeTab, setActiveTab] = useState("timeline");
  const [note, setNote] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Empty description="Case not found" />
        <Button onClick={() => navigate("/case-management")} icon={<FiArrowLeft />}>
          Back to Cases
        </Button>
      </div>
    );
  }

  const stepStates = getStepStates(caseData.status);
  const currentStepIdx = stepStates.indexOf("current");
  const doneCount = stepStates.filter((s) => s === "done").length;
  const progressPct =
    currentStepIdx >= 0
      ? (currentStepIdx / (stepConfig.length - 1)) * 100
      : doneCount === stepConfig.length
        ? 100
        : 0;

  const customerName = caseData.user
    ? `${caseData.user.firstName} ${caseData.user.lastName}`
    : "—";
  const agentName = caseData.assignedAgent
    ? `${caseData.assignedAgent.firstName} ${caseData.assignedAgent.lastName}`
    : null;
  const events = [...(caseData.events || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const docCount = caseData.documents?.length || 0;
  const commCount = events.filter(
    (e) => e.eventType === "NOTE_ADDED" || e.eventType === "SYSTEM_EVENT",
  ).length;

  const fromSupplier = caseData.fromSupplier?.name;
  const toSupplier = caseData.toSupplier?.name;
  const switchText =
    fromSupplier && toSupplier
      ? `${fromSupplier} → ${toSupplier}`
      : fromSupplier || toSupplier || "";

  const agentShort = agentName
    ? `${agentName.split(" ")[0][0]}. ${agentName.split(" ").slice(1).join(" ")}`
    : null;

  const handleAdvance = async () => {
    const next = getNextStatus(caseData.status);
    if (!next) return;
    try {
      await updateCase({ id: caseData.id, data: { status: next } }).unwrap();
      message.success(`Status advanced to ${statusLabel[next]}`);
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

  const tabCounts: Record<string, number> = {
    documents: docCount,
    communications: commCount,
  };

  const renderTab = () => {
    switch (activeTab) {
      case "timeline":
        return <TimelineTab events={events} />;
      case "case_data":
        return <CaseDataTab caseData={caseData} />;
      case "documents":
        return <DocumentsTab documents={caseData.documents || []} />;
      case "contract":
        return <ContractTab caseData={caseData} />;
      case "communications":
        return <CommunicationsTab />;
      case "internal_notes":
        return (
          <InternalNotesTab
            existing={caseData.internalNotes}
            note={note}
            setNote={setNote}
            onSave={handleSaveNote}
            saving={isUpdating}
          />
        );
      case "commission":
        return <CommissionTab caseData={caseData} />;
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
              {caseData.caseNumber || `#${caseId?.slice(0, 8)}`}
            </Tag>
            <Tag
              color={caseTypeColor[caseData.caseType] || "default"}
              className="m-0! rounded-md! border-0! px-2.5! py-0.5! text-xs! font-semibold! capitalize!"
            >
              {caseData.caseType?.replace("_", " ")}
            </Tag>
            <Tag
              color={statusTagColor[caseData.status] || "default"}
              className="m-0! rounded-md! border-0! px-2.5! py-0.5! text-xs! font-semibold!"
            >
              {statusLabel[caseData.status] || caseData.status}
            </Tag>
            {agentShort && (
              <Tag className="m-0! rounded-md! border-0! bg-purple-50! px-2.5! py-0.5! text-xs! font-semibold! text-purple-600!">
                Handled by {agentShort}
              </Tag>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-800">
            {customerName}
            {switchText && (
              <span className="font-bold">
                {" "}
                — {caseData.caseType?.replace("_", " ")}{" "}
                <span className="capitalize">{switchText}</span>
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {caseData.meterId && (
              <>
                POD {caseData.meterId}
                {" • "}
              </>
            )}
            {caseData.selectedOffer?.name && (
              <>
                Offer: {caseData.selectedOffer.name}
                {" • "}
              </>
            )}
            Opened{" "}
            {new Date(caseData.createdAt).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            })}
          </p>

          {/* ── Stepper ────────────────────────────────── */}
          <div className="relative flex items-start justify-between mt-8 mb-6 px-2 sm:px-6">
            {/* Track background */}
            <div className="absolute top-5 left-[10%] right-[10%] h-[3px] -translate-y-1/2 rounded-full bg-slate-200" />
            {/* Track progress */}
            <div
              className="absolute top-5 left-[10%] h-[3px] -translate-y-1/2 rounded-full bg-emerald-400 transition-all duration-700"
              style={{ width: `${progressPct * 0.8}%` }}
            />

            {stepConfig.map((step, i) => {
              const s = stepStates[i];
              return (
                <div key={step.label} className="relative z-10 flex flex-col items-center gap-2.5 w-[80px]">
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
              icon={<FiSend className="h-3.5 w-3.5" />}
              className="h-10 rounded-lg border-slate-200 font-medium text-slate-600"
            >
              Send message
            </Button>
            <Button
              type="primary"
              icon={<LuArrowRight className="h-4 w-4" />}
              onClick={handleAdvance}
              loading={isUpdating}
              disabled={!getNextStatus(caseData.status)}
              className="h-10 rounded-lg bg-slate-800! hover:bg-slate-700! border-0! font-semibold"
            >
              Advance Status
            </Button>
          </div>
        </div>

        {/* ── Tabs Navigation ──────────────────────────── */}
        <div className="border-b border-slate-200">
          <div className="flex gap-0 overflow-x-auto px-6">
            {tabKeys.map((tab) => {
              const active = activeTab === tab.key;
              const count = tab.counted ? tabCounts[tab.key] : null;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    active ? "text-[#7061ED]" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {tab.label}
                    {count != null && count > 0 && (
                      <span
                        className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
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

        {/* ── Tab Content ──────────────────────────────── */}
        <div className="p-6">{renderTab()}</div>
      </div>
    </div>
  );
};

/* ── Timeline Tab ────────────────────────────────────────── */

function TimelineTab({ events }: { events: ICaseEvent[] }) {
  if (events.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-400">No activity yet.</p>;
  }

  return (
    <div className="space-y-6">
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
                {new Date(event.createdAt).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}{" "}
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

/* ── Case Data Tab ───────────────────────────────────────── */

function CaseDataTab({ caseData }: { caseData: ICase }) {
  const customerName = caseData.user
    ? `${caseData.user.firstName} ${caseData.user.lastName}`
    : "—";

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
          value: caseData.slaDeadline
            ? new Date(caseData.slaDeadline).toLocaleDateString("en-US")
            : "—",
        },
      ],
    },
    {
      title: "Assignment & Dates",
      rows: [
        {
          label: "Assigned Agent",
          value: caseData.assignedAgent
            ? `${caseData.assignedAgent.firstName} ${caseData.assignedAgent.lastName}`
            : "Unassigned",
        },
        { label: "Case Number", value: caseData.caseNumber || "—" },
        { label: "Created", value: new Date(caseData.createdAt).toLocaleDateString("en-US") },
        { label: "Last Updated", value: new Date(caseData.updatedAt).toLocaleDateString("en-US") },
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

/* ── Documents Tab ───────────────────────────────────────── */

function DocumentsTab({ documents }: { documents: ICaseDocument[] }) {
  if (documents.length === 0) {
    return (
      <div className="py-12">
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

/* ── Communications Tab ──────────────────────────────────── */

function CommunicationsTab() {
  return (
    <div className="py-12">
      <Empty description="No communications yet" />
    </div>
  );
}

/* ── Internal Notes Tab ──────────────────────────────────── */

function InternalNotesTab({
  existing,
  note,
  setNote,
  onSave,
  saving,
}: {
  existing: string | null;
  note: string;
  setNote: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      {existing && (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{existing}</div>
      )}
      <Input.TextArea
        rows={4}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add internal note visible only to the team..."
        className="resize-none rounded-xl! border-slate-200"
      />
      <div className="flex justify-end">
        <Button
          type="primary"
          disabled={!note.trim()}
          onClick={onSave}
          loading={saving}
          className="h-10 rounded-lg bg-[#7061ED]! hover:bg-[#5f52d4]! px-6 font-semibold"
        >
          Save Note
        </Button>
      </div>
    </div>
  );
}

/* ── Contract Tab ───────────────────────────────────────── */

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

function ContractTab({ caseData }: { caseData: ICase }) {
  const { data: contract, isLoading, error } = useGetContractByCaseQuery(caseData.id);
  const [createContract, { isLoading: isCreating }] = useCreateContractMutation();
  const [updateContract, { isLoading: isUpdatingContract }] = useUpdateContractMutation();

  const [contractNumber, setContractNumber] = useState("");
  const [podPdrNumber, setPodPdrNumber] = useState(caseData.bill?.podNumber || caseData.bill?.pdrNumber || "");
  const [deliveryMethod, setDeliveryMethod] = useState<string | undefined>(undefined);
  const [documentUrl, setDocumentUrl] = useState("");
  const [activationDate, setActivationDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

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
        if (activationDate) data.activationDate = activationDate;
        if (expiryDate) data.expiryDate = expiryDate;
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
            Contract has been sent via {contract.deliveryMethod ? deliveryMethodLabel[contract.deliveryMethod] : "unknown method"}. Waiting for the customer to sign and upload the signed document.
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
              <Input
                type="date"
                value={activationDate}
                onChange={(e) => setActivationDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Expiry Date</label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="rounded-lg"
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

/* ── Commission Tab ──────────────────────────────────────── */

function CommissionTab({ caseData }: { caseData: ICase }) {
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

export default CaseDetailsView;
