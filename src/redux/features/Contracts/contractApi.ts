import { baseApi } from "../../api/baseApi";

export interface IContractDocument {
  id: string;
  contractId: string;
  documentType: "contract" | "signed";
  fileUrl: string;
  fileName: string;
  originalName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  uploadedById: string;
  createdAt: string;
}

export interface IContract {
  id: string;
  caseId: string;
  offerId: string;
  userId: string;
  contractNumber: string;
  status: "draft" | "sent" | "signed" | "active" | "expired" | "cancelled";
  podPdrNumber: string | null;
  activationDate: string | null;
  expiryDate: string | null;
  signedAt: string | null;
  signedDocumentUrl: string | null;
  deliveryMethod: "app" | "email" | "mail" | "phone" | null;
  documentUrl: string | null;
  monthlyEstimate: number | null;
  renewalDate: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: IContractDocument[];
  switchCase?: { id: string; caseNumber: string; status: string };
  user?: { id: string; firstName: string; lastName: string; email: string };
  offer?: { id: string; name: string };
}

export interface IContractQuery {
  page?: number;
  limit?: number;
  search?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const contractApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContracts: builder.query<IPaginatedResponse<IContract>, IContractQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
        }
        return { url: `contracts?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<IContract> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "contract" as const, id })),
              { type: "contract" as const, id: "LIST" },
            ]
          : [{ type: "contract" as const, id: "LIST" }],
    }),

    getContractById: builder.query<IContract, string>({
      query: (id) => ({ url: `contracts/${id}`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: IContract }) => response.data,
      providesTags: (_r, _e, id) => [{ type: "contract" as const, id }],
    }),

    createContract: builder.mutation<
      IContract,
      {
        caseId: string;
        contractNumber: string;
        podPdrNumber?: string;
        deliveryMethod?: "app" | "email" | "mail" | "phone";
        documentUrl?: string;
      }
    >({
      query: (data) => ({ url: "contracts", method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: IContract }) => response.data,
      invalidatesTags: (_result, _error, { caseId }) => [
        { type: "contract", id: "LIST" },
        { type: "contract", id: `case-${caseId}` },
        { type: "case", id: "LIST" },
        { type: "case", id: caseId },
        { type: "bill" },
        { type: "dashboard", id: "ADMIN" },
        { type: "activityLog", id: "LIST" },
      ],
    }),

    updateContract: builder.mutation<
      IContract,
      {
        id: string;
        data: {
          status?: string;
          activationDate?: string;
          expiryDate?: string;
          signedDocumentUrl?: string;
          monthlyEstimate?: number;
          deliveryMethod?: "app" | "email" | "mail" | "phone";
          documentUrl?: string;
        };
      }
    >({
      query: ({ id, data }) => ({ url: `contracts/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: IContract }) => response.data,
      invalidatesTags: (result, _e, { id }) => [
        { type: "contract", id },
        { type: "contract", id: "LIST" },
        ...(result?.caseId
          ? [
              { type: "contract" as const, id: `case-${result.caseId}` },
              { type: "case" as const, id: result.caseId },
            ]
          : []),
        { type: "case", id: "LIST" },
        { type: "bill" },
        { type: "dashboard", id: "ADMIN" },
        { type: "activityLog", id: "LIST" },
      ],
    }),

    getContractByCase: builder.query<IContract | null, string>({
      query: (caseId) => ({ url: `contracts/case/${caseId}`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: IContract }) => response.data,
      providesTags: (_r, _e, caseId) => [{ type: "contract" as const, id: `case-${caseId}` }],
    }),

    uploadContractDocuments: builder.mutation<
      IContractDocument[],
      {
        contractId: string;
        documents: {
          fileUrl: string;
          fileName: string;
          originalName?: string;
          mimeType?: string;
          fileSizeBytes?: number;
        }[];
      }
    >({
      query: ({ contractId, documents }) => ({
        url: `contracts/${contractId}/documents`,
        method: "POST",
        body: { documents },
      }),
      transformResponse: (response: { success: boolean; data: IContractDocument[] }) =>
        response.data,
      invalidatesTags: (_result, _error, { contractId }) => [
        { type: "contract", id: contractId },
        { type: "contract", id: "LIST" },
        { type: "case", id: "LIST" },
        { type: "activityLog", id: "LIST" },
      ],
    }),

    getContractDocuments: builder.query<IContractDocument[], string>({
      query: (contractId) => ({ url: `contracts/${contractId}/documents`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: IContractDocument[] }) =>
        response.data,
      providesTags: (_r, _e, contractId) => [{ type: "contract" as const, id: `docs-${contractId}` }],
    }),

    deleteContractDocument: builder.mutation<void, { contractId: string; documentId: string }>({
      query: ({ contractId, documentId }) => ({
        url: `contracts/${contractId}/documents/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { contractId }) => [
        { type: "contract", id: contractId },
        { type: "contract", id: `docs-${contractId}` },
        { type: "contract", id: "LIST" },
        { type: "activityLog", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetContractsQuery,
  useGetContractByIdQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useGetContractByCaseQuery,
  useUploadContractDocumentsMutation,
  useGetContractDocumentsQuery,
  useDeleteContractDocumentMutation,
} = contractApi;
