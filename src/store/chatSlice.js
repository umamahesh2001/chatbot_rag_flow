import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

// ─── Async Thunks ───

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.getConversations();
      return data.conversations;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const selectConversation = createAsyncThunk(
  "chat/selectConversation",
  async (id, { rejectWithValue }) => {
    try {
      const data = await api.getConversation(id);
      return { id, messages: data.messages };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteConversation = createAsyncThunk(
  "chat/deleteConversation",
  async (id, { getState, rejectWithValue }) => {
    try {
      await api.deleteConversation(id);
      return { id, wasActive: getState().chat.activeConversationId === id };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProviders = createAsyncThunk(
  "chat/fetchProviders",
  async () => {
    const data = await api.getProviders();
    return data.providers.filter((p) => p.configured);
  }
);

export const fetchDocuments = createAsyncThunk(
  "chat/fetchDocuments",
  async () => {
    const data = await api.getDocuments();
    return data.documents;
  }
);

export const uploadDocument = createAsyncThunk(
  "chat/uploadDocument",
  async (file, { dispatch, rejectWithValue }) => {
    try {
      await api.uploadDocument(file);
      dispatch(fetchDocuments());
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteDocument = createAsyncThunk(
  "chat/deleteDocument",
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteDocument(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * sendMessage — streaming SSE. Dispatches incremental updates.
 */
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (message, { getState, dispatch, rejectWithValue }) => {
    const { activeConversationId, selectedProvider, ragMode } = getState().chat;

    const tempUserMsgId = `temp-${Date.now()}`;
    const streamingMsgId = `streaming-${Date.now()}`;

    dispatch(chatSlice.actions._addOptimisticMessages({
      tempUserMsg: {
        _id: tempUserMsgId,
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      },
      streamingMsg: {
        _id: streamingMsgId,
        role: "assistant",
        content: "",
        streaming: true,
        createdAt: new Date().toISOString(),
      },
    }));

    try {
      await api.sendMessageStream(
        {
          conversationId: activeConversationId,
          message,
          provider: selectedProvider,
          ragMode,
        },
        (event) => {
          if (event.type === "meta") {
            dispatch(chatSlice.actions._handleMeta({
              conversationId: event.conversationId,
              userMessage: event.userMessage,
              tempUserMsgId,
            }));
          } else if (event.type === "chunk") {
            dispatch(chatSlice.actions._handleChunk({
              streamingMsgId,
              text: event.text,
            }));
          } else if (event.type === "done") {
            dispatch(chatSlice.actions._handleDone({
              streamingMsgId,
              assistantMessage: event.assistantMessage,
            }));
            dispatch(fetchConversations());
          } else if (event.type === "error") {
            dispatch(chatSlice.actions._handleStreamError({
              streamingMsgId,
              error: event.error,
            }));
          }
        }
      );
      // Safety
      const state = getState().chat;
      if (state.isSending) {
        dispatch(chatSlice.actions._finishSending());
      }
    } catch (error) {
      dispatch(chatSlice.actions._handleSendFailure({
        streamingMsgId,
        tempUserMsgId,
        error: error.message,
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const retryMessage = createAsyncThunk(
  "chat/retryMessage",
  async (messageContent, { dispatch }) => {
    dispatch(chatSlice.actions._clearErrors());
    dispatch(sendMessage(messageContent));
  }
);

// ─── Slice ───

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    activeConversationId: null,
    messages: [],
    isLoading: false,
    isSending: false,
    error: null,
    sidebarOpen: true,
    providers: [],
    selectedProvider: null,
    ragMode: false,
    documents: [],
    isUploading: false,
  },
  reducers: {
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    clearError: (state) => { state.error = null; },
    setSelectedProvider: (state, action) => { state.selectedProvider = action.payload; },
    setRagMode: (state, action) => { state.ragMode = action.payload; },
    newConversation: (state) => {
      state.activeConversationId = null;
      state.messages = [];
      state.error = null;
    },
    // Internal actions for streaming
    _addOptimisticMessages: (state, action) => {
      const { tempUserMsg, streamingMsg } = action.payload;
      state.messages.push(tempUserMsg, streamingMsg);
      state.isSending = true;
      state.error = null;
    },
    _handleMeta: (state, action) => {
      const { conversationId, userMessage, tempUserMsgId } = action.payload;
      state.activeConversationId = conversationId;
      state.messages = state.messages.map((m) =>
        m._id === tempUserMsgId ? userMessage : m
      );
    },
    _handleChunk: (state, action) => {
      const { streamingMsgId, text } = action.payload;
      const msg = state.messages.find((m) => m._id === streamingMsgId);
      if (msg) msg.content += text;
    },
    _handleDone: (state, action) => {
      const { streamingMsgId, assistantMessage } = action.payload;
      state.messages = state.messages.map((m) =>
        m._id === streamingMsgId ? assistantMessage : m
      );
      state.isSending = false;
    },
    _handleStreamError: (state, action) => {
      const { streamingMsgId, error } = action.payload;
      state.messages = state.messages.map((m) =>
        m._id === streamingMsgId
          ? { ...m, streaming: false, content: error, error: true, role: "assistant" }
          : m
      );
      state.isSending = false;
      state.error = error;
    },
    _handleSendFailure: (state, action) => {
      const { streamingMsgId, tempUserMsgId, error } = action.payload;
      state.messages = state.messages
        .filter((m) => m._id !== streamingMsgId)
        .map((m) => m._id === tempUserMsgId ? { ...m, error: true } : m);
      state.isSending = false;
      state.error = error;
    },
    _finishSending: (state) => { state.isSending = false; },
    _clearErrors: (state) => {
      state.messages = state.messages.filter((m) => !m.error);
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })
      // Select conversation
      .addCase(selectConversation.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.activeConversationId = action.meta.arg;
      })
      .addCase(selectConversation.fulfilled, (state, action) => {
        state.messages = action.payload.messages;
        state.isLoading = false;
      })
      .addCase(selectConversation.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })
      // Delete conversation
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter((c) => c._id !== action.payload.id);
        if (action.payload.wasActive) {
          state.activeConversationId = null;
          state.messages = [];
        }
      })
      .addCase(deleteConversation.rejected, (state, action) => { state.error = action.payload; })
      // Providers
      .addCase(fetchProviders.fulfilled, (state, action) => {
        state.providers = action.payload;
        if (!state.selectedProvider && action.payload.length > 0) {
          state.selectedProvider = action.payload[0].name;
        }
      })
      // Documents
      .addCase(fetchDocuments.fulfilled, (state, action) => { state.documents = action.payload; })
      .addCase(uploadDocument.pending, (state) => { state.isUploading = true; })
      .addCase(uploadDocument.fulfilled, (state) => { state.isUploading = false; })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter((d) => d._id !== action.payload);
      })
      .addCase(deleteDocument.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const {
  setSidebarOpen, setError, clearError, setSelectedProvider, setRagMode, newConversation,
} = chatSlice.actions;

export default chatSlice.reducer;
