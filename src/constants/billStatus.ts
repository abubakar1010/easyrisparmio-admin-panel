/**
 * How a bill's pipeline status renders in a table.
 *
 * Lives here rather than next to one table because the case list and the
 * priority-task list show the same statuses and had no business disagreeing
 * about their colours. `BillRequestDetailView` keeps its own richer maps — it
 * paints a stepper, not a tag.
 */
export const billStatusConfig: Record<string, { color: string; label: string }> = {
  pending_email: { color: "purple", label: "Pending (Email)" },
  uploaded: { color: "blue", label: "Uploaded" },
  analyzing: { color: "orange", label: "Analyzing" },
  analyzed: { color: "green", label: "Analyzed" },
  error: { color: "red", label: "Error" },
  verification_review: { color: "gold", label: "Verification Review" },
  verification_required: { color: "volcano", label: "Verification Required" },
  verified: { color: "green", label: "Verified" },
  offer_sent: { color: "cyan", label: "Offer Sent" },
  offer_accepted: { color: "purple", label: "Offer Accepted" },
  contract_sent: { color: "gold", label: "Contract Sent" },
  awaiting_activation: { color: "processing", label: "In Activation" },
  activated: { color: "green", label: "Activated" },
  cancelled: { color: "default", label: "Cancelled" },
};

/** Falls back to the raw status so an unmapped value still renders readably. */
export const getBillStatusConfig = (status: string) =>
  billStatusConfig[status] ?? { color: "default", label: status };
