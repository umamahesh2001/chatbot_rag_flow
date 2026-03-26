const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };
  // Ensure headers merge properly
  config.headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...options.headers,
  };

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || `Request failed: ${res.status}`);
    // Attach extra fields for auth handling
    if (data.needsVerification) error.needsVerification = true;
    if (data.email) error.email = data.email;
    if (data.retryAfter) error.retryAfter = data.retryAfter;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (body) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  verifyOTP: (body) =>
    request("/auth/verify-otp", { method: "POST", body: JSON.stringify(body) }),
  resendOTP: (body) =>
    request("/auth/resend-otp", { method: "POST", body: JSON.stringify(body) }),
  login: (body) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  getProfile: () => request("/auth/me"),

  // Chat
  sendMessage: (body) =>
    request("/chat", { method: "POST", body: JSON.stringify(body) }),

  // Chat streaming - returns an async iterator of parsed SSE events
  sendMessageStream: async (body, onEvent) => {
    const url = `${API_URL}/chat/stream`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
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
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Transcription failed: ${res.status}`);
    return data;
  },

  // Documents (RAG)
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append("document", file);
    const url = `${API_URL}/documents/upload`;
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);
    return data;
  },
  getDocuments: () => request("/documents"),
  deleteDocument: (id) =>
    request(`/documents/${id}`, { method: "DELETE" }),

  // Providers
  getProviders: () => request("/chat/providers"),

  // Email Accounts
  getEmailAccounts: () => request("/email-accounts"),
  addEmailAccount: (body) =>
    request("/email-accounts", { method: "POST", body: JSON.stringify(body) }),
  verifyEmailAccount: (id, body) =>
    request(`/email-accounts/${id}/verify`, { method: "POST", body: JSON.stringify(body) }),
  resendEmailAccountOtp: (id) =>
    request(`/email-accounts/${id}/resend-otp`, { method: "POST" }),
  setDefaultEmailAccount: (id) =>
    request(`/email-accounts/${id}/default`, { method: "PUT" }),
  deleteEmailAccount: (id) =>
    request(`/email-accounts/${id}`, { method: "DELETE" }),

  // Email Templates
  getTemplates: () => request("/email-templates"),
  createTemplate: (body) =>
    request("/email-templates", { method: "POST", body: JSON.stringify(body) }),
  updateTemplate: (id, body) =>
    request(`/email-templates/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTemplate: (id) =>
    request(`/email-templates/${id}`, { method: "DELETE" }),

  // Gmail OAuth
  getGmailAuthUrl: () => request("/gmail/auth-url"),
  getGmailAccounts: () => request("/gmail/accounts"),
  disconnectGmail: (id) => request(`/gmail/accounts/${id}`, { method: "DELETE" }),
  getGmailEmails: (params) => request(`/gmail/emails?${new URLSearchParams(params)}`),
  getGmailEmail: (id, accountId) => request(`/gmail/emails/${id}?accountId=${accountId}`),
  sendGmail: (body) => request("/gmail/send", { method: "POST", body: JSON.stringify(body) }),

  // AI Email
  summarizeEmail: (body) => request("/ai-email/summarize", { method: "POST", body: JSON.stringify(body) }),
  generateReply: (body) => request("/ai-email/generate-reply", { method: "POST", body: JSON.stringify(body) }),
  generateAiTemplate: (body) => request("/ai-email/generate-template", { method: "POST", body: JSON.stringify(body) }),

  // Campaigns
  getCampaigns: () => request("/campaigns"),
  getCampaign: (id) => request(`/campaigns/${id}`),
  createCampaign: (body) =>
    request("/campaigns", { method: "POST", body: JSON.stringify(body) }),
  updateCampaign: (id, body) =>
    request(`/campaigns/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  sendCampaign: (id) =>
    request(`/campaigns/${id}/send`, { method: "POST" }),
  deleteCampaign: (id) =>
    request(`/campaigns/${id}`, { method: "DELETE" }),
};
