import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { TProfile } from "../../../types/profile.type";

type AuthState = {
  user: TProfile | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
};

const storedToken = localStorage.getItem("auth_token");
const storedRefreshToken = localStorage.getItem("auth_refreshToken");
const storedUser = localStorage.getItem("auth_user");

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  refreshToken: storedRefreshToken || null,
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
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isLoading = false;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_refreshToken", refreshToken);
      localStorage.setItem("auth_user", JSON.stringify(user));
    },
    setTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>
    ) => {
      const { token, refreshToken } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_refreshToken", refreshToken);
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
      state.isLoading = false;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_refreshToken");
      localStorage.removeItem("auth_user");
    },
  },
});

export const { setLogin, setTokens, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
