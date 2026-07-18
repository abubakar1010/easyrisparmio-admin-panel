import { baseApi } from "../../api/baseApi";

export interface ICaseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ICaseDocument {
  id: string;
  caseId: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  uploadedById: string;
  verified: boolean;
  verifiedById: string | null;
  verifiedAt: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  createdAt: string;
  uploadedBy?: ICaseUser;
}

export interface ICaseEvent {
  id: string;
  caseId: string;
  eventType: string;
  title: string;
  description: string | null;
  oldStatus: string | null;
  newStatus: string | null;
  actorId: string | null;
  actorLabel: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor?: ICaseUser | null;
}

export interface ICase {
  id: string;
  userId: string;
  billId: string;
  selectedOfferId: string;
  assignedAgentId: string | null;
  status: string;
  priority: string;
  notes: string | null;
  internalNotes: string | null;
  caseNumber: string | null;
  caseType: string;
  slaDeadline: string | null;
  slaDaysTotal: number | null;
  estimatedAnnualValue: number | null;
  fromSupplierId: string | null;
  toSupplierId: string | null;
  meterId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: ICaseUser;
  assignedAgent?: ICaseUser | null;
  selectedOffer?: { id: string; name: string; supplier?: { id: string; name: string } };
  bill?: { id: string; billType: string; totalAmount: number | null; podNumber?: string | null; pdrNumber?: string | null };
  fromSupplier?: { id: string; name: string } | null;
  toSupplier?: { id: string; name: string } | null;
  documents?: ICaseDocument[];
  contract?: { id: string; contractNumber: string; status: string; deliveryMethod?: string | null; documentUrl?: string | null; signedDocumentUrl?: string | null; signedAt?: string | null; activationDate?: string | null; expiryDate?: string | null; createdAt?: string } | null;
  events?: ICaseEvent[];
}

export interface ICaseQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  assignedAgentId?: string;
  userId?: string;
}

export interface IUpdateCase {
  status?: string;
  priority?: string;
  notes?: string;
  internalNotes?: string;
  assignedAgentId?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const caseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCases: builder.query<IPaginatedResponse<ICase>, ICaseQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.status) qp.set("status", params.status);
          if (params.priority) qp.set("priority", params.priority);
          if (params.assignedAgentId) qp.set("assignedAgentId", params.assignedAgentId);
          if (params.userId) qp.set("userId", params.userId);
        }
        return { url: `cases?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<ICase> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "case" as const, id })),
              { type: "case" as const, id: "LIST" },
            ]
          : [{ type: "case" as const, id: "LIST" }],
    }),

    getCaseById: builder.query<ICase, string>({
      query: (id) => ({ url: `cases/${id}`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: ICase }) => response.data,
      providesTags: (_r, _e, id) => [{ type: "case" as const, id }],
    }),

    updateCase: builder.mutation<ICase, { id: string; data: IUpdateCase }>({
      query: ({ id, data }) => ({ url: `cases/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: ICase }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "case", id },
        { type: "case", id: "LIST" },
      ],
    }),

    getCaseDocuments: builder.query<ICaseDocument[], string>({
      query: (caseId) => ({ url: `cases/${caseId}/documents`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: ICaseDocument[] }) => response.data,
    }),

    uploadCaseDocument: builder.mutation<
      ICaseDocument,
      { caseId: string; documentType: string; fileUrl: string; fileName: string }
    >({
      query: ({ caseId, ...body }) => ({
        url: `cases/${caseId}/documents`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { caseId }) => [{ type: "case", id: caseId }],
    }),

    verifyDocument: builder.mutation<ICaseDocument, { caseId: string; docId: string }>({
      query: ({ caseId, docId }) => ({
        url: `cases/${caseId}/documents/${docId}/verify`,
        method: "PATCH",
      }),
      invalidatesTags: (_r, _e, { caseId }) => [{ type: "case", id: caseId }],
    }),
  }),
});

export const {
  useGetCasesQuery,
  useGetCaseByIdQuery,
  useUpdateCaseMutation,
  useGetCaseDocumentsQuery,
  useUploadCaseDocumentMutation,
  useVerifyDocumentMutation,
} = caseApi;
