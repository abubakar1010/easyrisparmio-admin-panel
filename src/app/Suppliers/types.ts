export type SupplierStatus = "active" | "warning" | "inactive" | "pending_deletion";
export type Commodity = "electricity" | "gas" | "dual";

export const statusDisplayMap: Record<SupplierStatus, string> = {
  active: "Good",
  warning: "Warning",
  inactive: "Inactive",
  pending_deletion: "Pending Deletion",
};

export const statusTagClass: Record<string, string> = {
  Good: "bg-emerald-100 text-emerald-600",
  Warning: "bg-amber-100 text-amber-600",
  Inactive: "bg-slate-100 text-slate-500",
  "Pending Deletion": "bg-red-100 text-red-600",
};

export const commodityIconMap: Record<string, string> = {
  electricity: "zap",
  gas: "flame",
  dual: "database",
};

export const commodityColorMap: Record<string, { color: string; bg: string }> = {
  electricity: { color: "text-amber-500", bg: "bg-amber-50" },
  gas: { color: "text-rose-500", bg: "bg-rose-50" },
  dual: { color: "text-emerald-500", bg: "bg-emerald-50" },
};
