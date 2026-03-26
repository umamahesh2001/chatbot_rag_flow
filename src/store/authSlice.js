import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    if (!token) return { user: null, token: null };
    try {
      const data = await api.getProfile();
      return { user: data.user, token };
    } catch {
      localStorage.removeItem("token");
      return { user: null, token: null };
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const data = await api.register({ name, email, password });
      return { ...data, email };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const data = await api.verifyOTP({ email, otp });
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resendOTP = createAsyncThunk(
  "auth/resendOTP",
  async ({ email }, { rejectWithValue }) => {
    try {
      return await api.resendOTP({ email });
    } catch (error) {
      const err = { message: error.message };
      if (error.retryAfter) err.retryAfter = error.retryAfter;
      return rejectWithValue(err);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await api.login({ email, password });
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      const err = { message: error.message };
      if (error.needsVerification) {
        err.needsVerification = true;
        err.email = error.email;
      }
      return rejectWithValue(err);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
    isLoading: true,
    error: null,
    pendingEmail: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setError: (state, action) => { state.error = action.payload; },
    setPendingEmail: (state, action) => { state.pendingEmail = action.payload; },
    logout: (state) => {
      localStorage.removeItem("token");
      state.user = null;
      state.token = null;
      state.pendingEmail = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoading = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.pendingEmail = action.payload.email;
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.pendingEmail = null;
        state.isLoading = false;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })
      // Resend OTP
      .addCase(resendOTP.rejected, (state, action) => {
        state.error = action.payload?.message || action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload?.message || action.payload;
        if (action.payload?.needsVerification) {
          state.pendingEmail = action.payload.email;
        }
        state.isLoading = false;
      });
  },
});

export const { clearError, setError, setPendingEmail, logout } = authSlice.actions;
export default authSlice.reducer;
