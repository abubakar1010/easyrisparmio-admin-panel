// import { baseApi } from "../../api/baseApi";

// const authApi = baseApi.injectEndpoints({
//   endpoints: (builder) => ({
//     postLogin: builder.mutation({
//       query: (data) => {
//         return {
//           url: `user/admin-login`,
//           method: "POST",
//           body: data,
//         };
//       },
//       invalidatesTags: ["auth"],
//     }),
//     forgotPassword: builder.mutation({
//       query: (data) => {
//         return {
//           url: `user/forget-password`,
//           method: "POST",
//           body: data,
//         };
//       },
//       invalidatesTags: ["auth"],
//     }),
//     verifyEmail: builder.mutation({
//       query: ({ id, otp }) => {
//         return {
//           url: `user/verify-forget-otp?email=${id}`,
//           method: "POST",
//           body: { otp },
//         };
//       },
//       invalidatesTags: ["auth"],
//     }),
//     resetPassword: builder.mutation({
//       query: ({ id, token, data }) => {
//         return {
//           url: `user/reset-password?email=${id}`,
//           method: "POST",
//           headers: { Authorization: `Bearer ${token}` },
//           body: data,
//         };
//       },
//       invalidatesTags: ["auth"],
//     }),
//     changePasswordByOldPass: builder.mutation({
//       query: (body) => {
//         return {
//           url: `user/change-password`,
//           method: "POST",
//           body,
//         };
//       },
//       invalidatesTags: ["auth"],
//     }),

//     // resendOTP: builder.query({
//     //   query: (id) => {
//     //     return {
//     //       url: `otp/resend?userId=${id}`,
//     //       method: "GET",
//     //     };
//     //   },
//     // }),

//     getUserByToken: builder.query({
//       query: (data) => {
//         return {
//           url: `user/my-profile`,
//           method: "GET",
//         };
//       },
//       providesTags: ["user"],
//     }),
//   }),
// });

// export const {
//   usePostLoginMutation,
//   useGetUserByTokenQuery,
//   useForgotPasswordMutation,
//   useVerifyEmailMutation,
//   useResetPasswordMutation,
//   useChangePasswordByOldPassMutation
// } = authApi;
