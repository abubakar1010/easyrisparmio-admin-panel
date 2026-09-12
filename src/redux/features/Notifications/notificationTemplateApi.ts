import { baseApi } from "../../api/baseApi";
import type { NotificationTypeValue } from "./notificationApi";

export const TEMPLATE_CATEGORIES = [
  "promotional",
  "document_request",
  "case_update",
  "custom",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export interface INotificationTemplate {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  title: string;
  body: string;
  type: NotificationTypeValue;
  isActive: boolean;
  /** Derived server-side from the title and body — never sent back on save. */
  variables: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface INotificationTemplatePayload {
  name: string;
  description?: string | null;
  category?: TemplateCategory;
  title: string;
  body: string;
  type?: NotificationTypeValue;
  isActive?: boolean;
}

export interface INotificationTemplateQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

/**
 * One `{{variable}}` the server knows how to substitute.
 *
 * `scope: "case"` means it reads from the customer's case, so it has no value
 * for someone who has not chosen an offer yet — those are the ones that turn up
 * in a preview's `unresolved`.
 */
export interface ITemplateVariable {
  key: string;
  scope: "user" | "case";
  label: string;
  description: string;
  example: string;
}

export interface INotificationPreview {
  title: string;
  body: string;
  unresolved: string[];
  context: {
    caseId: string | null;
    caseNumber: string | null;
    provider: string | null;
    offerName: string | null;
    utilityType: string | null;
  } | null;
}

export interface IPreviewPayload {
  userId: string;
  templateId?: string;
  title?: string;
  body?: string;
  caseId?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const notificationTemplateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotificationTemplates: builder.query<
      IPaginatedResponse<INotificationTemplate>,
      INotificationTemplateQuery | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.category) qp.set("category", params.category);
          if (params.isActive !== undefined)
            qp.set("isActive", String(params.isActive));
        }
        return { url: `notification-templates?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: {
        success: boolean;
        data: IPaginatedResponse<INotificationTemplate>;
      }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "notification-template" as const,
                id,
              })),
              { type: "notification-template" as const, id: "LIST" },
            ]
          : [{ type: "notification-template" as const, id: "LIST" }],
    }),

    /**
     * The chip palette. The server owns this list so the composer cannot offer a
     * variable the renderer does not know — the dashboard used to hardcode its
     * own copy alongside a duplicate of the substitution regex.
     */
    getTemplateVariables: builder.query<ITemplateVariable[], void>({
      query: () => ({ url: "notification-templates/variables", method: "GET" }),
      transformResponse: (response: {
        success: boolean;
        data: ITemplateVariable[];
      }) => response.data,
      providesTags: [{ type: "notification-template", id: "VARIABLES" }],
    }),

    /** A mutation, not a query: it POSTs and its result is never worth caching. */
    previewNotification: builder.mutation<INotificationPreview, IPreviewPayload>({
      query: (body) => ({
        url: "notification-templates/preview",
        method: "POST",
        body,
      }),
      transformResponse: (response: {
        success: boolean;
        data: INotificationPreview;
      }) => response.data,
    }),

    createNotificationTemplate: builder.mutation<
      INotificationTemplate,
      INotificationTemplatePayload
    >({
      query: (body) => ({ url: "notification-templates", method: "POST", body }),
      transformResponse: (response: {
        success: boolean;
        data: INotificationTemplate;
      }) => response.data,
      invalidatesTags: [{ type: "notification-template", id: "LIST" }],
    }),

    updateNotificationTemplate: builder.mutation<
      INotificationTemplate,
      { id: string; data: Partial<INotificationTemplatePayload> }
    >({
      query: ({ id, data }) => ({
        url: `notification-templates/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: {
        success: boolean;
        data: INotificationTemplate;
      }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "notification-template", id },
        { type: "notification-template", id: "LIST" },
      ],
    }),

    deleteNotificationTemplate: builder.mutation<unknown, string>({
      query: (id) => ({ url: `notification-templates/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "notification-template", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotificationTemplatesQuery,
  useGetTemplateVariablesQuery,
  usePreviewNotificationMutation,
  useCreateNotificationTemplateMutation,
  useUpdateNotificationTemplateMutation,
  useDeleteNotificationTemplateMutation,
} = notificationTemplateApi;
