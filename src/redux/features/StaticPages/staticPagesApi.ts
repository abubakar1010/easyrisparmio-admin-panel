import { baseApi } from "../../api/baseApi";

export type LegalAudience = "all" | "personal" | "business";

export interface IStaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  locale: string;
  isActive: boolean;
  /** Dotted document version. Raising it makes every user accept again. */
  version: string;
  requiresAcceptance: boolean;
  audience: LegalAudience;
  publishedAt: string | null;
  changeSummary: string | null;
  /** Users who have accepted this document at its current version. */
  acceptedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IStaticPageQuery {
  page?: number;
  limit?: number;
  search?: string;
  slug?: string;
  locale?: string;
  isActive?: boolean;
}

export interface IStaticPagePayload {
  slug: string;
  title: string;
  content: string;
  locale?: string;
  isActive?: boolean;
  version?: string;
  requiresAcceptance?: boolean;
  audience?: LegalAudience;
  changeSummary?: string;
}

export interface ILegalAcceptance {
  id: string;
  slug: string;
  version: string;
  locale: string;
  acceptedAt: string;
  source: "registration" | "social_login" | "business_upgrade" | "reacceptance";
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface ILegalAcceptanceQuery {
  page?: number;
  limit?: number;
  search?: string;
  slug?: string;
  version?: string;
  userId?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const staticPagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStaticPages: builder.query<IPaginatedResponse<IStaticPage>, IStaticPageQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.slug) qp.set("slug", params.slug);
          if (params.locale) qp.set("locale", params.locale);
          if (params.isActive !== undefined) qp.set("isActive", String(params.isActive));
        }
        return { url: `static-pages/admin?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<IStaticPage> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "static-page" as const, id })),
              { type: "static-page" as const, id: "LIST" },
            ]
          : [{ type: "static-page" as const, id: "LIST" }],
    }),

    createStaticPage: builder.mutation<IStaticPage, IStaticPagePayload>({
      query: (data) => ({ url: "static-pages", method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: IStaticPage }) => response.data,
      invalidatesTags: [{ type: "static-page", id: "LIST" }],
    }),

    updateStaticPage: builder.mutation<IStaticPage, { id: string; data: Partial<IStaticPagePayload> }>({
      query: ({ id, data }) => ({ url: `static-pages/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: IStaticPage }) => response.data,
      // A version bump rewrites every translation of the slug server-side, so
      // the whole list is invalidated rather than the single edited row.
      invalidatesTags: [
        { type: "static-page", id: "LIST" },
        { type: "legal-acceptance", id: "LIST" },
      ],
    }),

    deleteStaticPage: builder.mutation<void, string>({
      query: (id) => ({ url: `static-pages/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "static-page", id: "LIST" }],
    }),

    getPublicStaticPage: builder.query<IStaticPage, { slug: string; locale?: string }>({
      query: ({ slug, locale }) => {
        const qp = new URLSearchParams();
        if (locale) qp.set("locale", locale);
        return { url: `static-pages/${slug}?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IStaticPage }) => response.data,
    }),

    /** Consent audit log — who accepted which document version, and when. */
    getLegalAcceptances: builder.query<
      IPaginatedResponse<ILegalAcceptance>,
      ILegalAcceptanceQuery | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.slug) qp.set("slug", params.slug);
          if (params.version) qp.set("version", params.version);
          if (params.userId) qp.set("userId", params.userId);
        }
        return { url: `legal/admin/acceptances?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: {
        success: boolean;
        data: IPaginatedResponse<ILegalAcceptance>;
      }) => response.data,
      providesTags: [{ type: "legal-acceptance", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAdminStaticPagesQuery,
  useCreateStaticPageMutation,
  useUpdateStaticPageMutation,
  useDeleteStaticPageMutation,
  useGetPublicStaticPageQuery,
  useGetLegalAcceptancesQuery,
} = staticPagesApi;
