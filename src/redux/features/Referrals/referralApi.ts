import { baseApi } from "../../api/baseApi";

export interface IReferral {
  id: string;
  referrerId: string;
  referralCode: string;
  referredEmail: string | null;
  referredPhone: string | null;
  referredUserId: string | null;
  status: "pending" | "registered" | "qualified" | "rewarded" | "expired";
  rewardAmount: number | null;
  rewardCreditedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  referrer?: { id: string; firstName: string; lastName: string; email: string };
  referredUser?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export interface IReferralStats {
  totalReferrals: number;
  pending: number;
  registered: number;
  qualified: number;
  rewarded: number;
  expired: number;
  totalRewardsPaid: number;
}

export interface IReferralQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const referralApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReferralStats: builder.query<IReferralStats, void>({
      query: () => ({ url: "referrals/stats", method: "GET" }),
      transformResponse: (response: { success: boolean; data: IReferralStats }) => response.data,
      providesTags: [{ type: "referral", id: "STATS" }],
    }),

    getReferrals: builder.query<IPaginatedResponse<IReferral>, IReferralQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.status) qp.set("status", params.status);
        }
        return { url: `referrals?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<IReferral> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "referral" as const, id })),
              { type: "referral" as const, id: "LIST" },
            ]
          : [{ type: "referral" as const, id: "LIST" }],
    }),

    updateReferralStatus: builder.mutation<
      IReferral,
      { id: string; status: string; rewardAmount?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `referrals/${id}/status`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: { success: boolean; data: IReferral }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "referral", id },
        { type: "referral", id: "LIST" },
        { type: "referral", id: "STATS" },
      ],
    }),
  }),
});

export const {
  useGetReferralStatsQuery,
  useGetReferralsQuery,
  useUpdateReferralStatusMutation,
} = referralApi;
