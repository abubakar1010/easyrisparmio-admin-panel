import type { INotification } from "../../redux/features/Notifications/notificationApi";

/**
 * Where clicking a notification should land.
 *
 * Reads the specific ids the backend writes onto `data` rather than a generic
 * entityType/entityId pair, because the routes are not keyed uniformly: the
 * case detail view takes a **billId**, not a caseId, so a generic mapping
 * would send the admin to the wrong record. The notification type decides
 * which of the two bill-keyed views is the useful one — a freshly analysed
 * bill wants the OCR review screen, an accepted offer wants the case.
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
  const ticketId = id("ticketId");
  const offerId = id("offerId");

  switch (notification.type) {
    // Bill data waiting to be checked — the OCR review screen.
    case "admin_bill":
    case "admin_verification":
    case "bill_analyzed":
    case "bill_verification":
    case "bill_updated":
      return billId ? `/ocr/${billId}` : null;

    // Switching workflow — the case detail view, keyed by its bill.
    case "admin_offer_accepted":
    case "admin_case":
    case "admin_document":
    case "case_update":
    case "contract_status":
    case "activation_complete":
    case "offer_available":
      return billId ? `/case-management/${billId}` : null;

    case "admin_support":
    case "support_reply":
      return ticketId ? `/support-ticket/${ticketId}` : null;

    case "admin_offer":
      return offerId ? `/offers-market/${offerId}` : null;

    case "admin_user":
      return "/client-list";

    case "admin_referral":
    case "referral_status":
      return "/referrals";

    default:
      return null;
  }
}
