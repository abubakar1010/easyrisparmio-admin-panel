import { Avatar, Button, Dropdown, Input, Tag, type MenuProps } from "antd";
import { FiArrowLeft, FiClock, FiFileText, FiMessageSquare, FiMoreVertical, FiUpload } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { LuBadgeDollarSign, LuBuilding, LuClipboardCheck, LuFileCheck2, LuMessageCircle, LuUser, LuZap } from "react-icons/lu";
import { useNavigate } from "react-router";

type StepItem = {
  id: number;
  title: "In Analysis" | "Result Available" | "Contract to Sign" | "In Progress" | "Activated";
  state: "done" | "current" | "pending";
};

const steps: StepItem[] = [
  { id: 1, title: "In Analysis", state: "done" },
  { id: 2, title: "Result Available", state: "done" },
  { id: 3, title: "Contract to Sign", state: "current" },
  { id: 4, title: "In Progress", state: "pending" },
  { id: 5, title: "Activated", state: "pending" },
];

const timelineEvents = [
  {
    title: "Contract to Sign",
    text: "System sent signature link via email",
    meta: "System • 04/18/2026 14:32",
    current: true,
    icon: <LuFileCheck2 className="h-5 w-5 text-amber-500" />,
    color: "bg-amber-100",
  },
  {
    title: "Result Available",
    text: "Top 3 offers generated. Client chose 'Family Country'",
    meta: "Giuseppe Verdi • 04/18/2026 11:15",
    icon: <LuMessageCircle className="h-5 w-5 text-blue-500" />,
    color: "bg-blue-100",
  },
  {
    title: "Bill OCR completed",
    text: "Extracted consumption: 2,800 kWh. Rate: 0.145 EUR/kWh",
    meta: "System (OCR) • 04/18/2026 10:45",
    icon: <LuClipboardCheck className="h-5 w-5 text-emerald-500" />,
    color: "bg-emerald-100",
  },
  {
    title: "Bill uploaded",
    text: "invoice_rossi_march2026.pdf (1.2 MB)",
    meta: "Giuseppe Verdi • 04/18/2026 10:30",
    icon: <FiUpload className="h-5 w-5 text-indigo-500" />,
    color: "bg-indigo-100",
  },
  {
    title: "Case created",
    text: "Type: Switch • Client: Mario Rossi",
    meta: "Giuseppe Verdi • 04/18/2026 10:28",
    icon: <HiOutlineDocumentText className="h-5 w-5 text-slate-500" />,
    color: "bg-slate-100",
  },
];

const CaseDetailsView = () => {
  const navigate = useNavigate();

  const menuItems: MenuProps["items"] = [
    { key: "1", label: "Edit Case details" },
    { key: "2", label: "Assign to someone else" },
    { type: "divider" },
    { key: "3", label: "Cancel Case", danger: true },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button type="link" className="mb-2 px-0 text-slate-500 hover:text-slate-800" icon={<FiArrowLeft />} onClick={() => navigate("/case-management")}>
            Back to Cases
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-brand tracking-tight">Case #PR-0247</h1>
            <Tag className="m-0 rounded-full border-0 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Contract to Sign</Tag>
          </div>
          <p className="mt-1 text-sm text-slate-500">Mario Rossi • Switch Enel to Eni Plenitude • Opened April 18, 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="rounded-full font-medium" icon={<FiUpload />}>Upload Document</Button>
          <Button type="primary" className="rounded-full bg-brand font-medium">Send Reminder</Button>
          <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
            <Button type="text" className="flex items-center justify-center rounded-full text-slate-500" icon={<FiMoreVertical />} />
          </Dropdown>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Main Info & Timeline) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          {/* Progress Tracker Card */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <h3 className="mb-8 text-lg font-semibold text-brand">Case Progress</h3>
            <div className="relative flex justify-between px-2 sm:px-6">
              {/* Line behind steps */}
              <div className="absolute top-5 left-0 h-1 w-full -translate-y-1/2 rounded-full bg-slate-100"></div>
              <div className="absolute top-5 left-0 h-1 w-1/2 -translate-y-1/2 rounded-full bg-emerald-400 transition-all duration-700 ease-out"></div>

              {steps.map((step) => {
                const isDone = step.state === "done";
                const isCurrent = step.state === "current";
                const circleClass = isDone
                  ? "bg-emerald-500 text-white ring-4 ring-emerald-50 scale-110"
                  : isCurrent
                    ? "bg-amber-500 text-white ring-4 ring-amber-50 shadow-md scale-110"
                    : "bg-white text-slate-400 border-2 border-slate-200";
                const textClass = isDone ? "text-emerald-700 font-medium" : isCurrent ? "text-amber-700 font-bold" : "text-slate-400";

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${circleClass}`}>
                      {isDone ? <LuClipboardCheck className="h-5 w-5" /> : step.id}
                    </div>
                    <span className={`text-center text-xs sm:text-sm w-16 sm:w-24 leading-tight ${textClass}`}>{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Card */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand flex items-center gap-2">
                <FiClock className="text-slate-400" /> Activity Timeline
              </h3>
              <Button type="link" className="text-sm font-medium">View All</Button>
            </div>
            
            <div className="relative pl-4 sm:pl-8">
              {/* Vertical line */}
              <div className="absolute bottom-4 left-[38px] sm:left-[55px] top-4 w-0.5 bg-slate-100"></div>
              
              <div className="space-y-6">
                {timelineEvents.map((event, idx) => (
                  <div key={idx} className="group relative flex gap-4 sm:gap-6">
                    <div className={`relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full shadow-sm ring-4 ring-white ${event.color} transition-transform duration-300 group-hover:scale-110`}>
                      {event.icon}
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:bg-slate-50 hover:shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-brand">{event.title}</h4>
                          {event.current && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Latest</span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-500">{event.meta}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{event.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Internal Notes Quick Form */}
          <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm transition-all hover:shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-brand">Internal Notes</h3>
            <Input.TextArea 
              rows={3} 
              placeholder="Add an internal note or update about this case..." 
              className="resize-none rounded-2xl border-slate-200 bg-white p-4 focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <div className="mt-4 flex justify-end">
              <Button type="primary" className="rounded-full bg-slate-800 px-6 font-medium text-white hover:bg-slate-700">Save Note</Button>
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar Cards) */}
        <div className="flex flex-col gap-6">
          
          {/* Quick Stats/Commission Card */}
          <div className="rounded-3xl border border-transparent bg-gradient-to-br from-brand to-slate-800 p-6 text-white shadow-lg relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-brand/50 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-300">Est. Commission</h3>
                <div className="rounded-full bg-white/10 p-2 backdrop-blur-sm">
                  <LuBadgeDollarSign className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-4xl font-bold tracking-tight">€125.00</p>
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-300 bg-white/5 rounded-full px-3 py-1.5 w-fit border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Pending Contract Signature
              </div>
            </div>
          </div>

          {/* Customer & Case Details Card */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <h3 className="mb-6 text-lg font-semibold text-brand">Case Details</h3>
            
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-transform hover:scale-105">
                  <LuUser className="h-6 w-6" />
                </div>
                <div className="pt-1">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Customer</p>
                  <p className="font-semibold text-brand text-base">Mario Rossi</p>
                  <p className="text-xs text-slate-500">mario.rossi@example.com</p>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100"></div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition-transform hover:scale-105">
                  <LuZap className="h-6 w-6" />
                </div>
                <div className="pt-1">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">POD Number</p>
                  <p className="font-mono text-sm font-bold text-brand mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 w-fit">IT001E12345678</p>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100"></div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-transform hover:scale-105">
                  <LuBuilding className="h-6 w-6" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Switch Request</p>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-sm font-medium line-through text-slate-400">Enel</span>
                    <FiArrowLeft className="rotate-180 text-slate-300" />
                    <span className="text-sm font-bold text-brand">Eni Plenitude</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Documents & Comms Summary */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <h3 className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Resources</h3>
            
            <div className="space-y-2">
              <button className="flex w-full items-center justify-between rounded-2xl border border-transparent bg-slate-50 p-3.5 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <FiFileText className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-slate-700">Documents</span>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm border border-slate-100">3</span>
              </button>

              <button className="flex w-full items-center justify-between rounded-2xl border border-transparent bg-slate-50 p-3.5 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <FiMessageSquare className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-slate-700">Communications</span>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm border border-slate-100">4</span>
              </button>
            </div>
          </div>

          {/* Handler Info */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <Avatar size={48} className="bg-emerald-100 text-emerald-700 font-bold text-lg">GV</Avatar>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Handled by</p>
              <p className="text-sm font-bold text-brand">Giuseppe Verdi</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CaseDetailsView;

