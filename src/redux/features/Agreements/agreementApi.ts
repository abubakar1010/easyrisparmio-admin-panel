import { baseApi } from "../../api/baseApi";

export interface IAgreement {
  id: string;
  title: string;
  description: string | null;
  partnerName: string;
  partnerLogoUrl: string | null;
  discountDescription: string | null;
  termsUrl: string | null;
  address: string | null;
  isActive: boolean;
  targetAudience: "personal" | "business" | "both";
  validFrom: string;
  validUntil: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IAgreementQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  targetAudience?: string;
}

export interface ICreateAgreement {
  title: string;
  description?: string;
  partnerName: string;
  partnerLogoUrl?: string;
  discountDescription?: string;
  termsUrl?: string;
  address?: string;
  isActive?: boolean;
  targetAudience?: string;
  validFrom: string;
  validUntil?: string;
  sortOrder?: number;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const agreementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAgreementsAdmin: builder.query<IPaginatedResponse<IAgreement>, IAgreementQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.isActive !== undefined) qp.set("isActive", String(params.isActive));
          if (params.targetAudience) qp.set("targetAudience", params.targetAudience);
        }
        return { url: `agreements/admin?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<IAgreement> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "agreement" as const, id })),
              { type: "agreement" as const, id: "LIST" },
            ]
          : [{ type: "agreement" as const, id: "LIST" }],
    }),

    getAgreementById: builder.query<IAgreement, string>({
      query: (id) => ({ url: `agreements/admin/${id}`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: IAgreement }) => response.data,
      providesTags: (_r, _e, id) => [{ type: "agreement" as const, id }],
    }),

    createAgreement: builder.mutation<IAgreement, ICreateAgreement>({
      query: (data) => ({ url: "agreements", method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: IAgreement }) => response.data,
      invalidatesTags: [{ type: "agreement", id: "LIST" }],
    }),

    updateAgreement: builder.mutation<IAgreement, { id: string; data: Partial<ICreateAgreement> }>({
      query: ({ id, data }) => ({ url: `agreements/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: IAgreement }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "agreement", id },
        { type: "agreement", id: "LIST" },
      ],
    }),

    toggleAgreementStatus: builder.mutation<IAgreement, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `agreements/${id}/toggle-status`,
        method: "PATCH",
        body: { isActive },
      }),
      transformResponse: (response: { success: boolean; data: IAgreement }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "agreement", id },
        { type: "agreement", id: "LIST" },
      ],
    }),

    deleteAgreement: builder.mutation<void, string>({
      query: (id) => ({ url: `agreements/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "agreement", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAgreementsAdminQuery,
  useGetAgreementByIdQuery,
  useCreateAgreementMutation,
  useUpdateAgreementMutation,
  useToggleAgreementStatusMutation,
  useDeleteAgreementMutation,
} = agreementApi;
