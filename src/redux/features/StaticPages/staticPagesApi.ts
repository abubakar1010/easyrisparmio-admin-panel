import { baseApi } from "../../api/baseApi";

export interface IStaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  locale: string;
  isActive: boolean;
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

    createStaticPage: builder.mutation<
      IStaticPage,
      { slug: string; title: string; content: string; locale?: string; isActive?: boolean }
    >({
      query: (data) => ({ url: "static-pages", method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: IStaticPage }) => response.data,
      invalidatesTags: [{ type: "static-page", id: "LIST" }],
    }),

    updateStaticPage: builder.mutation<IStaticPage, { id: string; data: Partial<IStaticPage> }>({
      query: ({ id, data }) => ({ url: `static-pages/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: IStaticPage }) => response.data,
      invalidatesTags: [{ type: "static-page", id: "LIST" }],
    }),

    deleteStaticPage: builder.mutation<void, string>({
      query: (id) => ({ url: `static-pages/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "static-page", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAdminStaticPagesQuery,
  useCreateStaticPageMutation,
  useUpdateStaticPageMutation,
  useDeleteStaticPageMutation,
} = staticPagesApi;
