import i18n from "../i18n";

/**
 * How a bill's pipeline status renders in a table.
 *
 * Lives here rather than next to one table because the case list and the
 * priority-task list show the same statuses and had no business disagreeing
 * about their colours. `BillRequestDetailView` keeps its own richer maps — it
 * paints a stepper, not a tag. Labels come from `case_management.status.*`.
 */
const billStatusColors: Record<string, string> = {
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

/** Translated label for a bill status; an unmapped value still renders as itself. */
export const getBillStatusLabel = (status: string) =>
  i18n.t(`case_management.status.${status}`, { defaultValue: status });

export const getBillStatusConfig = (status: string) => ({
  color: billStatusColors[status] ?? "default",
  label: getBillStatusLabel(status),
});
