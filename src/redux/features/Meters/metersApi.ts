import { baseApi } from "../../api/baseApi";
import type {
  IMeter,
  IMeterQuery,
  ICreateMeter,
  IUpdateMeter,
  IPaginatedResponse,
} from "../../../app/MetterReading/types";

const metersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Admin: Get paginated list of all service types
    getMeters: builder.query<IPaginatedResponse<IMeter>, IMeterQuery | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.page) queryParams.set("page", String(params.page));
          if (params.limit) queryParams.set("limit", String(params.limit));
          if (params.search) queryParams.set("search", params.search);
          if (params.utilityType)
            queryParams.set("utilityType", params.utilityType);
          if (params.isActive !== undefined)
            queryParams.set("isActive", params.isActive);
        }
        return {
          url: `meters?${queryParams.toString()}`,
          method: "GET",
        };
      },
      transformResponse: (response: { success: boolean; data: IPaginatedResponse<IMeter> }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "meter" as const,
                id,
              })),
              { type: "meter", id: "LIST" },
            ]
          : [{ type: "meter", id: "LIST" }],
    }),

    // Admin: Get single service type by ID
    getMeterById: builder.query<IMeter, string>({
      query: (id) => ({
        url: `meters/${id}`,
        method: "GET",
      }),
      transformResponse: (response: { success: boolean; data: IMeter }) =>
        response.data,
      providesTags: (_result, _error, id) => [{ type: "meter", id }],
    }),

    // Admin: Create a new service type
    createMeter: builder.mutation<IMeter, ICreateMeter>({
      query: (data) => ({
        url: "meters",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "meter", id: "LIST" }],
    }),

    // Admin: Update service type fields
    updateMeter: builder.mutation<IMeter, { id: string; data: IUpdateMeter }>({
      query: ({ id, data }) => ({
        url: `meters/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "meter", id },
        { type: "meter", id: "LIST" },
      ],
    }),

    // Admin: Soft-delete a service type
    deleteMeter: builder.mutation<void, string>({
      query: (id) => ({
        url: `meters/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "meter", id: "LIST" }],
    }),
  }),
});

export const {
  useGetMetersQuery,
  useGetMeterByIdQuery,
  useCreateMeterMutation,
  useUpdateMeterMutation,
  useDeleteMeterMutation,
} = metersApi;
