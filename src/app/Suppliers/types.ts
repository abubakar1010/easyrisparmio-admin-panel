/**
 * The only thing that says whether a supplier is usable: only an active
 * supplier can carry offers. pending_deletion is set by the deletion flow.
 */
export type SupplierStatus = "active" | "inactive" | "pending_deletion";
export type Commodity = "electricity" | "gas" | "dual";

export const statusTagClass: Record<SupplierStatus, string> = {
  active: "bg-emerald-100 text-emerald-600",
  inactive: "bg-slate-100 text-slate-500",
  pending_deletion: "bg-red-100 text-red-600",
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
