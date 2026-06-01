import { useState } from "react";
import { Avatar, Button, Input, Select, Tag, message } from "antd";
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

type StepState = "done" | "current" | "pending";
type Step = { id: number; title: string; state: StepState };

const steps: Step[] = [
  { id: 1, title: "Submission", state: "done" },
  { id: 2, title: "Review", state: "done" },
  { id: 3, title: "Approval", state: "current" },
  { id: 4, title: "Payout", state: "pending" },
];

const timelineEvents = [
  {
    title: "Contract to Sign",
    badge: "URGENT",
    text: "Screen sent signature link via email",
    author: "by System",
    time: "04/09/2025 16:32",
    icon: <LuFileCheck2 className="h-5 w-5 text-amber-500" />,
    color: "bg-amber-100",
  },
  {
    title: "Result Available",
    text: "Top 3 fares generated: Clean Elect, Family Country",
    author: "by Giuseppe Rossi",
    time: "04/09/2025 17:05",
    icon: <FiCheckCircle className="h-5 w-5 text-blue-500" />,
    color: "bg-blue-100",
  },
  {
    title: "Bill OCR completed",
    text: "Extracted consumption: 2,000 KWh; Rate: 0.15 EUR/KWh",
    author: "by System - OCR",
    time: "03/09/2025 09:42",
    icon: <LuScanLine className="h-5 w-5 text-emerald-500" />,
    color: "bg-emerald-100",
  },
  {
    title: "Bill uploaded",
    text: "INVOICE_OCR_APR2025.pdf • 2 MB",
    author: "by Giuseppe Rossi",
    time: "02/09/2025 12:43",
    icon: <LuUpload className="h-5 w-5 text-indigo-500" />,
    color: "bg-indigo-100",
  },
  {
    title: "Case created",
    text: "Case: Clean Elect Italia Team",
    author: "by System",
    time: "01/09/2025 14:25",
    icon: <LuFilePlus2 className="h-5 w-5 text-slate-500" />,
    color: "bg-slate-100",
  },
];

const documentGroups = [
  { label: "Bills", count: 3, icon: <LuReceipt className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-600" },
  { label: "Customer Documents", count: 5, icon: <FiFileText className="h-4 w-4" />, color: "bg-blue-100 text-blue-600" },
  { label: "Contracts", count: 2, icon: <LuFileCheck2 className="h-4 w-4" />, color: "bg-violet-100 text-violet-600" },
  { label: "Uploaded Files", count: 1, icon: <LuUpload className="h-4 w-4" />, color: "bg-amber-100 text-amber-600" },
];

const statusOptions = ["Pending Docs", "In Review", "Approved", "Paid Out", "KO"].map((s) => ({ value: s, label: s }));

const CaseDetailsView = () => {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [status, setStatus] = useState("Pending Docs");
  const [note, setNote] = useState("");

  const caseLabel = caseId ? `Case #${caseId}` : "Case #PR-0247";

  return (
    <div className="space-y-5 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page intro */}
      <div>
        <p className="text-sm font-medium text-slate-500">Welcome to admin portal</p>
        <p className="text-xs text-slate-400">Here's what's happening today</p>
      </div>

      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button type="link" className="mb-1 h-auto px-0 text-slate-500 hover:text-slate-800" icon={<FiArrowLeft />} onClick={() => navigate("/case-management")}>
            Back to Cases
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{caseLabel}</h1>
            <Tag className="m-0 rounded-md border-0 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">Pending Docs</Tag>
          </div>
          <p className="mt-1 text-sm text-slate-500">Data creazione: 01/09/2025 • Ultimo aggiornamento: 04/09/2025 16:32</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="h-10 rounded-lg font-medium" icon={<FiUpload />} onClick={() => message.info("Upload document")}>
            Upload Document
          </Button>
          <Button type="primary" className="h-10 rounded-lg bg-blue-600 font-medium hover:bg-blue-700" onClick={() => message.success("Reminder sent")}>
            Send Reminder
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Case Progress */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-8 text-base font-semibold text-slate-800">Case Progress</h3>
            <div className="relative flex justify-between px-2 sm:px-4">
              <div className="absolute top-5 left-0 h-1 w-full -translate-y-1/2 rounded-full bg-slate-100" />
              <div className="absolute top-5 left-0 h-1 w-1/3 -translate-y-1/2 rounded-full bg-emerald-400 transition-all duration-700" />
              {steps.map((step) => {
                const isDone = step.state === "done";
                const isCurrent = step.state === "current";
                const circleClass = isDone
                  ? "bg-emerald-500 text-white"
                  : isCurrent
                    ? "bg-orange-500 text-white ring-4 ring-orange-50"
                    : "bg-slate-200 text-slate-400";
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
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Activity Timeline</h3>
              <Button type="link" className="px-0 text-sm font-medium">View All</Button>
            </div>
            <div className="space-y-5">
              {timelineEvents.map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${event.color}`}>{event.icon}</div>
                    {idx < timelineEvents.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-slate-100" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-800">{event.title}</h4>
                        {event.badge && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">{event.badge}</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{event.time}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{event.text}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{event.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Case Actions */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Case Actions</h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm text-slate-500">Change Status</label>
              <Select
                value={status}
                onChange={setStatus}
                options={statusOptions}
                className="w-full [&_.ant-select-selector]:h-11! [&_.ant-select-selector]:rounded-lg [&_.ant-select-selection-item]:leading-[42px]!"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                icon={<FiCheckCircle />}
                onClick={() => message.success("Case validated")}
                className="h-11 rounded-lg border-emerald-200 bg-emerald-50 font-medium text-emerald-600 hover:border-emerald-300! hover:text-emerald-700!"
              >
                Validate
              </Button>
              <Button
                icon={<FiEdit2 />}
                onClick={() => message.info("Modify case data")}
                className="h-11 rounded-lg border-blue-200 bg-blue-50 font-medium text-blue-600 hover:border-blue-300! hover:text-blue-700!"
              >
                Modify Data
              </Button>
              <Button
                icon={<FiXCircle />}
                onClick={() => message.warning("Case marked as KO")}
                className="h-11 rounded-lg border-rose-200 bg-rose-50 font-medium text-rose-500 hover:border-rose-300! hover:text-rose-600!"
              >
                Mark as KO
              </Button>
              <Button
                type="primary"
                icon={<FiSave />}
                onClick={() => message.success(`Case updated — status: ${status}`)}
                className="h-11 rounded-lg bg-[#8b85f6] font-semibold hover:bg-[#7a74e5]"
              >
                Update Case
              </Button>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Internal Notes</h3>
            <Input.TextArea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add internal note visible only to the team..."
              className="resize-none rounded-lg border-slate-200"
            />
            <div className="mt-4 flex justify-end">
              <Button
                type="primary"
                disabled={!note.trim()}
                onClick={() => {
                  message.success("Note saved");
                  setNote("");
                }}
                className="h-10 rounded-lg bg-[#8b85f6] px-6 font-semibold hover:bg-[#7a74e5]"
              >
                Save Note
              </Button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* File Commission */}
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">File Commission</span>
              <button type="button" className="text-sm font-medium text-slate-300 hover:text-white" onClick={() => message.info("Edit commission")}>
                Edit
              </button>
            </div>
            <p className="mt-3 flex items-center gap-2 text-3xl font-bold">
              <LuBadgeDollarSign className="h-6 w-6 text-emerald-400" />
              €125.00
            </p>
            <p className="mt-2 text-xs text-slate-400">To Pending Commission Payment</p>
          </div>

          {/* Case Details */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Case Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <FiFileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Policy Type</p>
                  <p className="text-sm font-semibold text-slate-700">Electric Repeat</p>
                  <p className="text-xs text-slate-500">Clean Elect Italia Team</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <FiPhone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone Number</p>
                  <p className="text-sm font-semibold text-slate-700">(FRR)31334742974</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <FiMail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-sm font-semibold text-slate-700">mario.rossi@example.com</p>
                  <button type="button" className="text-xs font-medium text-blue-500 hover:text-blue-600" onClick={() => message.info("Set password link sent")}>
                    Set Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Documents</h3>
              <Button type="link" className="px-0 text-sm font-medium">View All</Button>
            </div>
            <div className="space-y-1">
              {documentGroups.map((doc) => (
                <button
                  key={doc.label}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${doc.color}`}>{doc.icon}</div>
                    <span className="text-sm font-medium text-slate-700">{doc.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-xs">{doc.count} files</span>
                    <FiChevronRight className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Communications */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Communications</h3>
              <Button type="link" className="px-0 text-sm font-medium">View All</Button>
            </div>
            <button type="button" className="flex w-full items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <LuMessageSquare className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-700">Email History</p>
                  <p className="text-xs text-slate-400">12 messages</p>
                </div>
              </div>
              <FiChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Assigned To */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-slate-800">Assigned To</h3>
            <div className="flex items-center gap-3">
              <Avatar size={44} className="bg-indigo-100 font-bold text-indigo-600">GR</Avatar>
              <div>
                <p className="text-sm font-semibold text-slate-800">Giuseppe Rossi</p>
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
