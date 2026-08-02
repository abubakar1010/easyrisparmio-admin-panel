import { baseApi } from "../../api/baseApi";

export interface IActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string } | null;
}

export interface IActivityLogQuery {
  page?: number;
  limit?: number;
  search?: string;
  entityType?: string;
}

interface IPaginatedActivityLogs {
  data: IActivityLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const activityLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivityLogs: builder.query<IPaginatedActivityLogs, IActivityLogQuery | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.entityType) searchParams.set("entityType", params.entityType);
        const qs = searchParams.toString();
        return { url: `activity-logs${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedActivityLogs }) =>
        response.data,
      providesTags: [{ type: "activityLog", id: "LIST" }],
    }),
  }),
});

export const { useGetActivityLogsQuery } = activityLogApi;
