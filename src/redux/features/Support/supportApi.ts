import { baseApi } from "../../api/baseApi";

export interface ISupportTopic {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  icon: string | null;
  ticketCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ISupportTicket {
  id: string;
  userId: string;
  assignedAgentId: string | null;
  subject: string;
  topicId: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  assignedAgent?: { id: string; firstName: string; lastName: string } | null;
  topic?: ISupportTopic;
  messages?: ITicketMessage[];
}

export interface ITicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  attachments: string[] | null;
  createdAt: string;
  sender?: { id: string; firstName: string; lastName: string };
}

export interface IFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  locale: string;
  targetAudience: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITopicQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface ITicketQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  topicId?: string;
  priority?: string;
}

export interface IFaqQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  targetAudience?: string;
  locale?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Topic Endpoints ───────────────────────────────────

    getAdminTopics: builder.query<IPaginatedResponse<ISupportTopic>, ITopicQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.isActive !== undefined) qp.set("isActive", String(params.isActive));
        }
        return { url: `support/topics/admin?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<ISupportTopic> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "support-topic" as const, id })),
              { type: "support-topic" as const, id: "LIST" },
            ]
          : [{ type: "support-topic" as const, id: "LIST" }],
    }),

    getActiveTopics: builder.query<ISupportTopic[], void>({
      query: () => ({ url: "support/topics", method: "GET" }),
      transformResponse: (response: { success: boolean; data: ISupportTopic[] }) => response.data,
      providesTags: [{ type: "support-topic", id: "LIST" }],
    }),

    createTopic: builder.mutation<
      ISupportTopic,
      { name: string; description?: string; isActive?: boolean; sortOrder?: number; icon?: string }
    >({
      query: (data) => ({ url: "support/topics", method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: ISupportTopic }) => response.data,
      invalidatesTags: [{ type: "support-topic", id: "LIST" }],
    }),

    updateTopic: builder.mutation<ISupportTopic, { id: string; data: Partial<ISupportTopic> }>({
      query: ({ id, data }) => ({ url: `support/topics/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: ISupportTopic }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "support-topic", id },
        { type: "support-topic", id: "LIST" },
      ],
    }),

    deleteTopic: builder.mutation<void, string>({
      query: (id) => ({ url: `support/topics/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "support-topic", id: "LIST" }],
    }),

    // ─── Ticket Endpoints ──────────────────────────────────

    getTickets: builder.query<IPaginatedResponse<ISupportTicket>, ITicketQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.status) qp.set("status", params.status);
          if (params.topicId) qp.set("topicId", params.topicId);
          if (params.priority) qp.set("priority", params.priority);
        }
        return { url: `support/tickets?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<ISupportTicket> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "support" as const, id })),
              { type: "support" as const, id: "LIST" },
            ]
          : [{ type: "support" as const, id: "LIST" }],
    }),

    getTicketById: builder.query<ISupportTicket, string>({
      query: (id) => ({ url: `support/tickets/${id}`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: ISupportTicket }) => response.data,
      providesTags: (_r, _e, id) => [{ type: "support" as const, id }],
    }),

    updateTicket: builder.mutation<
      ISupportTicket,
      { id: string; data: { status?: string; assignedAgentId?: string } }
    >({
      query: ({ id, data }) => ({ url: `support/tickets/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: ISupportTicket }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "support", id },
        { type: "support", id: "LIST" },
      ],
    }),

    addTicketMessage: builder.mutation<
      ITicketMessage,
      { ticketId: string; message: string; attachments?: string[] }
    >({
      query: ({ ticketId, ...body }) => ({
        url: `support/tickets/${ticketId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { ticketId }) => [{ type: "support", id: ticketId }],
    }),

    getTicketMessages: builder.query<ITicketMessage[], string>({
      query: (ticketId) => ({ url: `support/tickets/${ticketId}/messages`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: ITicketMessage[] }) => response.data,
    }),

    // ─── FAQ Endpoints ─────────────────────────────────────

    getAdminFaqs: builder.query<IPaginatedResponse<IFaq>, IFaqQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.category) qp.set("category", params.category);
          if (params.isActive !== undefined) qp.set("isActive", String(params.isActive));
          if (params.targetAudience) qp.set("targetAudience", params.targetAudience);
          if (params.locale) qp.set("locale", params.locale);
        }
        return { url: `support/faqs/admin?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<IFaq> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "faq" as const, id })),
              { type: "faq" as const, id: "LIST" },
            ]
          : [{ type: "faq" as const, id: "LIST" }],
    }),

    getFaqs: builder.query<IFaq[], string | void>({
      query: (category) => {
        const qp = new URLSearchParams();
        if (category) qp.set("category", category);
        return { url: `support/faqs?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IFaq[] }) => response.data,
      providesTags: [{ type: "faq", id: "LIST" }],
    }),

    createFaq: builder.mutation<
      IFaq,
      { category: string; question: string; answer: string; sortOrder?: number; isActive?: boolean; locale?: string; targetAudience?: string }
    >({
      query: (data) => ({ url: "support/faqs", method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: IFaq }) => response.data,
      invalidatesTags: [{ type: "faq", id: "LIST" }],
    }),

    updateFaq: builder.mutation<IFaq, { id: string; data: Partial<IFaq> }>({
      query: ({ id, data }) => ({ url: `support/faqs/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: IFaq }) => response.data,
      invalidatesTags: [{ type: "faq", id: "LIST" }],
    }),

    deleteFaq: builder.mutation<void, string>({
      query: (id) => ({ url: `support/faqs/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "faq", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAdminTopicsQuery,
  useGetActiveTopicsQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
  useGetTicketsQuery,
  useGetTicketByIdQuery,
  useUpdateTicketMutation,
  useAddTicketMessageMutation,
  useGetTicketMessagesQuery,
  useGetAdminFaqsQuery,
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = supportApi;
