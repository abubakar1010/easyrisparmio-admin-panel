export function KpiFinancialCards() {
  const items = [
    { label: "Acquisition Commission", value: "€ 12,340", sub: "124 contracts", color: "text-[#3B82F6]" },
    { label: "Recurring Commission", value: "€ 8,920", sub: "882 active", color: "text-emerald-600" },
    { label: "Pending Revenue", value: "€ 34,560", sub: "67 pending", color: "text-orange-500" },
    { label: "Churn Rate", value: "2.8%", sub: "Target: <2%", color: "text-red-600" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-cborder/40 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5"
        >
          <p className="text-xs font-medium text-owngray">{item.label}</p>
          <p className={`mt-2 text-xl font-bold tracking-tight sm:text-2xl ${item.color}`}>{item.value}</p>
          <p className="mt-1 text-xs text-gray-500">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
