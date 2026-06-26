import { baseApi } from "../../api/baseApi";

const settingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSetting: builder.query({
      query: (endpoint) => {
        return {
          url: endpoint,
          method: "GET",
        };
      },
      providesTags: ["setting"],
    }),
    updateSettings: builder.mutation({
      query: ({ url, body }) => ({
        url: url,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["setting"],
    }),
  }),
});

export const { useGetSettingQuery, useUpdateSettingsMutation } = settingApi;
