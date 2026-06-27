import { server_url } from "../../config";
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { setTokens, logout } from "../features/Auth/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${server_url}`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { token: string } }).auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = (
      api.getState() as { auth: { refreshToken: string | null } }
    ).auth.refreshToken;

    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: "auth/refresh-token",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = (refreshResult.data as { success: boolean; data: { accessToken: string; refreshToken: string } }).data;
        api.dispatch(
          setTokens({
            token: data.accessToken,
            refreshToken: data.refreshToken,
          })
        );
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
        window.location.href = "/auth/sign-in";
      }
    } else {
      api.dispatch(logout());
      window.location.href = "/auth/sign-in";
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "auth", "user", "setting", "meter", "dashboard", "supplier",
    "case", "offer", "bill", "contract", "referral",
    "notification", "commission", "agreement", "support", "faq",
  ],
  endpoints: () => ({}),
});
