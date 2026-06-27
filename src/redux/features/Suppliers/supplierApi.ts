import { baseApi } from "../../api/baseApi";

export interface SupplierOffer {
  id: string;
  name: string;
  energyType: string;
  marketType: string;
  pricePerKwh: number | null;
  pricePerSmc: number | null;
  fixedMonthlyFee: number;
  activationCost: number;
  contractDurationMonths: number;
  isGreenEnergy: boolean;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  offerStatus: string;
  offerCode: string | null;
}

export interface ISupplier {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  logoUrl: string | null;
  description: string | null;
  rating: number;
  isActive: boolean;
  status: "active" | "warning" | "inactive";
  commodity: "electricity" | "gas" | "dual" | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  streetAddress: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
  iban: string | null;
  commissionElectricity: number | null;
  commissionGas: number | null;
  contractStartDate: string | null;
  notes: string | null;
  supplierCode: string | null;
  createdAt: string;
  updatedAt: string;
  offers: SupplierOffer[];
}

export interface ISupplierQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  status?: string;
  commodity?: string;
}

export interface ICreateSupplier {
  name: string;
  legalName?: string;
  taxId?: string;
  logoUrl?: string;
  description?: string;
  rating?: number;
  status?: string;
  commodity?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  streetAddress?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  iban?: string;
  commissionElectricity?: number;
  commissionGas?: number;
  contractStartDate?: string;
  notes?: string;
  supplierCode?: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<IPaginatedResponse<ISupplier>, ISupplierQuery | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          if (params.page) qp.set("page", String(params.page));
          if (params.limit) qp.set("limit", String(params.limit));
          if (params.search) qp.set("search", params.search);
          if (params.isActive !== undefined) qp.set("isActive", String(params.isActive));
          if (params.status) qp.set("status", params.status);
          if (params.commodity) qp.set("commodity", params.commodity);
        }
        return { url: `suppliers/admin?${qp.toString()}`, method: "GET" };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<ISupplier> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "supplier" as const, id })),
              { type: "supplier" as const, id: "LIST" },
            ]
          : [{ type: "supplier" as const, id: "LIST" }],
    }),

    getSupplierById: builder.query<ISupplier, string>({
      query: (id) => ({ url: `suppliers/${id}`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: ISupplier }) => response.data,
      providesTags: (_r, _e, id) => [{ type: "supplier" as const, id }],
    }),

    createSupplier: builder.mutation<ISupplier, ICreateSupplier>({
      query: (data) => ({ url: "suppliers", method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: ISupplier }) => response.data,
      invalidatesTags: [{ type: "supplier", id: "LIST" }],
    }),

    updateSupplier: builder.mutation<ISupplier, { id: string; data: Partial<ICreateSupplier> }>({
      query: ({ id, data }) => ({ url: `suppliers/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: { success: boolean; data: ISupplier }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "supplier", id },
        { type: "supplier", id: "LIST" },
      ],
    }),

    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({ url: `suppliers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "supplier", id: "LIST" }],
    }),

    toggleSupplierStatus: builder.mutation<ISupplier, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `suppliers/${id}/toggle-status`,
        method: "PATCH",
        body: { isActive },
      }),
      transformResponse: (response: { success: boolean; data: ISupplier }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "supplier", id },
        { type: "supplier", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useToggleSupplierStatusMutation,
} = supplierApi;
