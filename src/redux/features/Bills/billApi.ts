import { baseApi } from "../../api/baseApi";

export interface IBillFieldConfidence {
  supplierName?: "high" | "medium" | "low" | null;
  podNumber?: "high" | "medium" | "low" | null;
  pdrNumber?: "high" | "medium" | "low" | null;
  totalAmount?: "high" | "medium" | "low" | null;
  consumptionKwh?: "high" | "medium" | "low" | null;
  consumptionSmc?: "high" | "medium" | "low" | null;
  costPerUnit?: "high" | "medium" | "low" | null;
  fixedCharges?: "high" | "medium" | "low" | null;
  taxes?: "high" | "medium" | "low" | null;
  billingPeriodStart?: "high" | "medium" | "low" | null;
  billingPeriodEnd?: "high" | "medium" | "low" | null;
  supplyAddress?: "high" | "medium" | "low" | null;
  codiceFiscale?: "high" | "medium" | "low" | null;
  partitaIva?: "high" | "medium" | "low" | null;
  contractNumber?: "high" | "medium" | "low" | null;
  meterNumber?: "high" | "medium" | "low" | null;
  customerName?: "high" | "medium" | "low" | null;
}

export interface IBillExtractionResult {
  supplierName: string | null;
  podNumber: string | null;
  pdrNumber: string | null;
  totalAmount: number | null;
  consumptionKwh: number | null;
  consumptionSmc: number | null;
  costPerUnit: number | null;
  fixedCharges: number | null;
  taxes: number | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  supplyAddress: string | null;
  codiceFiscale: string | null;
  partitaIva: string | null;
  contractNumber: string | null;
  meterNumber: string | null;
  customerName: string | null;
  confidence: IBillFieldConfidence;
  overallConfidence: "high" | "medium" | "low";
}

export interface IBillAnalysis {
  id: string;
  potentialSavings: number;
  currentMonthlyAvg: number;
  recommendedMarketType: string;
  analysisDetails: Record<string, unknown> | null;
  confidenceScore: number | null;
  recommendedOffers: unknown[] | null;
  offersSentToUser: boolean;
  createdAt: string;
}

export interface IBillVerification {
  id: string;
  billId: string;
  adminMessage: string;
  missingFields: string[];
  requireReupload: boolean;
  status: "pending" | "submitted" | "resolved";
  userMessage: string | null;
  userData: Record<string, unknown> | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface IBillFile {
  id: string;
  billId: string;
  fileUrl: string;
  originalName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface IBill {
  id: string;
  fileUrl: string | null;
  billType: "electricity" | "gas";
  status: "pending_email" | "uploaded" | "analyzing" | "analyzed" | "error" | "verification_required" | "offer_sent" | "case_created" | "contract_sent" | "contract_signed" | "activated" | "cancelled";
  source?: "upload" | "email";
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
  supplierName: string | null;
  rawAnalysisData: Record<string, unknown> | null;
  userId: string;
  supplierId: string | null;
  meterId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  supplier?: { id: string; name: string } | null;
  files?: IBillFile[] | null;
  verifications?: IBillVerification[] | null;
  analysis?: IBillAnalysis | null;
  switchCases?: Array<{
    id: string;
    caseNumber: string | null;
    status: string;
    caseType: string;
    priority: string;
    selectedOfferId: string;
    createdAt: string;
  }> | null;
}

export interface IBillQuery {
  page?: number;
  limit?: number;
  search?: string;
  billType?: string;
  status?: string;
  caseStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
  userId?: string;
}

export interface IOfferWithSavings {
  id: string;
  name: string;
  description: string | null;
  energyType: "electricity" | "gas" | "dual";
  marketType: "fixed" | "variable" | "indexed";
  pricePerKwh: number | null;
  pricePerSmc: number | null;
  fixedMonthlyFee: number;
  activationCost: number;
  contractDurationDays: number;
  isGreenEnergy: boolean;
  offerStatus: string;
  supplierId: string;
  supplier?: { id: string; name: string } | null;
  estimatedSavings: number;
  isSent?: boolean;
  sentAt?: string | null;
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
          if (params.caseStatus) qp.set("caseStatus", params.caseStatus);
          if (params.dateFrom) qp.set("dateFrom", params.dateFrom);
          if (params.dateTo) qp.set("dateTo", params.dateTo);
          if (params.source) qp.set("source", params.source);
          if (params.userId) qp.set("userId", params.userId);
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
      invalidatesTags: (_r, _e, id) => [{ type: "bill", id }, { type: "bill", id: "LIST" }],
    }),

    getRecommendedOffersAdmin: builder.query<unknown[], string>({
      query: (billId) => ({ url: `bills/admin/${billId}/recommended-offers`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: unknown[] }) => response.data,
    }),

    sendOffersToUser: builder.mutation<{ message: string }, string>({
      query: (billId) => ({ url: `bills/admin/${billId}/send-offers`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "bill", id }, { type: "bill", id: "LIST" }],
    }),

    getAllOffersForBill: builder.query<IOfferWithSavings[], string>({
      query: (billId) => ({ url: `bills/admin/${billId}/all-offers`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: IOfferWithSavings[] }) =>
        response.data,
      providesTags: (_r, _e, billId) => [{ type: "offer" as const, id: `bill-offers-${billId}` }],
    }),

    sendSelectedOffers: builder.mutation<
      { message: string },
      { billId: string; offers: Array<{ offerId: string; estimatedSavings?: number }> }
    >({
      query: ({ billId, offers }) => ({
        url: `bills/admin/${billId}/send-offers`,
        method: "POST",
        body: { offers },
      }),
      invalidatesTags: (_r, _e, { billId }) => [
        { type: "bill", id: billId },
        { type: "bill", id: "LIST" },
        { type: "offer", id: `bill-offers-${billId}` },
      ],
    }),

    extractBillData: builder.mutation<IBillExtractionResult, FormData>({
      query: (formData) => ({
        url: "bills/extract",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: { success: boolean; data: IBillExtractionResult }) =>
        response.data,
    }),

    adminUploadEmailBill: builder.mutation<IBill, FormData>({
      query: (formData) => ({
        url: "bills/admin/upload-email",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: { success: boolean; data: IBill }) => response.data,
      invalidatesTags: [{ type: "bill", id: "LIST" }],
    }),

    requestVerification: builder.mutation<
      IBillVerification,
      { billId: string; message: string; missingFields: string[]; requireReupload?: boolean }
    >({
      query: ({ billId, ...body }) => ({
        url: `bills/admin/${billId}/request-verification`,
        method: "POST",
        body,
      }),
      transformResponse: (response: { success: boolean; data: IBillVerification }) =>
        response.data,
      invalidatesTags: (_r, _e, { billId }) => [
        { type: "bill", id: billId },
        { type: "bill", id: "LIST" },
      ],
    }),

    associateBillWithUser: builder.mutation<
      IBill,
      { billId: string; userId: string; pendingBillId?: string }
    >({
      query: ({ billId, ...body }) => ({
        url: `bills/admin/${billId}/associate-user`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { billId }) => [
        { type: "bill" as const, id: billId },
        { type: "bill" as const, id: "LIST" },
      ],
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
  useGetAllOffersForBillQuery,
  useSendSelectedOffersMutation,
  useExtractBillDataMutation,
  useAdminUploadEmailBillMutation,
  useAssociateBillWithUserMutation,
  useRequestVerificationMutation,
} = billApi;
