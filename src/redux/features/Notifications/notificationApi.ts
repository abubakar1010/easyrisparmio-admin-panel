import { baseApi } from "../../api/baseApi";

export interface INotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "bill_analyzed" | "offer_available" | "case_update" | "contract_status" | "general";
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface INotificationQuery {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
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
      invalidatesTags: [{ type: "notification", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useSendNotificationMutation,
} = notificationApi;
