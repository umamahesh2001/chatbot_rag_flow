import { create } from "zustand";
import { api } from "@/lib/api";

const useChatStore = create((set, get) => ({
  // State
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

  // Actions
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  setSelectedProvider: (provider) => set({ selectedProvider: provider }),

  // RAG
  setRagMode: (enabled) => set({ ragMode: enabled }),

  fetchDocuments: async () => {
    try {
      const data = await api.getDocuments();
      set({ documents: data.documents });
    } catch (error) {
      console.error("Failed to fetch documents:", error.message);
    }
  },

  uploadDocument: async (file) => {
    set({ isUploading: true });
    try {
      await api.uploadDocument(file);
      await get().fetchDocuments();
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isUploading: false });
    }
  },

  deleteDocument: async (id) => {
    try {
      await api.deleteDocument(id);
      set((state) => ({
        documents: state.documents.filter((d) => d._id !== id),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Fetch available providers
  fetchProviders: async () => {
    try {
      const data = await api.getProviders();
      const configured = data.providers.filter((p) => p.configured);
      set({ providers: configured });
      // Set default selection if none chosen yet
      const { selectedProvider } = get();
      if (!selectedProvider && configured.length > 0) {
        set({ selectedProvider: configured[0].name });
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error.message);
    }
  },

  // Fetch all conversations
  fetchConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.getConversations();
      set({ conversations: data.conversations, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Select a conversation and load its messages
  selectConversation: async (id) => {
    try {
      set({ isLoading: true, error: null, activeConversationId: id });
      const data = await api.getConversation(id);
      set({ messages: data.messages, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Start a new conversation (clears chat)
  newConversation: () => {
    set({ activeConversationId: null, messages: [], error: null });
  },

  // Send a message with streaming
  sendMessage: async (message) => {
    const { activeConversationId, messages, selectedProvider, ragMode } = get();

    // Optimistically add user message
    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    // Add a placeholder for the streaming assistant message
    const streamingMsg = {
      _id: `streaming-${Date.now()}`,
      role: "assistant",
      content: "",
      streaming: true,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...messages, tempUserMsg, streamingMsg],
      isSending: true,
      error: null,
    });

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
            // Replace temp user message with real one, update conversationId
            set((state) => ({
              activeConversationId: event.conversationId,
              messages: state.messages.map((m) =>
                m._id === tempUserMsg._id ? event.userMessage : m,
              ),
            }));
          } else if (event.type === "chunk") {
            // Append text to the streaming message
            set((state) => ({
              messages: state.messages.map((m) =>
                m._id === streamingMsg._id
                  ? { ...m, content: m.content + event.text }
                  : m,
              ),
            }));
          } else if (event.type === "done") {
            // Replace streaming placeholder with final saved message
            set((state) => ({
              messages: state.messages.map((m) =>
                m._id === streamingMsg._id ? event.assistantMessage : m,
              ),
              isSending: false,
            }));
            get().fetchConversations();
          } else if (event.type === "error") {
            // Replace streaming placeholder with an error message bubble
            set((state) => ({
              isSending: false,
              error: event.error,
              messages: state.messages.map((m) =>
                m._id === streamingMsg._id
                  ? {
                      ...m,
                      streaming: false,
                      content: event.error,
                      error: true,
                      role: "assistant",
                    }
                  : m,
              ),
            }));
          }
        },
      );

      // Safety: ensure isSending is false even if no 'done' event
      if (get().isSending) {
        set({ isSending: false });
      }
    } catch (error) {
      set((state) => ({
        error: error.message,
        isSending: false,
        // Remove streaming placeholder and mark user msg as error
        messages: state.messages
          .filter((m) => m._id !== streamingMsg._id)
          .map((m) =>
            m._id === tempUserMsg._id ? { ...m, error: true } : m,
          ),
      }));
    }
  },

  // Retry a failed message
  retryMessage: async (messageContent) => {
    // Remove all error messages (both the failed user msg and assistant error)
    set((state) => ({
      messages: state.messages.filter((m) => !m.error),
      error: null,
    }));
    // Resend
    await get().sendMessage(messageContent);
  },

  // Delete a conversation
  deleteConversation: async (id) => {
    try {
      await api.deleteConversation(id);
      const { activeConversationId } = get();
      set((state) => ({
        conversations: state.conversations.filter((c) => c._id !== id),
        ...(activeConversationId === id
          ? { activeConversationId: null, messages: [] }
          : {}),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },
}));

export default useChatStore;
