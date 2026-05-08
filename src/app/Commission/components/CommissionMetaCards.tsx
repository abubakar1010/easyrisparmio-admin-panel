import { Card } from "antd";
import { FiCalendar, FiCheckCircle } from "react-icons/fi";

const cards = [
  { label: "Supplier", value: "Enel Energia S.p.A." },
  { label: "Agency Plan", value: "Business Plan 2025" },
  { label: "Validity", value: "01/01/2025 - 31/12/2025", icon: <FiCalendar className="h-3.5 w-3.5" /> },
  { label: "Last Update", value: "16/05/2025", icon: <FiCheckCircle className="h-3.5 w-3.5 text-emerald-500" /> },
];

export const CommissionMetaCards = () => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl border-slate-200/70 shadow-sm [&_.ant-card-body]:px-4 [&_.ant-card-body]:py-3">
          <p className="text-sm text-slate-400">{card.label}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 font-medium text-slate-700">
            {card.icon}
            {card.value}
          </p>
        </Card>
      ))}
    </div>
  );
};
