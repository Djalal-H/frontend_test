import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, AuthTokens } from "../../types/auth";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; tokens: AuthTokens }>
    ) => {
      const { user, tokens } = action.payload;
      state.user = user;
      state.tokens = tokens;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
    },
    updateTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, updateTokens } =
  authSlice.actions;

export default authSlice.reducer;