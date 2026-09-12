import { baseApi } from "../../api/baseApi";
import type { OfferPaymentMethod } from "../Offers/offerApi";

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
  supplyStreet?: "high" | "medium" | "low" | null;
  supplyStreetNumber?: "high" | "medium" | "low" | null;
  supplyCity?: "high" | "medium" | "low" | null;
  supplyPostalCode?: "high" | "medium" | "low" | null;
  supplyProvince?: "high" | "medium" | "low" | null;
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
  supplyStreet: string | null;
  supplyStreetNumber: string | null;
  supplyCity: string | null;
  supplyPostalCode: string | null;
  supplyProvince: string | null;
  codiceFiscale: string | null;
  partitaIva: string | null;
  contractNumber: string | null;
  meterNumber: string | null;
  customerName: string | null;
  confidence: IBillFieldConfidence;
  overallConfidence: "high" | "medium" | "low";
}

export interface IBillVerification {
  id: string;
  billId: string;
  adminMessage: string;
  /**
   * What was sent back to the customer. Only `bill` is created now — contracts
   * are signed with the supplier, outside the app. `contract` survives so
   * historic rows still render.
   */
  type: "bill" | "contract";
  status: "pending" | "submitted" | "resolved";
  userMessage: string | null;
  files: IBillFile[];
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
  verificationId: string | null;
  createdAt: string;
}

export interface IBill {
  id: string;
  fileUrl: string | null;
  billType: "electricity" | "gas";
  status: "pending_email" | "uploaded" | "analyzing" | "analyzed" | "error" | "verification_review" | "verification_required" | "verified" | "offer_sent" | "offer_accepted" | "contract_sent" | "awaiting_activation" | "activated" | "cancelled";
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
  /** The five fields below rendered as one line. Derived — never edited on its own. */
  supplyAddress: string | null;
  supplyStreet: string | null;
  supplyStreetNumber: string | null;
  supplyCity: string | null;
  supplyPostalCode: string | null;
  supplyProvince: string | null;
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
  // `role` distinguishes the two account kinds. The bill is loaded with its
  // whole `user` relation, so the API already sends it — a company's certified
  // address included, which is a separate row from the sign-in email.
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: "personal" | "business" | "admin";
    businessProfile?: {
      companyName?: string | null;
      partitaIva?: string | null;
      pecEmail?: string | null;
    } | null;
  };
  supplier?: { id: string; name: string } | null;
  files?: IBillFile[] | null;
  verifications?: IBillVerification[] | null;
  switchCases?: Array<{
    id: string;
    caseNumber: string | null;
    status: string;
    caseType: string;
    priority: string;
    selectedOfferId: string;
    contractSentAt?: string | null;
    activationDate?: string | null;
    expiryDate?: string | null;
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
  source?: string;
  userId?: string;
}

export interface IOfferWithSavings {
  id: string;
  name: string;
  description: string | null;
  compensation: string;
  energyType: "electricity" | "gas" | "dual";
  marketType: "fixed" | "variable" | "indexed";
  pricePerKwh: number | null;
  pricePerSmc: number | null;
  spread: number | null;
  fixedMonthlyFee: number;
  activationCost: number;
  contractDurationDays: number;
  isGreenEnergy: boolean;
  paymentMethod: OfferPaymentMethod;
  offerStatus: string;
  supplierId: string;
  supplier?: { id: string; name: string } | null;
  estimatedSavings: number;
  isSent?: boolean;
  sentAt?: string | null;
  /**
   * Where this offer sits in the list the customer sees, 0 first. Null until
   * the offer has been sent — an offer nobody has been shown has no place in
   * their list yet. Sent offers come back ahead of the rest of the catalogue,
   * already in this order.
   */
  displayOrder?: number | null;
}

/**
 * The order the Offers tab lists offers in, mirroring what the API already
 * sorted: the offers the customer has, in the order the admin arranged, then
 * the rest of the catalogue in the price order it arrived in. Applied again on
 * the client so an optimistic reorder lands without waiting for a refetch.
 */
export function compareByDisplayOrder(
  a: IOfferWithSavings,
  b: IOfferWithSavings,
): number {
  const left = a.displayOrder ?? null;
  const right = b.displayOrder ?? null;
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
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
      invalidatesTags: (_result, error, { billId }) =>
        error
          ? []
          : [
              { type: "bill", id: billId },
              { type: "bill", id: "LIST" },
              { type: "offer", id: `bill-offers-${billId}` },
              { type: "dashboard", id: "ADMIN" },
              { type: "activityLog", id: "LIST" },
            ],
    }),

    /**
     * Saves the order the customer will see the sent offers in, first shown
     * first. The dashboard has already moved the row on screen through
     * `applyOfferOrderLocally` by the time this is called.
     *
     * Only a refusal re-reads the list: on success what is on screen already is
     * the order that was saved, and re-fetching it would make the rows jump for
     * nothing.
     */
    reorderBillOffers: builder.mutation<
      { message: string },
      { billId: string; offerIds: string[] }
    >({
      query: ({ billId, offerIds }) => ({
        url: `bills/admin/${billId}/offers-order`,
        method: "PATCH",
        body: { offerIds },
      }),
      invalidatesTags: (_result, error, { billId }) =>
        error
          ? [{ type: "offer" as const, id: `bill-offers-${billId}` }]
          : [{ type: "activityLog" as const, id: "LIST" }],
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
      invalidatesTags: [{ type: "bill", id: "LIST" }, { type: "dashboard", id: "ADMIN" }, { type: "activityLog", id: "LIST" }],
    }),

    requestVerification: builder.mutation<
      IBillVerification,
      { billId: string; message: string }
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
        { type: "dashboard", id: "ADMIN" },
        { type: "activityLog", id: "LIST" },
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
        { type: "dashboard" as const, id: "ADMIN" },
        { type: "activityLog" as const, id: "LIST" },
      ],
    }),

    transitionBillStatus: builder.mutation<
      IBill,
      {
        billId: string;
        targetStatus: string;
        message?: string;
        /** Both required when moving to `awaiting_activation`. `YYYY-MM-DD`. */
        activationDate?: string;
        expiryDate?: string;
      }
    >({
      query: ({ billId, ...body }) => ({
        url: `bills/admin/${billId}/transition`,
        method: "POST",
        body,
      }),
      transformResponse: (response: { success: boolean; data: IBill }) => response.data,
      // A status change also rewrites the case timeline and can set or clear the
      // activation dates, so the case caches are invalidated too.
      invalidatesTags: (result, _e, { billId }) => [
        { type: "bill", id: billId },
        { type: "bill", id: "LIST" },
        { type: "case", id: "LIST" },
        ...(result?.switchCases ?? []).map((c) => ({
          type: "case" as const,
          id: c.id,
        })),
        { type: "dashboard", id: "ADMIN" },
        { type: "activityLog", id: "LIST" },
      ],
    }),

    updateBillAdmin: builder.mutation<
      IBill,
      { billId: string; data: Partial<Omit<IBill, "id" | "status" | "userId" | "source" | "rawAnalysisData" | "createdAt" | "updatedAt" | "user" | "supplier" | "files" | "verifications" | "switchCases">> }
    >({
      query: ({ billId, data }) => ({
        url: `bills/admin/${billId}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: IBill }) => response.data,
      invalidatesTags: (_r, _e, { billId }) => [
        { type: "bill", id: billId },
        { type: "bill", id: "LIST" },
        { type: "dashboard", id: "ADMIN" },
        { type: "activityLog", id: "LIST" },
      ],
    }),
    getBillNotes: builder.query<IBillNote[], string>({
      query: (billId) => ({ url: `bills/${billId}/notes`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: IBillNote[] }) => response.data,
      providesTags: (_r, _e, billId) => [{ type: "bill" as const, id: `${billId}-notes` }],
    }),

    addBillNote: builder.mutation<IBillNote, { billId: string; content: string }>({
      query: ({ billId, content }) => ({
        url: `bills/${billId}/notes`,
        method: "POST",
        body: { content },
      }),
      transformResponse: (response: { success: boolean; data: IBillNote }) => response.data,
      invalidatesTags: (_r, _e, { billId }) => [
        { type: "bill", id: `${billId}-notes` },
      ],
    }),

    updateBillNote: builder.mutation<IBillNote, { billId: string; noteId: string; content: string }>({
      query: ({ billId, noteId, content }) => ({
        url: `bills/${billId}/notes/${noteId}`,
        method: "PATCH",
        body: { content },
      }),
      transformResponse: (response: { success: boolean; data: IBillNote }) => response.data,
      invalidatesTags: (_r, _e, { billId }) => [
        { type: "bill", id: `${billId}-notes` },
      ],
    }),

    deleteBillNote: builder.mutation<void, { billId: string; noteId: string }>({
      query: ({ billId, noteId }) => ({
        url: `bills/${billId}/notes/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { billId }) => [
        { type: "bill", id: `${billId}-notes` },
      ],
    }),
  }),
});

/**
 * Rewrites the cached offer list into `offerIds` order, top first, without
 * going near the server.
 *
 * The dashboard dispatches this the instant a row is dropped so it lands where
 * it was let go, and only then sends the order on with
 * `useReorderBillOffersMutation`. Waiting for the round trip would have the row
 * spring back to its old place for as long as it took.
 */
export const applyOfferOrderLocally = (billId: string, offerIds: string[]) =>
  billApi.util.updateQueryData("getAllOffersForBill", billId, (draft) => {
    const positions = new Map(offerIds.map((id, index) => [id, index]));
    for (const offer of draft) {
      const position = positions.get(offer.id);
      if (position !== undefined) offer.displayOrder = position;
    }
    draft.sort(compareByDisplayOrder);
  });

export interface IBillNote {
  id: string;
  billId: string;
  content: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; firstName: string; lastName: string; email: string };
}

export const {
  useGetBillsAdminQuery,
  useGetBillByIdAdminQuery,
  useUploadBillMutation,
  useGetAllOffersForBillQuery,
  useSendSelectedOffersMutation,
  useReorderBillOffersMutation,
  useExtractBillDataMutation,
  useAdminUploadEmailBillMutation,
  useAssociateBillWithUserMutation,
  useRequestVerificationMutation,
  useTransitionBillStatusMutation,
  useUpdateBillAdminMutation,
  useGetBillNotesQuery,
  useAddBillNoteMutation,
  useUpdateBillNoteMutation,
  useDeleteBillNoteMutation,
} = billApi;
