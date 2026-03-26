import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

// ─── Email Accounts ───

export const fetchAccounts = createAsyncThunk("email/fetchAccounts", async (_, { rejectWithValue }) => {
  try {
    const data = await api.getEmailAccounts();
    return data.accounts;
  } catch (error) { return rejectWithValue(error.message); }
});

export const addAccount = createAsyncThunk("email/addAccount", async ({ email, label }, { dispatch, rejectWithValue }) => {
  try {
    const data = await api.addEmailAccount({ email, label });
    dispatch(fetchAccounts());
    return data;
  } catch (error) { return rejectWithValue(error.message); }
});

export const verifyAccount = createAsyncThunk("email/verifyAccount", async ({ id, otp }, { dispatch, rejectWithValue }) => {
  try {
    const data = await api.verifyEmailAccount(id, { otp });
    dispatch(fetchAccounts());
    return data;
  } catch (error) { return rejectWithValue(error.message); }
});

export const resendAccountOtp = createAsyncThunk("email/resendAccountOtp", async (id, { rejectWithValue }) => {
  try {
    return await api.resendEmailAccountOtp(id);
  } catch (error) { return rejectWithValue(error.message); }
});

export const setDefaultAccount = createAsyncThunk("email/setDefaultAccount", async (id, { dispatch, rejectWithValue }) => {
  try {
    await api.setDefaultEmailAccount(id);
    dispatch(fetchAccounts());
  } catch (error) { return rejectWithValue(error.message); }
});

export const removeAccount = createAsyncThunk("email/removeAccount", async (id, { rejectWithValue }) => {
  try {
    await api.deleteEmailAccount(id);
    return id;
  } catch (error) { return rejectWithValue(error.message); }
});

// ─── Templates ───

export const fetchTemplates = createAsyncThunk("email/fetchTemplates", async (_, { rejectWithValue }) => {
  try {
    const data = await api.getTemplates();
    return data.templates;
  } catch (error) { return rejectWithValue(error.message); }
});

export const createTemplate = createAsyncThunk("email/createTemplate", async (payload, { dispatch, rejectWithValue }) => {
  try {
    const data = await api.createTemplate(payload);
    dispatch(fetchTemplates());
    return data;
  } catch (error) { return rejectWithValue(error.message); }
});

export const updateTemplate = createAsyncThunk("email/updateTemplate", async ({ id, ...payload }, { dispatch, rejectWithValue }) => {
  try {
    const data = await api.updateTemplate(id, payload);
    dispatch(fetchTemplates());
    return data;
  } catch (error) { return rejectWithValue(error.message); }
});

export const deleteTemplate = createAsyncThunk("email/deleteTemplate", async (id, { rejectWithValue }) => {
  try {
    await api.deleteTemplate(id);
    return id;
  } catch (error) { return rejectWithValue(error.message); }
});

// ─── Campaigns ───

export const fetchCampaigns = createAsyncThunk("email/fetchCampaigns", async (_, { rejectWithValue }) => {
  try {
    const data = await api.getCampaigns();
    return data.campaigns;
  } catch (error) { return rejectWithValue(error.message); }
});

export const fetchCampaign = createAsyncThunk("email/fetchCampaign", async (id, { rejectWithValue }) => {
  try {
    const data = await api.getCampaign(id);
    return data.campaign;
  } catch (error) { return rejectWithValue(error.message); }
});

export const createCampaign = createAsyncThunk("email/createCampaign", async (payload, { dispatch, rejectWithValue }) => {
  try {
    const data = await api.createCampaign(payload);
    dispatch(fetchCampaigns());
    return data;
  } catch (error) { return rejectWithValue(error.message); }
});

export const updateCampaign = createAsyncThunk("email/updateCampaign", async ({ id, ...payload }, { dispatch, rejectWithValue }) => {
  try {
    const data = await api.updateCampaign(id, payload);
    dispatch(fetchCampaigns());
    return data;
  } catch (error) { return rejectWithValue(error.message); }
});

export const sendCampaign = createAsyncThunk("email/sendCampaign", async (id, { dispatch, rejectWithValue }) => {
  try {
    const data = await api.sendCampaign(id);
    dispatch(fetchCampaigns());
    return data;
  } catch (error) { return rejectWithValue(error.message); }
});

export const deleteCampaign = createAsyncThunk("email/deleteCampaign", async (id, { rejectWithValue }) => {
  try {
    await api.deleteCampaign(id);
    return id;
  } catch (error) { return rejectWithValue(error.message); }
});

// ─── Slice ───

const emailSlice = createSlice({
  name: "email",
  initialState: {
    accounts: [],
    accountsLoading: false,
    templates: [],
    templatesLoading: false,
    campaigns: [],
    campaignsLoading: false,
    activeCampaign: null,
    error: null,
  },
  reducers: {
    setError: (state, action) => { state.error = action.payload; },
    clearError: (state) => { state.error = null; },
    clearActiveCampaign: (state) => { state.activeCampaign = null; },
  },
  extraReducers: (builder) => {
    builder
      // Accounts
      .addCase(fetchAccounts.pending, (state) => { state.accountsLoading = true; })
      .addCase(fetchAccounts.fulfilled, (state, action) => { state.accounts = action.payload; state.accountsLoading = false; })
      .addCase(fetchAccounts.rejected, (state, action) => { state.error = action.payload; state.accountsLoading = false; })
      .addCase(addAccount.rejected, (state, action) => { state.error = action.payload; })
      .addCase(verifyAccount.rejected, (state, action) => { state.error = action.payload; })
      .addCase(resendAccountOtp.rejected, (state, action) => { state.error = action.payload; })
      .addCase(removeAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter((a) => a._id !== action.payload);
      })
      .addCase(removeAccount.rejected, (state, action) => { state.error = action.payload; })
      // Templates
      .addCase(fetchTemplates.pending, (state) => { state.templatesLoading = true; })
      .addCase(fetchTemplates.fulfilled, (state, action) => { state.templates = action.payload; state.templatesLoading = false; })
      .addCase(fetchTemplates.rejected, (state, action) => { state.error = action.payload; state.templatesLoading = false; })
      .addCase(createTemplate.rejected, (state, action) => { state.error = action.payload; })
      .addCase(updateTemplate.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter((t) => t._id !== action.payload);
      })
      .addCase(deleteTemplate.rejected, (state, action) => { state.error = action.payload; })
      // Campaigns
      .addCase(fetchCampaigns.pending, (state) => { state.campaignsLoading = true; })
      .addCase(fetchCampaigns.fulfilled, (state, action) => { state.campaigns = action.payload; state.campaignsLoading = false; })
      .addCase(fetchCampaigns.rejected, (state, action) => { state.error = action.payload; state.campaignsLoading = false; })
      .addCase(fetchCampaign.fulfilled, (state, action) => { state.activeCampaign = action.payload; })
      .addCase(fetchCampaign.rejected, (state, action) => { state.error = action.payload; })
      .addCase(createCampaign.rejected, (state, action) => { state.error = action.payload; })
      .addCase(updateCampaign.rejected, (state, action) => { state.error = action.payload; })
      .addCase(sendCampaign.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.filter((c) => c._id !== action.payload);
        if (state.activeCampaign?._id === action.payload) state.activeCampaign = null;
      })
      .addCase(deleteCampaign.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { setError: setEmailError, clearError: clearEmailError, clearActiveCampaign } = emailSlice.actions;
export default emailSlice.reducer;
