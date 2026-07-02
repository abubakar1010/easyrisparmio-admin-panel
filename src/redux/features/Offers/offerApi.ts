import { baseApi } from "../../api/baseApi";

export interface IOffer {
  id: string;
  name: string;
  description: string | null;
  energyType: "electricity" | "gas" | "dual";
  marketType: "fixed" | "variable" | "indexed";
  pricePerKwh: number | null;
  pricePerSmc: number | null;
  fixedMonthlyFee: number;
  activationCost: number;
  contractDurationMonths: number;
  isGreenEnergy: boolean;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  termsUrl: string | null;
  target: "personal" | "business" | "both";
  highlights: string[] | null;
  offerCode: string | null;
  offerStatus: "draft" | "active" | "expiring" | "expired" | "archived";
  version: number;
  supplierId: string;
  supplier?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface IOfferQuery {
  page?: number;
  limit?: number;
  search?: string;
  energyType?: string;
  marketType?: string;
  offerStatus?: string;
  supplierId?: string;
  target?: string;
  isActive?: boolean;
}

export interface ICreateOffer {
  name: string;
  description?: string;
  energyType: string;
  marketType: string;
  pricePerKwh?: number;
  pricePerSmc?: number;
  fixedMonthlyFee?: number;
  activationCost?: number;
  contractDurationMonths: number;
  isGreenEnergy?: boolean;
  validFrom: string;
  validUntil?: string;
  termsUrl?: string;
  target?: string;
  highlights?: string[];
  offerCode?: string;
  offerStatus?: string;
  supplierId: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const offerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOffersAdmin: builder.query<IPaginatedResponse<IOffer>, IOfferQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.energyType) qp.set("energyType", params.energyType);
          if (params.marketType) qp.set("marketType", params.marketType);
          if (params.offerStatus) qp.set("offerStatus", params.offerStatus);
          if (params.supplierId) qp.set("supplierId", params.supplierId);
          if (params.target) qp.set("target", params.target);
          if (params.isActive !== undefined) qp.set("isActive", String(params.isActive));
        }
        return { url: `offers/admin?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<IOffer> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "offer" as const, id })),
              { type: "offer" as const, id: "LIST" },
            ]
          : [{ type: "offer" as const, id: "LIST" }],
    }),

    getOfferById: builder.query<IOffer, string>({
      query: (id) => ({ url: `offers/${id}`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: IOffer }) => response.data,
      providesTags: (_r, _e, id) => [{ type: "offer" as const, id }],
    }),

    createOffer: builder.mutation<IOffer, ICreateOffer>({
      query: (data) => ({ url: "offers", method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: IOffer }) => response.data,
      invalidatesTags: [{ type: "offer", id: "LIST" }],
    }),

    updateOffer: builder.mutation<IOffer, { id: string; data: Partial<ICreateOffer> }>({
      query: ({ id, data }) => ({ url: `offers/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: IOffer }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "offer", id },
        { type: "offer", id: "LIST" },
      ],
    }),

    updateOfferStatus: builder.mutation<IOffer, { id: string; offerStatus: string }>({
      query: ({ id, offerStatus }) => ({
        url: `offers/${id}/status`,
        method: "PATCH",
        body: { offerStatus },
      }),
      transformResponse: (response: { success: boolean; data: IOffer }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "offer", id },
        { type: "offer", id: "LIST" },
      ],
    }),

    deleteOffer: builder.mutation<void, string>({
      query: (id) => ({ url: `offers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "offer", id: "LIST" }],
    }),
  }),
});

export const {
  useGetOffersAdminQuery,
  useGetOfferByIdQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useUpdateOfferStatusMutation,
  useDeleteOfferMutation,
} = offerApi;
