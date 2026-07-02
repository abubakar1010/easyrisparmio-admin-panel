import { useState } from "react";
import { Avatar, Button, Input, Select, Spin, Empty, Tag, message } from "antd";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiChevronRight,
  FiEdit2,
  FiFileText,
  FiMail,
  FiPhone,
  FiSave,
  FiUpload,
  FiXCircle,
} from "react-icons/fi";
import { LuBadgeDollarSign, LuFileCheck2, LuFilePlus2, LuMessageSquare, LuReceipt, LuScanLine, LuUpload } from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import { useGetCaseByIdQuery, useUpdateCaseMutation, type ICaseEvent } from "../../redux/features/Cases/caseApi";

type StepState = "done" | "current" | "pending";
type Step = { id: number; title: string; key: string; state: StepState };

const statusOrder = ["new", "in_progress", "documents_pending", "contract_sent", "contract_signed", "activated"];

const statusOptions = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "documents_pending", label: "Documents Pending" },
  { value: "contract_sent", label: "Contract Sent" },
  { value: "contract_signed", label: "Contract Signed" },
  { value: "activated", label: "Activated" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const eventIconMap: Record<string, { icon: React.ReactNode; color: string }> = {
  STATUS_CHANGE: { icon: <FiCheckCircle className="h-5 w-5 text-blue-500" />, color: "bg-blue-100" },
  DOCUMENT_UPLOADED: { icon: <LuUpload className="h-5 w-5 text-indigo-500" />, color: "bg-indigo-100" },
  DOCUMENT_VERIFIED: { icon: <LuFileCheck2 className="h-5 w-5 text-emerald-500" />, color: "bg-emerald-100" },
  OCR_COMPLETED: { icon: <LuScanLine className="h-5 w-5 text-emerald-500" />, color: "bg-emerald-100" },
  CONTRACT_GENERATED: { icon: <LuFileCheck2 className="h-5 w-5 text-amber-500" />, color: "bg-amber-100" },
  CONTRACT_SIGNED: { icon: <LuFileCheck2 className="h-5 w-5 text-green-500" />, color: "bg-green-100" },
  ADMIN_ASSIGNED: { icon: <FiEdit2 className="h-5 w-5 text-purple-500" />, color: "bg-purple-100" },
  NOTE_ADDED: { icon: <LuMessageSquare className="h-5 w-5 text-slate-500" />, color: "bg-slate-100" },
  SYSTEM_EVENT: { icon: <LuFilePlus2 className="h-5 w-5 text-slate-500" />, color: "bg-slate-100" },
};

function getSteps(caseStatus: string): Step[] {
  const idx = statusOrder.indexOf(caseStatus);
  return [
    { id: 1, title: "Submission", key: "new", state: idx >= 0 ? "done" : "pending" },
    { id: 2, title: "Review", key: "in_progress", state: idx >= 1 ? (idx > 1 ? "done" : "current") : "pending" },
    { id: 3, title: "Approval", key: "contract_sent", state: idx >= 3 ? (idx > 3 ? "done" : "current") : idx >= 2 ? "current" : "pending" },
    { id: 4, title: "Activated", key: "activated", state: idx >= 5 ? "done" : idx >= 4 ? "current" : "pending" },
  ];
}

const CaseDetailsView = () => {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const { data: caseData, isLoading } = useGetCaseByIdQuery(caseId!, { skip: !caseId });
  const [updateCase, { isLoading: isUpdating }] = useUpdateCaseMutation();

  const [status, setStatus] = useState<string>("");
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
        <Button onClick={() => navigate("/case-management")} icon={<FiArrowLeft />}>Back to Cases</Button>
      </div>
    );
  }

  const currentStatus = status || caseData.status;
  const steps = getSteps(caseData.status);
  const progressPercent = Math.max(0, Math.min(100, (statusOrder.indexOf(caseData.status) / (statusOrder.length - 1)) * 100));
  const customerName = caseData.user ? `${caseData.user.firstName} ${caseData.user.lastName}` : "—";
  const agentName = caseData.assignedAgent ? `${caseData.assignedAgent.firstName} ${caseData.assignedAgent.lastName}` : "Unassigned";
  const events = (caseData.events || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const docCount = caseData.documents?.length || 0;

  const handleUpdateCase = async () => {
    try {
      await updateCase({ id: caseData.id, data: { status: currentStatus } }).unwrap();
      message.success("Case updated");
    } catch {
      message.error("Failed to update case");
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

  const handleReject = async () => {
    try {
      await updateCase({ id: caseData.id, data: { status: "rejected" } }).unwrap();
      message.warning("Case rejected");
    } catch {
      message.error("Failed to reject case");
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <p className="text-sm font-medium text-slate-500">Welcome to admin portal</p>
        <p className="text-xs text-slate-400">Here's what's happening today</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button type="link" className="mb-1 h-auto px-0 text-slate-500 hover:text-slate-800" icon={<FiArrowLeft />} onClick={() => navigate("/case-management")}>
            Back to Cases
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{caseData.caseNumber || `Case #${caseId}`}</h1>
            <Tag className="m-0 rounded-md border-0 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 capitalize">
              {caseData.status.replace(/_/g, " ")}
            </Tag>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Created: {new Date(caseData.createdAt).toLocaleDateString("it-IT")} &bull; Updated: {new Date(caseData.updatedAt).toLocaleDateString("it-IT")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="h-10 rounded-lg font-medium" icon={<FiUpload />}>Upload Document</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Case Progress */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-8 text-base font-semibold text-slate-800">Case Progress</h3>
            <div className="relative flex justify-between px-2 sm:px-4">
              <div className="absolute top-5 left-0 h-1 w-full -translate-y-1/2 rounded-full bg-slate-100" />
              <div className="absolute top-5 left-0 h-1 -translate-y-1/2 rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
              {steps.map((step) => {
                const isDone = step.state === "done";
                const isCurrent = step.state === "current";
                const circleClass = isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-orange-500 text-white ring-4 ring-orange-50" : "bg-slate-200 text-slate-400";
                const textClass = isDone ? "text-slate-700 font-medium" : isCurrent ? "text-orange-600 font-semibold" : "text-slate-400";
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${circleClass}`}>
                      {isDone ? <FiCheckCircle className="h-5 w-5" /> : step.id}
                    </div>
                    <span className={`text-center text-sm ${textClass}`}>{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-base font-semibold text-slate-800">Activity Timeline</h3>
            {events.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              <div className="space-y-5">
                {events.map((event: ICaseEvent, idx: number) => {
                  const ei = eventIconMap[event.eventType] || eventIconMap.SYSTEM_EVENT;
                  return (
                    <div key={event.id} className="flex gap-4">
                      <div className="relative flex flex-col items-center">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ei.color}`}>{ei.icon}</div>
                        {idx < events.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-slate-100" />}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-800">{event.title}</h4>
                          <span className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleString("it-IT")}</span>
                        </div>
                        {event.description && <p className="mt-0.5 text-sm text-slate-600">{event.description}</p>}
                        {event.actorLabel && <p className="mt-0.5 text-xs text-slate-400">by {event.actorLabel}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Case Actions */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Case Actions</h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm text-slate-500">Change Status</label>
              <Select
                value={currentStatus}
                onChange={setStatus}
                options={statusOptions}
                className="w-full [&_.ant-select-selector]:h-11! [&_.ant-select-selector]:rounded-lg [&_.ant-select-selection-item]:leading-[42px]!"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button icon={<FiCheckCircle />} onClick={handleUpdateCase} loading={isUpdating}
                className="h-11 rounded-lg border-emerald-200 bg-emerald-50 font-medium text-emerald-600 hover:border-emerald-300! hover:text-emerald-700!">
                Validate
              </Button>
              <Button icon={<FiXCircle />} onClick={handleReject}
                className="h-11 rounded-lg border-rose-200 bg-rose-50 font-medium text-rose-500 hover:border-rose-300! hover:text-rose-600!">
                Mark as KO
              </Button>
              <Button type="primary" icon={<FiSave />} onClick={handleUpdateCase} loading={isUpdating} className="h-11 rounded-lg bg-[#8b85f6] font-semibold hover:bg-[#7a74e5] sm:col-span-2">
                Update Case
              </Button>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Internal Notes</h3>
            {caseData.internalNotes && (
              <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{caseData.internalNotes}</div>
            )}
            <Input.TextArea rows={4} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Add internal note visible only to the team..." className="resize-none rounded-lg border-slate-200" />
            <div className="mt-4 flex justify-end">
              <Button type="primary" disabled={!note.trim()} onClick={handleSaveNote} loading={isUpdating}
                className="h-10 rounded-lg bg-[#8b85f6] px-6 font-semibold hover:bg-[#7a74e5]">
                Save Note
              </Button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Commission */}
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
            <span className="text-sm text-slate-300">Estimated Annual Value</span>
            <p className="mt-3 flex items-center gap-2 text-3xl font-bold">
              <LuBadgeDollarSign className="h-6 w-6 text-emerald-400" />
              {caseData.estimatedAnnualValue ? `€${Number(caseData.estimatedAnnualValue).toFixed(2)}` : "—"}
            </p>
          </div>

          {/* Case Details */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Case Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><FiFileText className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs text-slate-400">Offer</p>
                  <p className="text-sm font-semibold text-slate-700">{caseData.selectedOffer?.name || "—"}</p>
                  <p className="text-xs text-slate-500">{caseData.selectedOffer?.supplier?.name || ""}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><FiPhone className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs text-slate-400">Customer</p>
                  <p className="text-sm font-semibold text-slate-700">{customerName}</p>
                  <p className="text-xs text-slate-500">{caseData.user?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><FiMail className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs text-slate-400">Switch</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {caseData.fromSupplier?.name || "—"} → {caseData.toSupplier?.name || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-slate-800">Documents</h3>
            <button type="button" className="flex w-full items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><LuReceipt className="h-4 w-4" /></div>
                <span className="text-sm font-medium text-slate-700">All Documents</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-xs">{docCount} files</span>
                <FiChevronRight className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* Assigned To */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-slate-800">Assigned To</h3>
            <div className="flex items-center gap-3">
              <Avatar size={44} className="bg-indigo-100 font-bold text-indigo-600">
                {caseData.assignedAgent ? `${caseData.assignedAgent.firstName[0]}${caseData.assignedAgent.lastName[0]}` : "?"}
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-slate-800">{agentName}</p>
                <p className="text-xs text-slate-400">Support Agent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsView;
