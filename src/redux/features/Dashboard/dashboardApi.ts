import { baseApi } from "../../api/baseApi";

export interface KpiDelta {
  value: number;
  delta: number;
  sparkline: number[];
}

/**
 * The buckets of outstanding work behind the Priority Tasks card. Mirrors
 * `PriorityTaskCategory` on the server, where the definitions live.
 */
export type PriorityTaskCategory =
  | "analysis_failed"
  | "pending_validation"
  | "email_bill_requests"
  | "missing_documents"
  | "offers_to_send"
  | "expiring_contracts"
  | "contracts_to_process"
  | "follow_up_required";

export type PriorityTaskSeverity = "critical" | "high" | "medium" | "low";

export interface PriorityTaskCategoryCount {
  key: PriorityTaskCategory;
  severity: PriorityTaskSeverity;
  /** Whose move it is. Both count as open work — it only changes the wording. */
  owner: "admin" | "customer";
  count: number;
}

export interface PriorityTaskItem {
  id: string;
  category: PriorityTaskCategory;
  /** Where the task opens: `/case-management/{billId}`. */
  billId: string | null;
  caseId: string | null;
  caseNumber: string | null;
  /** Bill status for a pipeline task, case status for a renewal. */
  status: string;
  billType: "electricity" | "gas" | null;
  podPdr: string | null;
  supplierName: string | null;
  amount: number | null;
  waitingSince: string;
  daysWaiting: number;
  /** Contract expiry, on renewals only. */
  dueDate: string | null;
  /** Days until `dueDate`; negative once it has passed. */
  daysUntilDue: number | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
  } | null;
}

export interface IPriorityTaskQuery {
  /** Omit to list every open task — that is what "View all tasks" opens. */
  category?: PriorityTaskCategory;
  page?: number;
  limit?: number;
  search?: string;
}

export interface IPaginatedPriorityTasks {
  data: PriorityTaskItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminDashboardData {
  kpiStats: {
    totalSwitches: KpiDelta;
    activeCustomers: KpiDelta;
    conversionRate: KpiDelta;
    avgProcessingTime: KpiDelta;
  };
  priorityTasks: {
    /** Every open task, across all buckets. */
    total: number;
    /** Ordered most urgent first by the server; render them as they arrive. */
    categories: PriorityTaskCategoryCount[];
    /** @deprecated Superseded by `categories`. Kept for older builds. */
    missingDocuments: number;
    /** @deprecated Superseded by `categories`. */
    expiringContracts: number;
    /** @deprecated Superseded by `categories`. */
    pendingValidation: number;
    /** @deprecated Superseded by `categories`. */
    followUpRequired: number;
  };
  conversionFunnel: {
    requestReceived: number;
    documentation: number;
    validation: number;
    activation: number;
    rejected: number;
    conversionRate: number;
  };
  activeAlerts: Array<{
    id: string;
    alertType: string;
    severity: string;
    title: string;
    description: string | null;
    entityType: string | null;
    entityId: string | null;
    relatedData: Record<string, unknown> | null;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string } | null;
  }>;
}

const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<AdminDashboardData, void>({
      query: () => ({
        url: "dashboard/admin",
        method: "GET",
      }),
      transformResponse: (response: {
        success: boolean;
        data: AdminDashboardData;
      }) => response.data,
      providesTags: [{ type: "dashboard", id: "ADMIN" }],
    }),

    /** The customers and cases behind one bucket, or behind all of them. */
    getPriorityTasks: builder.query<
      IPaginatedPriorityTasks,
      IPriorityTaskQuery | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.category) searchParams.set("category", params.category);
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        const qs = searchParams.toString();
        return {
          url: `dashboard/admin/tasks${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      transformResponse: (response: {
        success: boolean;
        data: IPaginatedPriorityTasks;
      }) => response.data,
      // Also claims the ADMIN tag: the list and the counts on the card are the
      // same numbers, so every mutation that already refreshes the dashboard —
      // a status transition, an offer sent, a case update — has to refresh this
      // too, or an admin who clears a task keeps seeing it in the list.
      providesTags: [
        { type: "dashboard", id: "TASKS" },
        { type: "dashboard", id: "ADMIN" },
      ],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetPriorityTasksQuery,
} = dashboardApi;
