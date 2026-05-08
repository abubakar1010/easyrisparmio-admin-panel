import { Button, Input, Tabs, Tag } from "antd";
import { FiArrowLeft, FiMessageSquare, FiUpload } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { LuBadgeDollarSign, LuClipboardCheck, LuFileCheck2, LuMessageCircle } from "react-icons/lu";
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
    icon: <LuFileCheck2 className="h-4 w-4 text-amber-600" />,
  },
  {
    title: "Result Available",
    text: "Top 3 offers generated. Client chose 'Family Country'",
    meta: "Giuseppe Verdi • 04/18/2026 11:15",
    icon: <LuMessageCircle className="h-4 w-4 text-slate-500" />,
  },
  {
    title: "Bill OCR completed",
    text: "Extracted consumption: 2,800 kWh. Rate: 0.145 EUR/kWh",
    meta: "System (OCR) • 04/18/2026 10:45",
    icon: <LuClipboardCheck className="h-4 w-4 text-slate-500" />,
  },
  {
    title: "Bill uploaded",
    text: "invoice_rossi_march2026.pdf (1.2 MB)",
    meta: "Giuseppe Verdi • 04/18/2026 10:30",
    icon: <FiUpload className="h-4 w-4 text-slate-500" />,
  },
  {
    title: "Case created",
    text: "Type: Switch • Client: Mario Rossi",
    meta: "Giuseppe Verdi • 04/18/2026 10:28",
    icon: <HiOutlineDocumentText className="h-4 w-4 text-slate-500" />,
  },
];

const CaseDetailsView = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Button type="link" className="px-0 text-owngray" icon={<FiArrowLeft />} onClick={() => navigate("/case-management")}>
        Back
      </Button>
      <section className="rounded-2xl border border-cborder/60 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <Tag className="rounded-full border-0 bg-slate-100 px-2 py-0.5 text-slate-600">PR-0247</Tag>
          <Tag className="rounded-full border-0 bg-amber-50 px-2 py-0.5 text-amber-700">Switch</Tag>
          <Tag className="rounded-full border-0 bg-rose-50 px-2 py-0.5 text-rose-700">Contract to Sign</Tag>
          <Tag className="rounded-full border-0 bg-indigo-50 px-2 py-0.5 text-indigo-700">Handled by G. Verdi</Tag>
        </div>

        <h3 className="text-4xl font-semibold text-brand">Mario Rossi - Switch Enel - Eni Plenitude</h3>
        <p className="mt-1 text-sm text-owngray">POD IT001E12345678 • Offer: Family Country • Opened 04/18/2026</p>

        <div className="mt-6 grid grid-cols-5 gap-2">
          {steps.map((step, idx) => {
            const isDone = step.state === "done";
            const isCurrent = step.state === "current";
            const circleClass = isDone
              ? "bg-emerald-500 text-white"
              : isCurrent
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-500";
            const textClass = isDone ? "text-emerald-600" : isCurrent ? "text-amber-600" : "text-slate-500";
            const lineClass = idx < 2 ? "bg-emerald-300" : "bg-slate-200";
            return (
              <div key={step.id} className="flex items-center gap-2">
                <div className="flex min-w-0 flex-col items-center gap-2">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${circleClass}`}>
                    {step.id}
                  </span>
                  <span className={`text-center text-xs font-medium ${textClass}`}>{step.title}</span>
                </div>
                {idx !== steps.length - 1 ? <span className={`mt-[-18px] h-[2px] flex-1 ${lineClass}`} /> : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-cborder/60 bg-white shadow-sm">
        <Tabs
          defaultActiveKey="timeline"
          className="px-4! pt-2"
          items={[
            {
              key: "timeline",
              label: "Timeline",
              children: (
                <div className="space-y-6 py-4">
                  {timelineEvents.map((event) => (
                    <div key={event.title} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                        {event.icon}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-brand">{event.title}</p>
                          {event.current ? (
                            <Tag className="rounded border-0 bg-amber-50 text-[10px] font-semibold text-amber-700">CURRENT</Tag>
                          ) : null}
                        </div>
                        <p className="text-sm text-owngray">{event.text}</p>
                        <p className="mt-1 text-xs text-slate-400">{event.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: "case-data",
              label: "Case data",
              children: (
                <div className="grid gap-4 p-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium text-owngray">Customer Name</p>
                    <div className="rounded-lg bg-slate-100 px-3 py-2 text-brand">Mario Rossi</div>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-owngray">POD Number</p>
                    <div className="rounded-lg bg-slate-100 px-3 py-2 text-brand">IT001E12345678</div>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-owngray">Current Supplier</p>
                    <div className="rounded-lg bg-slate-100 px-3 py-2 text-brand">Enel</div>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-owngray">New Supplier</p>
                    <div className="rounded-lg bg-slate-100 px-3 py-2 text-brand">Eni Plenitude</div>
                  </div>
                </div>
              ),
            },
            {
              key: "documents",
              label: (
                <span>
                  Documents <span className="text-xs text-slate-400">3</span>
                </span>
              ),
              children: (
                <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 p-4 text-slate-400">
                  <HiOutlineDocumentText className="h-10 w-10" />
                  <p>3 documents available</p>
                </div>
              ),
            },
            {
              key: "communications",
              label: (
                <span>
                  Communications <span className="text-xs text-slate-400">4</span>
                </span>
              ),
              children: (
                <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 p-4 text-slate-400">
                  <FiMessageSquare className="h-8 w-8" />
                  <p>4 communication updates available</p>
                </div>
              ),
            },
            {
              key: "internal-notes",
              label: "Internal notes",
              children: (
                <div className="p-4">
                  <Input.TextArea rows={4} placeholder="Add internal notes..." />
                </div>
              ),
            },
            {
              key: "commission",
              label: "Commission",
              children: (
                <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 p-4 text-slate-400">
                  <LuBadgeDollarSign className="h-10 w-10" />
                  <p>Commission details will appear here</p>
                </div>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
};

export default CaseDetailsView;
