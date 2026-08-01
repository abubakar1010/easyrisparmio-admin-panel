import { Button, Empty, List, Select, Spin, Tag, message } from "antd";
import { FiCheck, FiCheckCircle, FiBell } from "react-icons/fi";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
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

const Notification = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [sendOpen, setSendOpen] = useState(false);
  const { data, isLoading } = useGetNotificationsQuery({ page, limit: 20, type: typeFilter });
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
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
          <Button
            icon={<FiCheckCircle />}
            onClick={handleMarkAllRead}
            loading={isMarkingAll}
            className="h-10 rounded-lg font-medium"
          >
            {t("notifications.mark_all_read")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
            renderItem={(item) => (
              <List.Item
                className={`px-6 py-4 transition-colors ${!item.isRead ? "bg-indigo-50/30" : ""}`}
                actions={
                  !item.isRead
                    ? [
                        <Button
                          key="read"
                          type="text"
                          size="small"
                          icon={<FiCheck />}
                          onClick={() => handleMarkRead(item.id)}
                          className="text-indigo-500"
                        >
                          {t("notifications.mark_read")}
                        </Button>,
                      ]
                    : undefined
                }
              >
                <List.Item.Meta
                  avatar={
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${!item.isRead ? "bg-indigo-100" : "bg-slate-100"}`}>
                      <FiBell className={`h-5 w-5 ${!item.isRead ? "text-indigo-500" : "text-slate-400"}`} />
                    </div>
                  }
                  title={
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${!item.isRead ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
                        {item.title}
                      </span>
                      <Tag color={typeColor[item.type] || "default"} className="text-[10px] rounded-full px-2 border-0 capitalize">
                        {item.type.replace(/_/g, " ")}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <p className="text-sm text-slate-500">{item.body}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(item.createdAt).toLocaleString("it-IT")}
                      </p>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      <SendNotificationModal isOpen={sendOpen} onClose={() => setSendOpen(false)} />
    </div>
  );
};

export default Notification;
