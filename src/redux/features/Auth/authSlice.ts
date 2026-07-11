import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { TProfile } from "../../../types/profile.type";

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type AuthState = {
  user: TProfile | null;
  token: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: number | null;
  isLoading: boolean;
};

const storedToken = localStorage.getItem("auth_token");
const storedRefreshToken = localStorage.getItem("auth_refreshToken");
const storedUser = localStorage.getItem("auth_user");
const storedRefreshTokenExpiresAt = localStorage.getItem("auth_refreshTokenExpiresAt");

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  refreshToken: storedRefreshToken || null,
  refreshTokenExpiresAt: storedRefreshTokenExpiresAt ? Number(storedRefreshTokenExpiresAt) : null,
  isLoading: !!storedToken,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLogin: (
      state,
      action: PayloadAction<{
        user: TProfile;
        token: string;
        refreshToken: string;
      }>
    ) => {
      const { user, token, refreshToken } = action.payload;
      const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRY_MS;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.refreshTokenExpiresAt = expiresAt;
      state.isLoading = false;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_refreshToken", refreshToken);
      localStorage.setItem("auth_refreshTokenExpiresAt", String(expiresAt));
      localStorage.setItem("auth_user", JSON.stringify(user));
    },
    setTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>
    ) => {
      const { token, refreshToken } = action.payload;
      const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRY_MS;
      state.token = token;
      state.refreshToken = refreshToken;
      state.refreshTokenExpiresAt = expiresAt;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_refreshToken", refreshToken);
      localStorage.setItem("auth_refreshTokenExpiresAt", String(expiresAt));
    },
    setUser: (state, action: PayloadAction<{ user: TProfile }>) => {
      const { user } = action.payload;
      state.user = user;
      state.isLoading = false;
      localStorage.setItem("auth_user", JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.refreshTokenExpiresAt = null;
      state.isLoading = false;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_refreshToken");
      localStorage.removeItem("auth_refreshTokenExpiresAt");
      localStorage.removeItem("auth_user");
    },
  },
});

export const { setLogin, setTokens, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
