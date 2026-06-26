import { baseApi } from "../../api/baseApi";

const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // getAdminNotification: builder.query({
    //   query: ({ id, args }) => {
    //     const params = new URLSearchParams();
    //     if (args) {
    //       args.forEach((item) => {
    //         params.append(item.name, item.value);
    //       });
    //     }
    //     return {
    //       url: `/notifications/${id}`,
    //       method: "GET",
    //       params,
    //     };
    //   },
    //   providesTags: ["notification"],
    // }),
    getAllUser: builder.query({
      query: (args) => {
        const params = new URLSearchParams();
        if (args) {
          args.forEach((item) => {
            params.append(item.name, item.value);
          });
        }
        return {
          url: "user/all-user",
          method: "GET",
          params,
        };
      },
      providesTags: ["user"],
    }),
    getPendingRequest: builder.query({
      query: (args) => {
        const params = new URLSearchParams();
        if (args) {
          args.forEach((item) => {
            params.append(item.name, item.value);
          });
        }
        return {
          url: "user/verification-status",
          method: "GET",
          params,
        };
      },
      providesTags: ["user"],
    }),
    upadateProfile: builder.mutation({
      query: (body) => ({
        url: `user/profile-update`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["user"],
    }),
    acceptVerification: builder.mutation({
      query: ({ id }) => ({
        url: `user/confirm-profile-verification?userId=${id}`,
        method: "POST",
      }),
      invalidatesTags: ["user"],
    }),
    adminNotification: builder.query({
      query: (args) => {
        const params = new URLSearchParams();
        if (args) {
          args.forEach((item) => {
            params.append(item.name, item.value);
          });
        }
        return {
          url: "notification",
          method: "GET",
          params,
        };
      },
      providesTags: ["transaction", "user"],
    }),
    adminNotificationBadge: builder.query({
      query: () => {
        return {
          url: "notification/badge-count",
          method: "GET",
        };
      },
      // providesTags: ["transaction", "user"],
    }),
  }),
});

export const {
  useGetAllUserQuery,
  useGetPendingRequestQuery,
  useAcceptVerificationMutation,
  useUpadateProfileMutation,
  useAdminNotificationQuery,
  useAdminNotificationBadgeQuery
} = usersApi;
