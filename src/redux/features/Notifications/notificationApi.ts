import { baseApi } from "../../api/baseApi";

export interface INotificationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "bill_analyzed" | "bill_verification" | "offer_available" | "case_update" | "contract_status" | "referral_status" | "general";
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

const notificationApi = baseApi.injectEndpoints({
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
} = notificationApi;
