import { baseApi } from "../../api/baseApi";

export interface ISupportTicket {
  id: string;
  userId: string;
  assignedAgentId: string | null;
  subject: string;
  category: "technical_support" | "billing_payments" | "switching" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  assignedAgent?: { id: string; firstName: string; lastName: string } | null;
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

export interface ITicketQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query<IPaginatedResponse<ISupportTicket>, ITicketQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.status) qp.set("status", params.status);
          if (params.category) qp.set("category", params.category);
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
      { category: string; question: string; answer: string; sortOrder?: number; isActive?: boolean }
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
  useGetTicketsQuery,
  useGetTicketByIdQuery,
  useUpdateTicketMutation,
  useAddTicketMessageMutation,
  useGetTicketMessagesQuery,
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = supportApi;
