const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  // Chat
  sendMessage: (body) =>
    request("/chat", { method: "POST", body: JSON.stringify(body) }),

  // Chat streaming - returns an async iterator of parsed SSE events
  sendMessageStream: async (body, onEvent) => {
    const url = `${API_URL}/chat/stream`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        try {
          const event = JSON.parse(trimmed.slice(5).trim());
          onEvent(event);
        } catch {
          // skip malformed events
        }
      }
    }
  },

  // Conversations
  getConversations: () => request("/conversations"),
  createConversation: (title) =>
    request("/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  getConversation: (id) => request(`/conversations/${id}`),
  deleteConversation: (id) =>
    request(`/conversations/${id}`, { method: "DELETE" }),

  // Transcription
  transcribeAudio: async (file) => {
    const formData = new FormData();
    formData.append("audio", file);
    const url = `${API_URL}/transcribe`;
    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Transcription failed: ${res.status}`);
    return data;
  },

  // Documents (RAG)
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append("document", file);
    const url = `${API_URL}/documents/upload`;
    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);
    return data;
  },
  getDocuments: () => request("/documents"),
  deleteDocument: (id) =>
    request(`/documents/${id}`, { method: "DELETE" }),

  // Providers
  getProviders: () => request("/chat/providers"),
};
