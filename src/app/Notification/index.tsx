import { Button, Empty, List, Modal, Select, Spin, Tag, message } from "antd";
import { FiCheck, FiCheckCircle, FiBell, FiSend, FiInbox, FiEye } from "react-icons/fi";
import {
  useGetAdminNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useGetNotificationByIdQuery,
  type INotification,
} from "../../redux/features/Notifications/notificationApi";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SendNotificationModal from "./SendNotificationModal";

const typeColor: Record<string, string> = {
  bill_analyzed: "blue",
  bill_verification: "orange",
  offer_available: "green",
  case_update: "gold",
  contract_status: "purple",
  referral_status: "cyan",
  general: "default",
};

const notificationTypes = [
  "bill_analyzed",
  "bill_verification",
  "offer_available",
  "case_update",
  "contract_status",
  "referral_status",
  "general",
] as const;

type Direction = "all" | "sent" | "received";

const tabs: { key: Direction; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "notifications.tab_all", icon: <FiBell className="h-4 w-4" /> },
  { key: "sent", label: "notifications.tab_sent", icon: <FiSend className="h-4 w-4" /> },
  { key: "received", label: "notifications.tab_received", icon: <FiInbox className="h-4 w-4" /> },
];

const Notification = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState<Direction>("all");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [sendOpen, setSendOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useGetAdminNotificationsQuery({
    page,
    limit: 20,
    direction,
    type: typeFilter,
  });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const notifications = data?.data || [];
  const meta = data?.meta;

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
        <Select
          placeholder={t("notifications.filter_by_type")}
          allowClear
          value={typeFilter}
          onChange={(value) => {
            setTypeFilter(value);
            setPage(1);
          }}
          className="w-56"
        >
          {notificationTypes.map((type) => (
            <Select.Option key={type} value={type}>
              {t(`notifications.type_${type}`)}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24"><Spin size="large" /></div>
        ) : notifications.length === 0 ? (
          <div className="py-24">
            <Empty
              image={<FiBell className="h-16 w-16 text-slate-300 mx-auto" />}
              description={t("notifications.no_notifications")}
            />
          </div>
        ) : (
          <List
            dataSource={notifications}
            pagination={{
              current: page,
              pageSize: meta?.limit || 20,
              total: meta?.total || 0,
              onChange: setPage,
              className: "p-4",
            }}
            renderItem={(item) => {
              const isSent = isSentNotification(item);
              return (
                <List.Item
                  className={`px-6 py-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                    !isSent && !item.isRead ? "bg-indigo-50/30" : ""
                  }`}
                  onClick={() => setDetailId(item.id)}
                  actions={[
                    <Button
                      key="view"
                      type="text"
                      size="small"
                      icon={<FiEye />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailId(item.id);
                      }}
                      className="text-slate-500"
                    >
                      {t("notifications.view_details")}
                    </Button>,
                    ...(!isSent && !item.isRead
                      ? [
                          <Button
                            key="read"
                            type="text"
                            size="small"
                            icon={<FiCheck />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(item.id);
                            }}
                            className="text-indigo-500"
                          >
                            {t("notifications.mark_read")}
                          </Button>,
                        ]
                      : []),
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          isSent
                            ? "bg-emerald-100"
                            : !item.isRead
                              ? "bg-indigo-100"
                              : "bg-slate-100"
                        }`}
                      >
                        {isSent ? (
                          <FiSend className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <FiBell className={`h-5 w-5 ${!item.isRead ? "text-indigo-500" : "text-slate-400"}`} />
                        )}
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm ${!isSent && !item.isRead ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
                          {item.title}
                        </span>
                        <Tag color={typeColor[item.type] || "default"} className="text-[10px] rounded-full px-2 border-0 capitalize">
                          {item.type.replace(/_/g, " ")}
                        </Tag>
                        {isSent && (
                          <Tag color="green" className="text-[10px] rounded-full px-2 border-0">
                            {t("notifications.sent_label")}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <p className="text-sm text-slate-500 line-clamp-1">{item.body}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleString("it-IT")}
                          </p>
                          {isSent && item.user && (
                            <p className="text-xs text-slate-400">
                              → {item.user.firstName} {item.user.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
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
  const { data: notification, isLoading } = useGetNotificationByIdQuery(notificationId!, {
    skip: !notificationId,
  });

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
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Tag color={typeColor[notification.type] || "default"} className="text-xs rounded-full px-2.5 border-0 capitalize">
                  {notification.type.replace(/_/g, " ")}
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
