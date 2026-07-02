import { baseApi } from "../../api/baseApi";

export interface ICommission {
  id: string;
  agentId: string;
  caseId: string;
  offerId: string;
  supplierId: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "paid";
  commissionType: "activation" | "renewal";
  paidAt: string | null;
  ruleId: string | null;
  approvedAt: string | null;
  approvedById: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  agent?: { id: string; firstName: string; lastName: string; email: string };
  case?: { id: string; caseNumber: string };
  offer?: { id: string; name: string };
  supplier?: { id: string; name: string };
}

export interface ICommissionRule {
  id: string;
  supplierId: string;
  energyType: string;
  commissionAmount: number;
  commissionPercentage: number | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  offerId: string | null;
  target: string;
  createdAt: string;
  updatedAt: string;
  supplier?: { id: string; name: string };
}

export interface ICommissionStats {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  pendingCount: number;
  approvedCount: number;
  paidCount: number;
}

export interface ICommissionQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplierId?: string;
  commissionType?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const commissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCommissions: builder.query<IPaginatedResponse<ICommission>, ICommissionQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.status) qp.set("status", params.status);
          if (params.supplierId) qp.set("supplierId", params.supplierId);
          if (params.commissionType) qp.set("commissionType", params.commissionType);
        }
        return { url: `commissions?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<ICommission> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "commission" as const, id })),
              { type: "commission" as const, id: "LIST" },
            ]
          : [{ type: "commission" as const, id: "LIST" }],
    }),

    getCommissionStats: builder.query<ICommissionStats, void>({
      query: () => ({ url: "commissions/stats", method: "GET" }),
      transformResponse: (response: { success: boolean; data: ICommissionStats }) => response.data,
      providesTags: [{ type: "commission", id: "STATS" }],
    }),

    getCommissionRules: builder.query<ICommissionRule[], void>({
      query: () => ({ url: "commissions/rules", method: "GET" }),
      transformResponse: (response: { success: boolean; data: ICommissionRule[] }) => response.data,
      providesTags: [{ type: "commission", id: "RULES" }],
    }),

    createCommissionRule: builder.mutation<
      ICommissionRule,
      {
        supplierId: string;
        energyType: string;
        commissionAmount: number;
        commissionPercentage?: number;
        validFrom: string;
        validUntil?: string;
        offerId?: string;
        target?: string;
      }
    >({
      query: (data) => ({ url: "commissions/rules", method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: ICommissionRule }) => response.data,
      invalidatesTags: [{ type: "commission", id: "RULES" }],
    }),

    updateCommissionRule: builder.mutation<
      ICommissionRule,
      { id: string; data: Partial<ICommissionRule> }
    >({
      query: ({ id, data }) => ({ url: `commissions/rules/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: ICommissionRule }) => response.data,
      invalidatesTags: [{ type: "commission", id: "RULES" }],
    }),

    approveCommission: builder.mutation<ICommission, string>({
      query: (id) => ({ url: `commissions/${id}/approve`, method: "PATCH" }),
      transformResponse: (response: { success: boolean; data: ICommission }) => response.data,
      invalidatesTags: (_r, _e, id) => [
        { type: "commission", id },
        { type: "commission", id: "LIST" },
        { type: "commission", id: "STATS" },
      ],
    }),

    markCommissionPaid: builder.mutation<ICommission, string>({
      query: (id) => ({ url: `commissions/${id}/pay`, method: "PATCH" }),
      transformResponse: (response: { success: boolean; data: ICommission }) => response.data,
      invalidatesTags: (_r, _e, id) => [
        { type: "commission", id },
        { type: "commission", id: "LIST" },
        { type: "commission", id: "STATS" },
      ],
    }),
  }),
});

export const {
  useGetCommissionsQuery,
  useGetCommissionStatsQuery,
  useGetCommissionRulesQuery,
  useCreateCommissionRuleMutation,
  useUpdateCommissionRuleMutation,
  useApproveCommissionMutation,
  useMarkCommissionPaidMutation,
} = commissionApi;
