import { createSlice } from "@reduxjs/toolkit";
import type { TProfile } from "../../../types/profile.type";

type AuthState = {
  user: TProfile | null;
  token: string | null;
  isLoading: boolean;
};
const demoUser: TProfile = {
  name: "Dr. Kiran Patel",
  email: "habib@gamil.com",
  role: "admin",
};
const initialState: AuthState = {
  user: demoUser,
  token: null,
  isLoading: true,
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLogin: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isLoading = false;
    },
    setUser: (state, action) => {
      const { user } = action.payload;
      state.user = user;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isLoading = false;
    },
  },
});

export const { setLogin, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
