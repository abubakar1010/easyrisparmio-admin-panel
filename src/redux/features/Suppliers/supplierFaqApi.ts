import { baseApi } from "../../api/baseApi";

/**
 * A FAQ written for one supplier. The active ones are shown to that supplier's
 * customers in the FAQ section of the utility details in the app.
 */
export interface ISupplierFaq {
  id: string;
  supplierId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ISupplierFaqInput {
  question: string;
  answer: string;
  sortOrder?: number;
  isActive?: boolean;
}

const listTag = (supplierId: string) => ({ type: "faq" as const, id: `supplier-${supplierId}` });

const supplierFaqApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSupplierFaqs: builder.query<ISupplierFaq[], string>({
      query: (supplierId) => ({ url: `suppliers/${supplierId}/faqs`, method: "GET" }),
      transformResponse: (response: { success: boolean; data: ISupplierFaq[] }) => response.data,
      providesTags: (_r, _e, supplierId) => [listTag(supplierId)],
    }),

    createSupplierFaq: builder.mutation<ISupplierFaq, { supplierId: string; data: ISupplierFaqInput }>({
      query: ({ supplierId, data }) => ({ url: `suppliers/${supplierId}/faqs`, method: "POST", body: data }),
      transformResponse: (response: { success: boolean; data: ISupplierFaq }) => response.data,
      invalidatesTags: (_r, _e, { supplierId }) => [listTag(supplierId), { type: "activityLog", id: "LIST" }],
    }),

    updateSupplierFaq: builder.mutation<
      ISupplierFaq,
      { supplierId: string; faqId: string; data: Partial<ISupplierFaqInput> }
    >({
      query: ({ supplierId, faqId, data }) => ({
        url: `suppliers/${supplierId}/faqs/${faqId}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: ISupplierFaq }) => response.data,
      invalidatesTags: (_r, _e, { supplierId }) => [listTag(supplierId), { type: "activityLog", id: "LIST" }],
    }),

    deleteSupplierFaq: builder.mutation<{ message: string }, { supplierId: string; faqId: string }>({
      query: ({ supplierId, faqId }) => ({ url: `suppliers/${supplierId}/faqs/${faqId}`, method: "DELETE" }),
      transformResponse: (response: { success: boolean; data: { message: string } }) => response.data,
      invalidatesTags: (_r, _e, { supplierId }) => [listTag(supplierId), { type: "activityLog", id: "LIST" }],
    }),
  }),
});

export const {
  useGetSupplierFaqsQuery,
  useCreateSupplierFaqMutation,
  useUpdateSupplierFaqMutation,
  useDeleteSupplierFaqMutation,
} = supplierFaqApi;
