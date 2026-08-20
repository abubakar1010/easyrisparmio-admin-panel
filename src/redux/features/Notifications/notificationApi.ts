import { baseApi } from "../../api/baseApi";

export interface INotificationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Customer-facing types. An admin only sees these on the "sent" tab. */
export const CUSTOMER_NOTIFICATION_TYPES = [
  "bill_analyzed",
  "bill_verification",
  "bill_updated",
  "offer_available",
  "case_update",
  "contract_status",
  "contract_verification",
  "activation_complete",
  "referral_status",
  "support_reply",
  "general",
] as const;

/** Types the platform raises for admins. These fill the "received" tab. */
export const ADMIN_NOTIFICATION_TYPES = [
  "admin_user",
  "admin_bill",
  "admin_verification",
  "admin_offer_accepted",
  "admin_offer",
  "admin_case",
  "admin_document",
  "admin_support",
  "admin_referral",
  "admin_system",
] as const;

export const NOTIFICATION_TYPES = [
  ...ADMIN_NOTIFICATION_TYPES,
  ...CUSTOMER_NOTIFICATION_TYPES,
] as const;

export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

export interface INotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationTypeValue;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  sentBy: string | null;
  user?: INotificationUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface INotificationQuery {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
}

export interface IAdminNotificationQuery {
  page?: number;
  limit?: number;
  direction?: "all" | "sent" | "received";
  type?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<IPaginatedResponse<INotification>, INotificationQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.type) qp.set("type", params.type);
          if (params.isRead !== undefined) qp.set("isRead", String(params.isRead));
        }
        return { url: `notifications?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<INotification> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "notification" as const, id })),
              { type: "notification" as const, id: "LIST" },
            ]
          : [{ type: "notification" as const, id: "LIST" }],
    }),

    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => ({ url: "notifications/unread-count", method: "GET" }),
      transformResponse: (response: { success: boolean; data: { count: number } }) => response.data,
      providesTags: [{ type: "notification", id: "COUNT" }],
    }),

    markAsRead: builder.mutation<INotification, string>({
      query: (id) => ({ url: `notifications/${id}/read`, method: "PATCH" }),
      transformResponse: (response: { success: boolean; data: INotification }) => response.data,
      invalidatesTags: (_r, _e, id) => [
        { type: "notification", id },
        { type: "notification", id: "COUNT" },
        { type: "notification", id: "LIST" },
        { type: "notification", id: "ADMIN_LIST" },
      ],
    }),

    markAllAsRead: builder.mutation<void, void>({
      query: () => ({ url: "notifications/read-all", method: "PATCH" }),
      invalidatesTags: [
        { type: "notification", id: "LIST" },
        { type: "notification", id: "COUNT" },
      ],
    }),

    sendNotification: builder.mutation<
      INotification,
      { title: string; body: string; userId?: string; userIds?: string[]; type?: string }
    >({
      query: (data) => ({ url: "notifications/send", method: "POST", body: data }),
      invalidatesTags: [
        { type: "notification", id: "LIST" },
        { type: "notification", id: "ADMIN_LIST" },
      ],
    }),

    getAdminNotifications: builder.query<IPaginatedResponse<INotification>, IAdminNotificationQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.direction) qp.set("direction", params.direction);
          if (params.type) qp.set("type", params.type);
        }
        return { url: `notifications/admin?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<INotification> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "notification" as const, id })),
              { type: "notification" as const, id: "ADMIN_LIST" },
            ]
          : [{ type: "notification" as const, id: "ADMIN_LIST" }],
    }),

    registerPushToken: builder.mutation<
      unknown,
      { token: string; platform: "web" | "ios" | "android" }
    >({
      query: (body) => ({ url: "notifications/push-token", method: "POST", body }),
    }),

    removePushToken: builder.mutation<unknown, string>({
      query: (token) => ({
        url: `notifications/push-token/${token}`,
        method: "DELETE",
      }),
    }),

    getNotificationById: builder.query<INotification, string>({
      query: (id) => ({ url: `notifications/admin/${id}`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: INotification }) => response.data,
      providesTags: (_r, _e, id) => [{ type: "notification" as const, id }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useSendNotificationMutation,
  useGetAdminNotificationsQuery,
  useGetNotificationByIdQuery,
  useRegisterPushTokenMutation,
  useRemovePushTokenMutation,
} = notificationApi;
