import { Button, Modal, Pagination, Select, Spin, Tag, message } from "antd";
import { FiCheck, FiCheckCircle, FiBell, FiSend, FiInbox, FiEye, FiExternalLink } from "react-icons/fi";
import {
  useGetAdminNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useGetNotificationByIdQuery,
  ADMIN_NOTIFICATION_TYPES,
  CUSTOMER_NOTIFICATION_TYPES,
  type INotification,
} from "../../redux/features/Notifications/notificationApi";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useNavigate } from "react-router";
import SendNotificationModal from "./SendNotificationModal";
import { getNotificationRoute } from "../../lib/helpers/notificationRoute";

const typeColor: Record<string, string> = {
  // Admin-facing
  admin_user: "geekblue",
  admin_bill: "blue",
  admin_verification: "orange",
  admin_offer_accepted: "green",
  admin_offer: "purple",
  admin_case: "gold",
  admin_document: "cyan",
  admin_support: "volcano",
  admin_referral: "magenta",
  admin_system: "default",
  // Customer-facing
  bill_analyzed: "blue",
  bill_verification: "orange",
  bill_updated: "blue",
  offer_available: "green",
  case_update: "gold",
  contract_status: "purple",
  contract_verification: "magenta",
  activation_complete: "lime",
  referral_status: "cyan",
  support_reply: "volcano",
  general: "default",
};

/**
 * The tag on each row reads in the admin's language. A type the translations
 * don't know yet falls back to its humanised key rather than to a blank chip.
 */
const typeLabel = (t: TFunction, type: string) =>
  t(`notifications.type_${type}`, { defaultValue: type.replace(/_/g, " ") });

/**
 * Ant Design styles `.ant-tag` with its own trailing margin, which lands on top
 * of the flex gap and makes the chips sit unevenly. Neutralising it here keeps
 * the spacing owned by the row's `gap`.
 */
const tagClass = "m-0 rounded-full border-0 px-2 py-0 text-[11px] leading-5";

type Direction = "all" | "sent" | "received";

const tabs: { key: Direction; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "notifications.tab_all", icon: <FiBell className="h-4 w-4" /> },
  { key: "sent", label: "notifications.tab_sent", icon: <FiSend className="h-4 w-4" /> },
  { key: "received", label: "notifications.tab_received", icon: <FiInbox className="h-4 w-4" /> },
];

const PAGE_SIZE = 20;

const Notification = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  // "received" is the admin's own inbox — what the bell links to. "all" mixes
  // in messages the admin sent to customers, which buries the new arrivals.
  const [direction, setDirection] = useState<Direction>("received");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [sendOpen, setSendOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useGetAdminNotificationsQuery({
    page,
    limit: PAGE_SIZE,
    direction,
    type: typeFilter,
  });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const notifications = data?.data || [];
  const meta = data?.meta;
  const total = meta?.total || 0;
  const pageSize = meta?.limit || PAGE_SIZE;

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
    } catch {
      message.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      message.success(t("notifications.mark_all_read"));
    } catch {
      message.error("Failed to mark all as read");
    }
  };

  const handleTabChange = (tab: Direction) => {
    setDirection(tab);
    setPage(1);
  };

  const isSentNotification = (item: INotification) => !!item.sentBy && item.sentBy !== item.userId;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("notifications.title")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("notifications.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<FiBell />}
            onClick={() => setSendOpen(true)}
            className="h-10 rounded-lg font-medium"
          >
            {t("notifications.send_notification")}
          </Button>
          {direction === "received" && (
            <Button
              icon={<FiCheckCircle />}
              onClick={handleMarkAllRead}
              loading={isMarkingAll}
              className="h-10 rounded-lg font-medium"
            >
              {t("notifications.mark_all_read")}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs + Type Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                direction === tab.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon}
              {t(tab.label)}
            </button>
          ))}
        </div>
        {/* `size="large"` is the only way to reach the 40px the tab group is —
            Ant Design sets the height on the inner selector, out of reach of a
            utility class on the root. */}
        <Select
          size="large"
          placeholder={t("notifications.filter_by_type")}
          allowClear
          value={typeFilter}
          onChange={(value) => {
            setTypeFilter(value);
            setPage(1);
          }}
          className="w-full sm:w-64"
        >
          <Select.OptGroup label={t("notifications.group_admin")}>
            {ADMIN_NOTIFICATION_TYPES.map((type) => (
              <Select.Option key={type} value={type}>
                {t(`notifications.type_${type}`)}
              </Select.Option>
            ))}
          </Select.OptGroup>
          <Select.OptGroup label={t("notifications.group_customer")}>
            {CUSTOMER_NOTIFICATION_TYPES.map((type) => (
              <Select.Option key={type} value={type}>
                {t(`notifications.type_${type}`)}
              </Select.Option>
            ))}
          </Select.OptGroup>
        </Select>
      </div>

      {/* Notification List
          Rows are plain elements rather than an <List>: Ant Design styles its
          items through `.ant-list .ant-list-item`, a two-class selector that
          outranks any padding utility we put on them, so the avatar ended up
          flush against the card edge. */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24"><Spin size="large" /></div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FiBell className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">{t("notifications.no_notifications")}</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {notifications.map((item) => {
                const isSent = isSentNotification(item);
                const isUnread = !isSent && !item.isRead;
                return (
                  <li
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailId(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailId(item.id);
                      }
                    }}
                    className={`relative flex cursor-pointer items-start gap-4 py-4 pl-6 pr-4 transition-colors focus:outline-none focus-visible:bg-slate-50 sm:pr-6 ${
                      isUnread ? "bg-indigo-50/60 hover:bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Accent rail: the unread tint alone is too faint to scan
                        a long list by. */}
                    {isUnread && (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-1 bg-indigo-500"
                      />
                    )}

                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isSent ? "bg-emerald-100" : isUnread ? "bg-indigo-100" : "bg-slate-100"
                      }`}
                    >
                      {isSent ? (
                        <FiSend className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <FiBell className={`h-5 w-5 ${isUnread ? "text-indigo-500" : "text-slate-400"}`} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={`text-sm ${
                            isUnread ? "font-semibold text-slate-800" : "font-medium text-slate-600"
                          }`}
                        >
                          {item.title}
                        </span>
                        <Tag color={typeColor[item.type] || "default"} className={tagClass}>
                          {typeLabel(t, item.type)}
                        </Tag>
                        {isSent && (
                          <Tag color="green" className={tagClass}>
                            {t("notifications.sent_label")}
                          </Tag>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.body}</p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                        <span>{new Date(item.createdAt).toLocaleString("it-IT")}</span>
                        {isSent && item.user && (
                          <>
                            <span aria-hidden>·</span>
                            <span>
                              → {item.user.firstName} {item.user.lastName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 self-center">
                      <Button
                        type="text"
                        size="small"
                        icon={<FiEye />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailId(item.id);
                        }}
                        className="text-slate-500"
                      >
                        <span className="hidden sm:inline">{t("notifications.view_details")}</span>
                      </Button>
                      {isUnread && (
                        <Button
                          type="text"
                          size="small"
                          icon={<FiCheck />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(item.id);
                          }}
                          className="text-indigo-500"
                        >
                          <span className="hidden sm:inline">{t("notifications.mark_read")}</span>
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {total > pageSize && (
              <div className="flex justify-end border-t border-slate-100 px-6 py-4">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={setPage}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <NotificationDetailModal
        notificationId={detailId}
        onClose={() => setDetailId(null)}
      />

      <SendNotificationModal isOpen={sendOpen} onClose={() => setSendOpen(false)} />
    </div>
  );
};

/* ── Notification Detail Modal ───────────────────────────── */

function NotificationDetailModal({
  notificationId,
  onClose,
}: {
  notificationId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: notification, isLoading } = useGetNotificationByIdQuery(notificationId!, {
    skip: !notificationId,
  });
  const recordRoute = notification ? getNotificationRoute(notification) : null;

  return (
    <Modal
      open={!!notificationId}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
      title={null}
      className="[&_.ant-modal-content]:rounded-2xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Spin size="large" /></div>
      ) : notification ? (
        <div className="space-y-5 py-2">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              notification.sentBy ? "bg-emerald-100" : "bg-indigo-100"
            }`}>
              {notification.sentBy ? (
                <FiSend className="h-6 w-6 text-emerald-500" />
              ) : (
                <FiBell className="h-6 w-6 text-indigo-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-800">{notification.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Tag color={typeColor[notification.type] || "default"} className={tagClass}>
                  {typeLabel(t, notification.type)}
                </Tag>
                {notification.isRead && (
                  <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                    <FiCheckCircle className="h-3 w-3" /> {t("notifications.viewed")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{notification.body}</p>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("notifications.date")}</p>
              <p className="text-slate-700 mt-0.5">{new Date(notification.createdAt).toLocaleString("it-IT")}</p>
            </div>
            {notification.user && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("notifications.recipient_label")}</p>
                <p className="text-slate-700 mt-0.5">{notification.user.firstName} {notification.user.lastName}</p>
              </div>
            )}
            {notification.readAt && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("notifications.read_at")}</p>
                <p className="text-slate-700 mt-0.5">{new Date(notification.readAt).toLocaleString("it-IT")}</p>
              </div>
            )}
          </div>

          {/* Jump to the record the notification is about. */}
          {recordRoute && (
            <Button
              type="primary"
              icon={<FiExternalLink />}
              onClick={() => {
                onClose();
                navigate(recordRoute);
              }}
              className="rounded-lg"
            >
              {t("notifications.view_record")}
            </Button>
          )}

          {/* Data payload (if any) */}
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t("notifications.additional_data")}</p>
              <pre className="rounded-lg bg-slate-900 p-3 text-xs text-slate-200 overflow-x-auto">
                {JSON.stringify(notification.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

export default Notification;
