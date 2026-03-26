"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchGmailAccounts, disconnectGmail, fetchEmails, fetchEmailDetail,
  summarizeEmail, generateReply, sendGmailEmail, generateAiTemplate,
  setSelectedAccount, clearActiveEmail, clearReply, clearGeneratedTemplate, clearError,
} from "@/store/gmailSlice";
import { createTemplate } from "@/store/emailSlice";
import { fetchProviders } from "@/store/chatSlice";

const PROVIDER_LABELS = { together: "Together AI", openai: "OpenAI", google: "Google AI", anthropic: "Anthropic" };

// ─── Icons ───
function IconArrowLeft({ size = 18 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>); }
function IconBolt({ size = 20 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>); }
function IconMail({ size = 16 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4l-10 8L2 4" /></svg>); }
function IconLoader({ size = 16 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>); }
function IconSend({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>); }
function IconStar({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>); }
function IconTrash({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>); }
function IconX({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>); }
function IconSparkles({ size = 16 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /><path d="M19 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" /></svg>); }
function IconClock({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>); }
function IconLink({ size = 16 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>); }

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function parseSender(from) {
  const match = from?.match(/^(.+?)\s*<(.+?)>$/);
  return match ? { name: match[1].replace(/"/g, ""), email: match[2] } : { name: from, email: from };
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
export default function InboxPage() {
  const dispatch = useDispatch();
  const { accounts, accountsLoading, selectedAccountId, error } = useSelector((s) => s.gmail);

  useEffect(() => { dispatch(fetchGmailAccounts()); }, [dispatch]);
  useEffect(() => { if (error) { const t = setTimeout(() => dispatch(clearError()), 5000); return () => clearTimeout(t); } }, [error, dispatch]);

  // Check URL params for OAuth result
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      dispatch(fetchGmailAccounts());
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-void relative">
      {/* Header */}
      <header className="glass border-b border-flash/5 speed-shadow sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted hover:text-flash transition-colors group">
            <IconArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /><span className="text-sm">Back</span>
          </Link>
          <div className="h-5 w-px bg-flash/10" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-flash to-turbo flex items-center justify-center speed-shadow"><IconBolt size={16} className="text-white" /></div>
            <div><h1 className="text-sm font-bold text-ghost">Smart Inbox</h1><p className="text-[10px] text-muted tracking-wider uppercase">AI-Powered Email</p></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 relative z-10">
        {error && <div className="mb-4 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-fade-in-up">{error}</div>}

        {/* No accounts connected */}
        {!accountsLoading && accounts.length === 0 ? (
          <ConnectPrompt />
        ) : (
          <>
            <AccountBar />
            <div className="mt-4">
              {selectedAccountId ? <InboxView /> : (
                <div className="text-center py-20"><IconMail size={40} className="text-muted/20 mx-auto mb-3" /><p className="text-muted text-sm">Select an account above</p></div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════
// CONNECT PROMPT
// ═══════════════════════════════════════
function ConnectPrompt() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const data = await dispatch(fetchGmailAccounts()).unwrap().catch(() => null);
      // Get auth URL
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/gmail/auth-url`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch { setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-flash/8 border border-flash/10 flex items-center justify-center mb-6 speed-shadow-lg">
        <IconMail size={36} className="text-flash" />
      </div>
      <h2 className="text-xl font-bold text-ghost mb-2">Connect Your Gmail</h2>
      <p className="text-sm text-muted max-w-md mb-8">Connect your Gmail account to view your inbox, get AI summaries, and generate smart replies.</p>
      <button onClick={handleConnect} disabled={loading}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-flash to-turbo text-white font-semibold text-sm hover:shadow-lg hover:shadow-flash/20 transition-all disabled:opacity-50">
        {loading ? <IconLoader size={16} /> : <IconLink size={16} />}
        Connect Gmail
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
// ACCOUNT BAR
// ═══════════════════════════════════════
function AccountBar() {
  const dispatch = useDispatch();
  const { accounts, selectedAccountId } = useSelector((s) => s.gmail);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/gmail/auth-url`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch { setConnecting(false); }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {accounts.map((a) => (
        <div key={a._id}
          className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm cursor-pointer border transition-all duration-200
            ${selectedAccountId === a._id ? "bg-flash/10 text-flash border-flash/20 speed-shadow" : "text-muted border-flash/6 hover:border-flash/15 hover:bg-flash/5"}`}
          onClick={() => dispatch(setSelectedAccount(a._id))}>
          <IconMail size={14} />
          <span>{a.email}</span>
          <button onClick={(e) => { e.stopPropagation(); dispatch(disconnectGmail(a._id)); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-danger/15 transition-all" title="Disconnect">
            <IconX size={10} className="text-danger/70" />
          </button>
        </div>
      ))}
      <button onClick={handleConnect} disabled={connecting}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-flash border border-flash/15 hover:bg-flash/5 transition-all">
        {connecting ? <IconLoader size={12} /> : <IconLink size={12} />} Add Account
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
// INBOX VIEW (split: list + detail)
// ═══════════════════════════════════════
function InboxView() {
  const dispatch = useDispatch();
  const { selectedAccountId, emails, emailsLoading, nextPageToken, activeEmail } = useSelector((s) => s.gmail);

  useEffect(() => {
    if (selectedAccountId) dispatch(fetchEmails({ accountId: selectedAccountId }));
  }, [selectedAccountId, dispatch]);

  const loadMore = () => {
    if (nextPageToken) dispatch(fetchEmails({ accountId: selectedAccountId, pageToken: nextPageToken }));
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Email List */}
      <div className="w-[380px] shrink-0 flex flex-col glass rounded-2xl border border-flash/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-flash/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ghost">Inbox</h3>
          <button onClick={() => dispatch(fetchEmails({ accountId: selectedAccountId }))}
            className="text-[11px] text-muted hover:text-flash transition-colors">Refresh</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {emailsLoading && emails.length === 0 ? (
            <div className="space-y-2 p-3">{[1,2,3,4,5].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}</div>
          ) : emails.length === 0 ? (
            <div className="text-center py-16"><IconMail size={28} className="text-muted/20 mx-auto mb-2" /><p className="text-muted text-xs">No emails found</p></div>
          ) : (
            <>
              {emails.map((em) => {
                const sender = parseSender(em.from);
                const isActive = activeEmail?.id === em.id;
                return (
                  <div key={em.id} onClick={() => dispatch(fetchEmailDetail({ id: em.id, accountId: selectedAccountId }))}
                    className={`px-4 py-3 cursor-pointer border-b border-flash/3 transition-all duration-150
                      ${isActive ? "bg-flash/8 border-l-2 border-l-flash" : "hover:bg-steel/20"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-ghost truncate flex-1">{sender.name}</p>
                      <span className="text-[10px] text-muted shrink-0 ml-2">{formatDate(em.date)}</span>
                    </div>
                    <p className="text-xs text-silver truncate">{em.subject}</p>
                    <p className="text-[11px] text-muted truncate mt-0.5">{em.snippet}</p>
                  </div>
                );
              })}
              {nextPageToken && (
                <button onClick={loadMore} disabled={emailsLoading}
                  className="w-full py-3 text-xs text-flash hover:bg-flash/5 transition-all disabled:opacity-50">
                  {emailsLoading ? <IconLoader size={14} className="mx-auto" /> : "Load more"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Email Detail + AI */}
      <div className="flex-1 overflow-y-auto">
        {activeEmail ? <EmailDetail /> : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center"><IconMail size={40} className="text-muted/15 mx-auto mb-3" /><p className="text-muted text-sm">Select an email to view</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// EMAIL DETAIL + AI PANEL
// ═══════════════════════════════════════
function EmailDetail() {
  const dispatch = useDispatch();
  const { selectedAccountId, activeEmail, emailLoading, summary, summaryLoading, generatedReply, replyLoading, sending } = useSelector((s) => s.gmail);
  const { providers } = useSelector((s) => s.chat);
  const [tone, setTone] = useState("professional");
  const [aiProvider, setAiProvider] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [editedReply, setEditedReply] = useState(null);
  const [scheduleTime, setScheduleTime] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => { dispatch(fetchProviders()); }, [dispatch]);
  useEffect(() => { setEditedReply(null); setSentSuccess(false); setShowSchedule(false); }, [activeEmail?.id]);
  useEffect(() => { if (generatedReply) setEditedReply({ subject: generatedReply.subject, body: generatedReply.body }); }, [generatedReply]);

  if (emailLoading) return <div className="flex justify-center py-20"><IconLoader size={24} className="text-flash" /></div>;
  if (!activeEmail) return null;

  const sender = parseSender(activeEmail.from);

  const handleSummarize = () => {
    const payload = { subject: activeEmail.subject, from: activeEmail.from, body: activeEmail.body };
    if (aiProvider) payload.provider = aiProvider;
    dispatch(summarizeEmail(payload));
  };

  const handleGenerateReply = () => {
    const payload = { subject: activeEmail.subject, from: activeEmail.from, body: activeEmail.body, tone, customInstructions };
    if (aiProvider) payload.provider = aiProvider;
    dispatch(generateReply(payload));
  };

  const handleSend = async (scheduled = false) => {
    if (!editedReply) return;
    const payload = {
      accountId: selectedAccountId,
      to: sender.email,
      subject: editedReply.subject,
      body: editedReply.body,
    };
    if (scheduled && scheduleTime) payload.scheduledAt = scheduleTime;
    const result = await dispatch(sendGmailEmail(payload));
    if (result.meta.requestStatus === "fulfilled") {
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Email content */}
      <div className="glass rounded-2xl p-6 speed-shadow border border-flash/5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-ghost">{activeEmail.subject || "(No subject)"}</h2>
            <p className="text-xs text-muted mt-1">From: <span className="text-silver">{sender.name}</span> &lt;{sender.email}&gt;</p>
            <p className="text-[11px] text-muted">Date: {new Date(activeEmail.date).toLocaleString()}</p>
          </div>
          <button onClick={() => dispatch(clearActiveEmail())} className="p-1.5 rounded-lg hover:bg-steel/40 text-muted hover:text-silver transition-all"><IconX size={14} /></button>
        </div>
        <div className="prose prose-sm max-w-none text-silver text-sm leading-relaxed border-t border-flash/5 pt-4"
          dangerouslySetInnerHTML={{ __html: activeEmail.body || activeEmail.snippet }} />
      </div>

      {/* AI Provider Selector */}
      {providers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted uppercase tracking-wider">Provider:</span>
          {providers.map((p) => (
            <button key={p.name} onClick={() => setAiProvider(p.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all
                ${aiProvider === p.name ? "bg-flash/10 text-flash border-flash/20 speed-shadow" : "text-muted border-flash/6 hover:border-flash/15 hover:text-silver"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${aiProvider === p.name ? "bg-flash" : "bg-muted/30"}`} />
              {PROVIDER_LABELS[p.name] || p.name}
            </button>
          ))}
        </div>
      )}

      {/* AI Actions Bar */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleSummarize} disabled={summaryLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-flash/10 to-turbo/10 border border-flash/15 text-flash text-sm font-medium hover:border-flash/30 transition-all disabled:opacity-50">
          {summaryLoading ? <IconLoader size={14} /> : <IconSparkles size={14} />} Summarize
        </button>
        <div className="flex items-center gap-1.5">
          {["professional", "friendly", "formal"].map((t) => (
            <button key={t} onClick={() => setTone(t)}
              className={`px-3 py-2 rounded-xl text-xs border transition-all ${tone === t ? "bg-flash/10 text-flash border-flash/20" : "text-muted border-flash/6 hover:border-flash/15"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={handleGenerateReply} disabled={replyLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium hover:shadow-lg hover:shadow-flash/20 transition-all disabled:opacity-50">
          {replyLoading ? <IconLoader size={14} /> : <IconSparkles size={14} />} Generate Reply
        </button>
      </div>

      {/* Custom instructions */}
      <input value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)}
        placeholder="Additional instructions for AI (optional)..."
        className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all placeholder-muted/50" />

      {/* Summary */}
      {summary && (
        <div className="glass rounded-2xl p-5 border border-flash/10 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3"><IconSparkles size={14} className="text-flash" /><h3 className="text-sm font-semibold text-ghost">AI Summary</h3></div>
          <div className="text-sm text-silver leading-relaxed whitespace-pre-wrap">{summary}</div>
        </div>
      )}

      {/* Generated Reply */}
      {editedReply && (
        <div className="glass rounded-2xl p-5 border border-flash/10 space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-2"><IconSparkles size={14} className="text-flash" /><h3 className="text-sm font-semibold text-ghost">Generated Reply</h3></div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Subject</label>
            <input value={editedReply.subject} onChange={(e) => setEditedReply({ ...editedReply, subject: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Body</label>
            <textarea value={editedReply.body} onChange={(e) => setEditedReply({ ...editedReply, body: e.target.value })} rows={8}
              className="w-full px-4 py-3 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all resize-y" />
          </div>

          {sentSuccess && <div className="px-4 py-2 rounded-xl bg-success/10 border border-success/20 text-success text-sm">Email sent successfully!</div>}

          <div className="flex flex-wrap gap-3">
            <button onClick={() => handleSend(false)} disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium transition-all disabled:opacity-50">
              {sending ? <IconLoader size={14} /> : <IconSend size={14} />} Send Now
            </button>
            <button onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-flash/15 text-flash text-sm hover:bg-flash/5 transition-all">
              <IconClock size={14} /> Schedule
            </button>
            <button onClick={() => dispatch(clearReply())} className="px-4 py-2.5 rounded-xl text-muted text-sm hover:text-silver transition-all">Discard</button>
          </div>

          {showSchedule && (
            <div className="flex items-center gap-3 animate-fade-in-up">
              <input type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                className="px-4 py-2 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all" />
              <button onClick={() => handleSend(true)} disabled={sending || !scheduleTime}
                className="px-4 py-2 rounded-xl bg-warning/15 text-warning text-sm font-medium border border-warning/20 transition-all disabled:opacity-50">
                Confirm Schedule
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
