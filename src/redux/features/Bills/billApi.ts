import { baseApi } from "../../api/baseApi";

export interface IBillAnalysis {
  id: string;
  potentialSavings: number;
  currentMonthlyAvg: number;
  recommendedMarketType: string;
  analysisSummary: string;
  analysisDetails: Record<string, unknown> | null;
  confidenceScore: number | null;
  recommendedOffers: unknown[] | null;
  offersSentToUser: boolean;
  createdAt: string;
}

export interface IBill {
  id: string;
  fileUrl: string;
  billType: "electricity" | "gas";
  status: "uploaded" | "analyzing" | "analyzed" | "error" | "offer_sent" | "case_created";
  podNumber: string | null;
  pdrNumber: string | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  totalAmount: number | null;
  consumptionKwh: number | null;
  consumptionSmc: number | null;
  costPerUnit: number | null;
  fixedCharges: number | null;
  taxes: number | null;
  supplyAddress: string | null;
  codiceFiscale: string | null;
  partitaIva: string | null;
  contractNumber: string | null;
  meterNumber: string | null;
  customerName: string | null;
  rawAnalysisData: Record<string, unknown> | null;
  userId: string;
  supplierId: string | null;
  meterId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  supplier?: { id: string; name: string } | null;
  analysis?: IBillAnalysis | null;
  switchCases?: Array<{
    id: string;
    caseNumber: string | null;
    status: string;
    caseType: string;
    priority: string;
    createdAt: string;
  }> | null;
}

export interface IBillQuery {
  page?: number;
  limit?: number;
  search?: string;
  billType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const billApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBillsAdmin: builder.query<IPaginatedResponse<IBill>, IBillQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.billType) qp.set("billType", params.billType);
          if (params.status) qp.set("status", params.status);
          if (params.dateFrom) qp.set("dateFrom", params.dateFrom);
          if (params.dateTo) qp.set("dateTo", params.dateTo);
        }
        return { url: `bills/admin?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<IBill> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "bill" as const, id })),
              { type: "bill" as const, id: "LIST" },
            ]
          : [{ type: "bill" as const, id: "LIST" }],
    }),

    getBillByIdAdmin: builder.query<IBill, string>({
      query: (id) => ({ url: `bills/admin/${id}`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: IBill }) => response.data,
      providesTags: (_r, _e, id) => [{ type: "bill" as const, id }],
    }),

    uploadBill: builder.mutation<IBill, FormData>({
      query: (formData) => ({
        url: "bills/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "bill", id: "LIST" }],
    }),

    reanalyzeBill: builder.mutation<IBillAnalysis, string>({
      query: (id) => ({ url: `bills/admin/${id}/reanalyze`, method: "POST" }),
      transformResponse: (response: { success: boolean; data: IBillAnalysis }) => response.data,
      invalidatesTags: (_r, _e, id) => [{ type: "bill", id }],
    }),

    getRecommendedOffersAdmin: builder.query<unknown[], string>({
      query: (billId) => ({ url: `bills/admin/${billId}/recommended-offers`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: unknown[] }) => response.data,
    }),

    sendOffersToUser: builder.mutation<{ message: string }, string>({
      query: (billId) => ({ url: `bills/admin/${billId}/send-offers`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "bill", id }],
    }),
  }),
});

export const {
  useGetBillsAdminQuery,
  useGetBillByIdAdminQuery,
  useUploadBillMutation,
  useReanalyzeBillMutation,
  useGetRecommendedOffersAdminQuery,
  useSendOffersToUserMutation,
} = billApi;
