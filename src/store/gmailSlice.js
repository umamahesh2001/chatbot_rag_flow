import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

// ─── Gmail Accounts ───
export const fetchGmailAccounts = createAsyncThunk("gmail/fetchAccounts", async (_, { rejectWithValue }) => {
  try { const data = await api.getGmailAccounts(); return data.accounts; }
  catch (e) { return rejectWithValue(e.message); }
});

export const disconnectGmail = createAsyncThunk("gmail/disconnect", async (id, { rejectWithValue }) => {
  try { await api.disconnectGmail(id); return id; }
  catch (e) { return rejectWithValue(e.message); }
});

// ─── Emails ───
export const fetchEmails = createAsyncThunk("gmail/fetchEmails", async (params, { rejectWithValue }) => {
  try { return await api.getGmailEmails(params); }
  catch (e) { return rejectWithValue(e.message); }
});

export const fetchEmailDetail = createAsyncThunk("gmail/fetchEmailDetail", async ({ id, accountId }, { rejectWithValue }) => {
  try { const data = await api.getGmailEmail(id, accountId); return data.email; }
  catch (e) { return rejectWithValue(e.message); }
});

export const sendGmailEmail = createAsyncThunk("gmail/send", async (body, { rejectWithValue }) => {
  try { return await api.sendGmail(body); }
  catch (e) { return rejectWithValue(e.message); }
});

// ─── AI ───
export const summarizeEmail = createAsyncThunk("gmail/summarize", async (body, { rejectWithValue }) => {
  try { return await api.summarizeEmail(body); }
  catch (e) { return rejectWithValue(e.message); }
});

export const generateReply = createAsyncThunk("gmail/generateReply", async (body, { rejectWithValue }) => {
  try { return await api.generateReply(body); }
  catch (e) { return rejectWithValue(e.message); }
});

export const generateAiTemplate = createAsyncThunk("gmail/generateAiTemplate", async (body, { rejectWithValue }) => {
  try { return await api.generateAiTemplate(body); }
  catch (e) { return rejectWithValue(e.message); }
});

const gmailSlice = createSlice({
  name: "gmail",
  initialState: {
    accounts: [],
    accountsLoading: false,
    selectedAccountId: null,
    emails: [],
    emailsLoading: false,
    nextPageToken: null,
    activeEmail: null,
    emailLoading: false,
    summary: null,
    summaryLoading: false,
    generatedReply: null,
    replyLoading: false,
    generatedTemplate: null,
    templateLoading: false,
    sending: false,
    error: null,
  },
  reducers: {
    setSelectedAccount: (state, a) => { state.selectedAccountId = a.payload; state.emails = []; state.nextPageToken = null; state.activeEmail = null; state.summary = null; state.generatedReply = null; },
    clearActiveEmail: (state) => { state.activeEmail = null; state.summary = null; state.generatedReply = null; },
    clearSummary: (state) => { state.summary = null; },
    clearReply: (state) => { state.generatedReply = null; },
    clearGeneratedTemplate: (state) => { state.generatedTemplate = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchGmailAccounts.pending, (s) => { s.accountsLoading = true; })
      .addCase(fetchGmailAccounts.fulfilled, (s, a) => { s.accounts = a.payload; s.accountsLoading = false; if (!s.selectedAccountId && a.payload.length) s.selectedAccountId = a.payload[0]._id; })
      .addCase(fetchGmailAccounts.rejected, (s, a) => { s.error = a.payload; s.accountsLoading = false; })
      .addCase(disconnectGmail.fulfilled, (s, a) => { s.accounts = s.accounts.filter(x => x._id !== a.payload); if (s.selectedAccountId === a.payload) { s.selectedAccountId = s.accounts[0]?._id || null; s.emails = []; } })
      .addCase(fetchEmails.pending, (s) => { s.emailsLoading = true; })
      .addCase(fetchEmails.fulfilled, (s, a) => { s.emails = a.meta.arg.pageToken ? [...s.emails, ...a.payload.emails] : a.payload.emails; s.nextPageToken = a.payload.nextPageToken; s.emailsLoading = false; })
      .addCase(fetchEmails.rejected, (s, a) => { s.error = a.payload; s.emailsLoading = false; })
      .addCase(fetchEmailDetail.pending, (s) => { s.emailLoading = true; s.summary = null; s.generatedReply = null; })
      .addCase(fetchEmailDetail.fulfilled, (s, a) => { s.activeEmail = a.payload; s.emailLoading = false; })
      .addCase(fetchEmailDetail.rejected, (s, a) => { s.error = a.payload; s.emailLoading = false; })
      .addCase(sendGmailEmail.pending, (s) => { s.sending = true; })
      .addCase(sendGmailEmail.fulfilled, (s) => { s.sending = false; })
      .addCase(sendGmailEmail.rejected, (s, a) => { s.error = a.payload; s.sending = false; })
      .addCase(summarizeEmail.pending, (s) => { s.summaryLoading = true; })
      .addCase(summarizeEmail.fulfilled, (s, a) => { s.summary = a.payload.summary; s.summaryLoading = false; })
      .addCase(summarizeEmail.rejected, (s, a) => { s.error = a.payload; s.summaryLoading = false; })
      .addCase(generateReply.pending, (s) => { s.replyLoading = true; })
      .addCase(generateReply.fulfilled, (s, a) => { s.generatedReply = a.payload; s.replyLoading = false; })
      .addCase(generateReply.rejected, (s, a) => { s.error = a.payload; s.replyLoading = false; })
      .addCase(generateAiTemplate.pending, (s) => { s.templateLoading = true; })
      .addCase(generateAiTemplate.fulfilled, (s, a) => { s.generatedTemplate = a.payload; s.templateLoading = false; })
      .addCase(generateAiTemplate.rejected, (s, a) => { s.error = a.payload; s.templateLoading = false; });
  },
});

export const { setSelectedAccount, clearActiveEmail, clearSummary, clearReply, clearGeneratedTemplate, clearError } = gmailSlice.actions;
export default gmailSlice.reducer;
