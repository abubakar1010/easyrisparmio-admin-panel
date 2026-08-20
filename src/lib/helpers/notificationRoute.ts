import type { INotification } from "../../redux/features/Notifications/notificationApi";

/**
 * Where clicking a notification should land.
 *
 * Reads the specific ids the backend writes onto `data` rather than a generic
 * entityType/entityId pair, because the routes are not keyed uniformly: the
 * case detail view takes a **billId**, not a caseId, so a generic mapping
 * would send the admin to the wrong record.
 *
 * Everything that concerns a bill or a switching case lands on the case detail
 * view — it is the single screen that covers the whole lifecycle (bill data,
 * verification, offers, contract, activation). Notifications that only carry a
 * caseId go through `/case-management/case/:caseId`, which resolves the case to
 * its bill and forwards.
 *
 * Returns null when nothing better than the notification list is available.
 */
export function getNotificationRoute(
  notification: Pick<INotification, "type" | "data">,
): string | null {
  const data = (notification.data ?? {}) as Record<string, unknown>;
  const id = (key: string): string | null =>
    typeof data[key] === "string" && data[key] ? (data[key] as string) : null;

  const billId = id("billId");
  const caseId = id("caseId");
  const ticketId = id("ticketId");
  const offerId = id("offerId");

  /** Case detail, keyed by bill when we have it and by case otherwise. */
  const caseRoute = (): string | null => {
    if (billId) return `/case-management/${billId}`;
    if (caseId) return `/case-management/case/${caseId}`;
    return null;
  };

  switch (notification.type) {
    // Bill lifecycle — upload, analysis, verification, corrections.
    case "admin_bill":
    case "admin_verification":
    case "bill_analyzed":
    case "bill_verification":
    case "bill_updated":
    // Switching lifecycle — offer accepted, status changes, documents.
    case "admin_offer_accepted":
    case "admin_case":
    case "admin_document":
    case "case_update":
    case "contract_status":
    case "contract_verification":
    case "activation_complete":
    case "offer_available":
      return caseRoute();

    case "admin_support":
    case "support_reply":
      return ticketId ? `/support-ticket/${ticketId}` : "/support-ticket";

    // A catalogue offer, not an offer picked by a customer.
    case "admin_offer":
      return offerId ? `/offers-market/${offerId}` : "/offers-market";

    case "admin_user":
      return "/client-list";

    case "admin_referral":
    case "referral_status":
      return "/referrals";

    default:
      return null;
  }
}
