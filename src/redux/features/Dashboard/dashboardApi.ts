import { baseApi } from "../../api/baseApi";

export interface IAdminSettings {
  id: string;
  autoSendOffers: boolean;
  maxRecommendedOffers: number;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

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

    getAdminSettings: builder.query<IAdminSettings, void>({
      query: () => ({ url: "dashboard/admin/settings", method: "GET" }),
      transformResponse: (response: { success: boolean; data: IAdminSettings }) =>
        response.data,
      providesTags: [{ type: "setting", id: "ADMIN" }],
    }),

    updateAdminSettings: builder.mutation<IAdminSettings, Partial<IAdminSettings>>({
      query: (data) => ({
        url: "dashboard/admin/settings",
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: IAdminSettings }) =>
        response.data,
      invalidatesTags: [{ type: "setting", id: "ADMIN" }],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
} = dashboardApi;
