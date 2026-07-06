import { baseApi } from "../../api/baseApi";
import type { TProfile } from "../../../types/profile.type";

type LoginResponse = {
  user: TProfile;
  accessToken: string;
  refreshToken: string;
};

type VerifyOtpPayload = {
  email?: string;
  verificationToken?: string;
  code: string;
  type: string;
};

type ResendOtpPayload = {
  email?: string;
  verificationToken?: string;
  type: string;
};

type ResetPasswordPayload = {
  resetToken: string;
  newPassword: string;
};

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

type MessageResponse = {
  message: string;
  resetToken?: string;
};

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    postLogin: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (data) => ({
        url: "auth/login",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: LoginResponse }) =>
        response.data,
    }),
    forgotPassword: builder.mutation<MessageResponse, { email: string }>({
      query: (data) => ({
        url: "auth/forgot-password",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: MessageResponse }) =>
        response.data,
    }),
    verifyOtp: builder.mutation<MessageResponse, VerifyOtpPayload>({
      query: (data) => ({
        url: "auth/verify-otp",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: MessageResponse }) =>
        response.data,
    }),
    resendOtp: builder.mutation<MessageResponse, ResendOtpPayload>({
      query: (data) => ({
        url: "auth/resend-otp",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: MessageResponse }) =>
        response.data,
    }),
    resetPassword: builder.mutation<MessageResponse, ResetPasswordPayload>({
      query: (data) => ({
        url: "auth/reset-password",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: MessageResponse }) =>
        response.data,
    }),
    refreshToken: builder.mutation<TokenResponse, { refreshToken: string }>({
      query: (data) => ({
        url: "auth/refresh-token",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: TokenResponse }) =>
        response.data,
    }),
    postLogout: builder.mutation<MessageResponse, { refreshToken: string }>({
      query: (data) => ({
        url: "auth/logout",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: MessageResponse }) =>
        response.data,
    }),
    getMe: builder.query<TProfile, void>({
      query: () => ({
        url: "auth/me",
        method: "GET",
      }),
      transformResponse: (response: { success: boolean; data: TProfile }) =>
        response.data,
      providesTags: ["user"],
    }),
    updateProfile: builder.mutation<
      TProfile,
      { firstName?: string; lastName?: string; phone?: string }
    >({
      query: (data) => ({
        url: "users/profile",
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: TProfile }) =>
        response.data,
      invalidatesTags: ["user"],
    }),
  }),
});

export const {
  usePostLoginMutation,
  usePostLogoutMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useResetPasswordMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
} = authApi;
