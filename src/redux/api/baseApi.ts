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
    const lang = localStorage.getItem("dashboard_language") || "en";
    headers.set("Accept-Language", lang);
    return headers;
  },
});

let refreshPromise: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // If a refresh is already in progress, wait for it instead of firing another
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshToken = (
          api.getState() as { auth: { refreshToken: string | null } }
        ).auth.refreshToken;

        if (!refreshToken) return false;

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
          const data = (
            refreshResult.data as {
              success: boolean;
              data: { accessToken: string; refreshToken: string };
            }
          ).data;
          api.dispatch(
            setTokens({
              token: data.accessToken,
              refreshToken: data.refreshToken,
            })
          );
          return true;
        }
        return false;
      })().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
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
