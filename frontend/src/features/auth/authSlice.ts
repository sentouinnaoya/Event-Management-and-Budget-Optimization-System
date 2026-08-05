import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserInfo } from "../../lib/types";

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; user: UserInfo }>
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logout(state) {
      state.token = null;
      state.user = null;
    },
    setInitialized(state) {
      state.initialized = true;
    },
  },
});

export const { setCredentials, logout, setInitialized } = authSlice.actions;
export default authSlice.reducer;
