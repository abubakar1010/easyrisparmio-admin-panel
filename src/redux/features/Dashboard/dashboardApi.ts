import { baseApi } from "../../api/baseApi";

export interface KpiDelta {
  value: number;
  delta: number;
}

export interface AdminDashboardData {
  kpiStats: {
    totalSwitches: KpiDelta;
    activeCustomers: KpiDelta;
    conversionRate: KpiDelta;
    avgProcessingTime: KpiDelta;
  };
  financialKpis: {
    acquisitionCommission: { total: number; count: number };
    recurringCommission: { total: number; count: number };
    pendingRevenue: { total: number; count: number };
    churnRate: number;
  };
  priorityTasks: {
    missingDocuments: number;
    expiringContracts: number;
    pendingValidation: number;
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
  revenueTrend: Array<{
    month: string;
    potential: number;
    validated: number;
    collected: number;
  }>;
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
  }),
});

export const { useGetAdminDashboardQuery } = dashboardApi;
