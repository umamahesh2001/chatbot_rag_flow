"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAccounts, addAccount, verifyAccount, resendAccountOtp, setDefaultAccount, removeAccount,
  fetchTemplates, createTemplate, updateTemplate, deleteTemplate,
  fetchCampaigns, fetchCampaign, createCampaign, updateCampaign, sendCampaign, deleteCampaign,
  clearEmailError,
} from "@/store/emailSlice";
import { generateAiTemplate, clearGeneratedTemplate } from "@/store/gmailSlice";
import { fetchProviders } from "@/store/chatSlice";

const PROVIDER_LABELS = { together: "Together AI", openai: "OpenAI", google: "Google AI", anthropic: "Anthropic" };

// ─── Icons ───
function IconArrowLeft({ size = 18 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>); }
function IconBolt({ size = 20 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>); }
function IconPlus({ size = 16 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>); }
function IconTrash({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>); }
function IconEdit({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>); }
function IconSend({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>); }
function IconMail({ size = 16 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4l-10 8L2 4" /></svg>); }
function IconCheck({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>); }
function IconX({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>); }
function IconLoader({ size = 16 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>); }
function IconStar({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>); }
function IconClock({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>); }
function IconEye({ size = 14 }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>); }

const STATUS_STYLES = {
  draft: "bg-steel/60 text-muted",
  scheduled: "bg-warning/15 text-warning",
  sending: "bg-flash/15 text-flash animate-pulse",
  sent: "bg-success/15 text-success",
  failed: "bg-danger/15 text-danger",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
export default function EmailAutomationPage() {
  const dispatch = useDispatch();
  const { error } = useSelector((s) => s.email);
  const [tab, setTab] = useState("campaigns");

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchTemplates());
    dispatch(fetchCampaigns());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(clearEmailError()), 5000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  const tabs = [
    { key: "campaigns", label: "Campaigns", icon: <IconSend size={14} /> },
    { key: "templates", label: "Templates", icon: <IconMail size={14} /> },
    { key: "accounts", label: "Email Accounts", icon: <IconMail size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-void relative">
      {/* Header */}
      <header className="glass border-b border-flash/5 speed-shadow sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted hover:text-flash transition-colors group">
            <IconArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="h-5 w-px bg-flash/10" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-flash to-turbo flex items-center justify-center speed-shadow">
              <IconBolt size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-ghost">Email Automation</h1>
              <p className="text-[10px] text-muted tracking-wider uppercase">Campaigns & Templates</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 relative z-10">
        {/* Global error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-fade-in-up">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-abyss/80 border border-flash/5 w-fit">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${tab === t.key ? "bg-flash/10 text-flash speed-shadow border border-flash/15" : "text-muted hover:text-silver border border-transparent"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {tab === "campaigns" && <CampaignsTab />}
        {tab === "templates" && <TemplatesTab />}
        {tab === "accounts" && <AccountsTab />}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════
// CAMPAIGNS TAB
// ═══════════════════════════════════════
function CampaignsTab() {
  const dispatch = useDispatch();
  const { campaigns, campaignsLoading, accounts, templates } = useSelector((s) => s.email);
  const [view, setView] = useState("list"); // list | editor | detail
  const [editId, setEditId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [form, setForm] = useState({ name: "", subject: "", content: "", recipients: "", senderEmail: "", scheduledAt: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const verifiedAccounts = accounts.filter((a) => a.isVerified);

  const openEditor = (campaign = null) => {
    if (campaign) {
      setForm({
        name: campaign.name,
        subject: campaign.subject,
        content: campaign.content || "",
        recipients: campaign.recipients?.map((r) => r.email).join("\n") || "",
        senderEmail: campaign.senderEmail || "",
        scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : "",
      });
      setEditId(campaign._id);
    } else {
      setForm({ name: "", subject: "", content: "", recipients: "", senderEmail: verifiedAccounts.find((a) => a.isDefault)?.email || "", scheduledAt: "" });
      setEditId(null);
    }
    setView("editor");
  };

  const handleSave = async (sendNow = false) => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (sendNow) payload.scheduledAt = undefined;
      if (!payload.scheduledAt) delete payload.scheduledAt;

      let result;
      if (editId) {
        result = await dispatch(updateCampaign({ id: editId, ...payload }));
      } else {
        result = await dispatch(createCampaign(payload));
      }

      if (result.meta.requestStatus === "fulfilled") {
        if (sendNow) {
          const id = editId || result.payload?.campaign?._id;
          if (id) await dispatch(sendCampaign(id));
        }
        setView("list");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTemplate = (templateId) => {
    const tmpl = templates.find((t) => t._id === templateId);
    if (tmpl) setForm((f) => ({ ...f, subject: tmpl.subject, content: tmpl.content }));
  };

  const viewDetail = async (id) => {
    await dispatch(fetchCampaign(id));
    setDetailId(id);
    setView("detail");
  };

  if (view === "detail") return <CampaignDetail id={detailId} onBack={() => setView("list")} onEdit={(c) => openEditor(c)} />;

  if (view === "editor") {
    return (
      <div className="animate-fade-in-up">
        <button onClick={() => setView("list")} className="flex items-center gap-1 text-sm text-muted hover:text-flash mb-4 transition-colors">
          <IconArrowLeft size={14} /> Back to campaigns
        </button>
        <div className="glass rounded-2xl p-6 speed-shadow-lg space-y-5">
          <h2 className="text-lg font-bold text-ghost">{editId ? "Edit Campaign" : "New Campaign"}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Campaign Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all" placeholder="My Campaign" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Sender Email</label>
              <select value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all">
                <option value="">Select sender...</option>
                {verifiedAccounts.map((a) => <option key={a._id} value={a.email}>{a.email}{a.isDefault ? " (default)" : ""}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all" placeholder="Email subject line" />
          </div>

          {templates.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Load from Template</label>
              <select onChange={(e) => e.target.value && handleLoadTemplate(e.target.value)} defaultValue=""
                className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all">
                <option value="">Select template (optional)...</option>
                {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Content (HTML)</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8}
              className="w-full px-4 py-3 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm font-mono focus:outline-none focus:border-flash/30 transition-all resize-y"
              placeholder="<h1>Hello!</h1><p>Your email content here...</p>" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Recipients (one per line or comma-separated)</label>
            <textarea value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} rows={4}
              className="w-full px-4 py-3 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all resize-y"
              placeholder={"user1@example.com\nuser2@example.com"} />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Schedule (optional)</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all" />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-flash/15 text-flash text-sm font-medium hover:bg-flash/5 transition-all disabled:opacity-50">
              {saving ? <IconLoader size={14} /> : form.scheduledAt ? "Schedule" : "Save Draft"}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium hover:shadow-lg hover:shadow-flash/20 transition-all disabled:opacity-50">
              {saving ? <IconLoader size={14} /> : "Send Now"}
            </button>
            <button onClick={() => setView("list")} className="px-5 py-2.5 rounded-xl text-muted text-sm hover:text-silver transition-all">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ghost">{campaigns.length} Campaign{campaigns.length !== 1 ? "s" : ""}</h2>
        <button onClick={() => openEditor()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium hover:shadow-lg hover:shadow-flash/20 transition-all">
          <IconPlus size={14} /> New Campaign
        </button>
      </div>

      {campaignsLoading ? (
        <div className="flex justify-center py-16"><IconLoader size={24} className="text-flash" /></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <IconSend size={36} className="text-muted/20 mx-auto mb-3" />
          <p className="text-muted text-sm">No campaigns yet</p>
          <p className="text-muted/60 text-xs mt-1">Create your first email campaign</p>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div key={c._id} className="group glass rounded-xl px-5 py-4 flex items-center gap-4 border border-flash/5 hover:border-flash/12 hover:speed-shadow transition-all duration-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ghost truncate">{c.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                  <span>{c.stats?.total || 0} recipients</span>
                  {c.stats?.sent > 0 && <span className="text-success">{c.stats.sent} sent</span>}
                  {c.stats?.failed > 0 && <span className="text-danger">{c.stats.failed} failed</span>}
                  <span>{formatDate(c.updatedAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => viewDetail(c._id)} className="p-2 rounded-lg hover:bg-flash/8 text-muted hover:text-flash transition-all" title="View"><IconEye size={14} /></button>
                {(c.status === "draft" || c.status === "scheduled") && (
                  <button onClick={() => { viewDetail(c._id).then(() => {}); openEditor(c); }} className="p-2 rounded-lg hover:bg-flash/8 text-muted hover:text-flash transition-all" title="Edit"><IconEdit size={14} /></button>
                )}
                {c.status !== "sending" && (
                  <button onClick={() => setDeleteConfirm(c._id)} className="p-2 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition-all" title="Delete"><IconTrash size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal title="Delete Campaign" message="Are you sure? This cannot be undone."
          onConfirm={() => { dispatch(deleteCampaign(deleteConfirm)); setDeleteConfirm(null); }}
          onCancel={() => setDeleteConfirm(null)} />
      )}
    </div>
  );
}

// Campaign Detail
function CampaignDetail({ id, onBack, onEdit }) {
  const dispatch = useDispatch();
  const { activeCampaign } = useSelector((s) => s.email);
  const c = activeCampaign;

  useEffect(() => { dispatch(fetchCampaign(id)); }, [dispatch, id]);

  if (!c) return <div className="flex justify-center py-16"><IconLoader size={24} className="text-flash" /></div>;

  return (
    <div className="animate-fade-in-up">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted hover:text-flash mb-4 transition-colors"><IconArrowLeft size={14} /> Back</button>
      <div className="glass rounded-2xl p-6 speed-shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ghost">{c.name}</h2>
            <p className="text-xs text-muted mt-0.5">Subject: {c.subject}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[c.status]}`}>{c.status}</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{ label: "Total", value: c.stats?.total, color: "text-ghost" }, { label: "Sent", value: c.stats?.sent, color: "text-success" }, { label: "Failed", value: c.stats?.failed, color: "text-danger" }].map((s) => (
            <div key={s.label} className="rounded-xl bg-void/60 border border-flash/5 px-4 py-3">
              <p className={`text-xl font-bold ${s.color}`}>{s.value || 0}</p><p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted space-y-1">
          <p>Sender: <span className="text-silver">{c.senderEmail}</span></p>
          {c.scheduledAt && <p>Scheduled: <span className="text-warning">{formatDate(c.scheduledAt)}</span></p>}
          {c.sentAt && <p>Sent: <span className="text-success">{formatDate(c.sentAt)}</span></p>}
        </div>
        {c.recipients && c.recipients.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Recipients</p>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {c.recipients.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-void/40 text-xs">
                  <span className="text-silver">{r.email}</span>
                  <span className={`${r.status === "sent" ? "text-success" : r.status === "failed" ? "text-danger" : "text-muted"}`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {(c.status === "draft" || c.status === "scheduled") && (
          <div className="flex gap-3 pt-2">
            <button onClick={() => onEdit(c)} className="px-4 py-2 rounded-xl border border-flash/15 text-flash text-sm hover:bg-flash/5 transition-all">Edit</button>
            <button onClick={() => { dispatch(sendCampaign(c._id)); onBack(); }} className="px-4 py-2 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium transition-all">Send Now</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TEMPLATES TAB
// ═══════════════════════════════════════
function TemplatesTab() {
  const dispatch = useDispatch();
  const { templates, templatesLoading } = useSelector((s) => s.email);
  const { generatedTemplate, templateLoading } = useSelector((s) => s.gmail);
  const { providers } = useSelector((s) => s.chat);
  const [editing, setEditing] = useState(null); // null | "new" | template obj
  const [form, setForm] = useState({ name: "", subject: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiProvider, setAiProvider] = useState("");

  useEffect(() => { dispatch(fetchProviders()); }, [dispatch]);

  const openEditor = (tmpl = null) => {
    if (tmpl) { setForm({ name: tmpl.name, subject: tmpl.subject, content: tmpl.content }); setEditing(tmpl); }
    else { setForm({ name: "", subject: "", content: "" }); setEditing("new"); }
  };

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    const payload = { prompt: aiPrompt, tone: aiTone };
    if (aiProvider) payload.provider = aiProvider;
    dispatch(generateAiTemplate(payload));
  };

  const handleUseAiTemplate = () => {
    if (generatedTemplate) {
      setForm({ name: generatedTemplate.name, subject: generatedTemplate.subject, content: generatedTemplate.body });
      setEditing("new");
      setShowAiModal(false);
      dispatch(clearGeneratedTemplate());
      setAiPrompt("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = editing === "new"
        ? await dispatch(createTemplate(form))
        : await dispatch(updateTemplate({ id: editing._id, ...form }));
      if (result.meta.requestStatus === "fulfilled") setEditing(null);
    } finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="animate-fade-in-up">
        <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-sm text-muted hover:text-flash mb-4 transition-colors"><IconArrowLeft size={14} /> Back</button>
        <div className="glass rounded-2xl p-6 speed-shadow-lg space-y-5">
          <h2 className="text-lg font-bold text-ghost">{editing === "new" ? "New Template" : "Edit Template"}</h2>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Template Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all" placeholder="Welcome Email" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all" placeholder="Welcome to our platform!" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Content (HTML)</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10}
              className="w-full px-4 py-3 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm font-mono focus:outline-none focus:border-flash/30 transition-all resize-y"
              placeholder="<h1>Welcome!</h1><p>Thanks for joining...</p>" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !form.name || !form.subject || !form.content}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium transition-all disabled:opacity-50">
              {saving ? <IconLoader size={14} /> : "Save Template"}
            </button>
            <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl text-muted text-sm hover:text-silver transition-all">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ghost">{templates.length} Template{templates.length !== 1 ? "s" : ""}</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowAiModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-flash/15 text-flash text-sm font-medium hover:bg-flash/5 transition-all">
            <IconBolt size={14} /> Generate with AI
          </button>
          <button onClick={() => openEditor()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium transition-all">
            <IconPlus size={14} /> New Template
          </button>
        </div>
      </div>
      {templatesLoading ? (
        <div className="flex justify-center py-16"><IconLoader size={24} className="text-flash" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16"><IconMail size={36} className="text-muted/20 mx-auto mb-3" /><p className="text-muted text-sm">No templates yet</p></div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t._id} className="group glass rounded-xl px-5 py-4 flex items-center gap-4 border border-flash/5 hover:border-flash/12 hover:speed-shadow transition-all duration-200">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ghost truncate">{t.name}</p>
                <p className="text-xs text-muted mt-0.5 truncate">Subject: {t.subject}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => openEditor(t)} className="p-2 rounded-lg hover:bg-flash/8 text-muted hover:text-flash transition-all"><IconEdit size={14} /></button>
                <button onClick={() => setDeleteConfirm(t._id)} className="p-2 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition-all"><IconTrash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {deleteConfirm && (
        <ConfirmModal title="Delete Template" message="This cannot be undone."
          onConfirm={() => { dispatch(deleteTemplate(deleteConfirm)); setDeleteConfirm(null); }}
          onCancel={() => setDeleteConfirm(null)} />
      )}

      {/* AI Template Generation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm" onClick={() => { setShowAiModal(false); dispatch(clearGeneratedTemplate()); }}>
          <div className="glass rounded-2xl border border-flash/15 speed-shadow-lg p-6 w-full max-w-lg mx-4 animate-fade-in-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><IconBolt size={16} className="text-flash" /><h3 className="text-sm font-semibold text-ghost">Generate Template with AI</h3></div>
              <button onClick={() => { setShowAiModal(false); dispatch(clearGeneratedTemplate()); }} className="text-muted hover:text-ghost transition-colors"><IconX size={16} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Describe your template</label>
                <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all resize-y"
                  placeholder="e.g. Welcome email for new users with onboarding steps..." />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {["professional", "friendly", "formal", "casual", "marketing"].map((t) => (
                    <button key={t} onClick={() => setAiTone(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${aiTone === t ? "bg-flash/10 text-flash border-flash/20" : "text-muted border-flash/6 hover:border-flash/15"}`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">AI Provider</label>
                {providers.length === 0 ? (
                  <p className="text-xs text-muted/60">No providers available. Configure API keys in settings.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
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
              </div>

              <button onClick={handleAiGenerate} disabled={templateLoading || !aiPrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium transition-all disabled:opacity-50">
                {templateLoading ? <span className="flex items-center justify-center gap-2"><IconLoader size={14} /> Generating...</span> : "Generate Template"}
              </button>

              {generatedTemplate && (
                <div className="space-y-3 pt-2 border-t border-flash/10 animate-fade-in-up">
                  <p className="text-xs text-muted uppercase tracking-wider">Preview</p>
                  <div className="rounded-xl bg-void/60 border border-flash/5 p-4 space-y-2">
                    <p className="text-xs text-muted">Name: <span className="text-ghost font-medium">{generatedTemplate.name}</span></p>
                    <p className="text-xs text-muted">Subject: <span className="text-ghost font-medium">{generatedTemplate.subject}</span></p>
                    <div className="border-t border-flash/5 pt-2 text-sm text-silver leading-relaxed max-h-48 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: generatedTemplate.body }} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleUseAiTemplate}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium transition-all">
                      Use & Edit Template
                    </button>
                    <button onClick={handleAiGenerate} disabled={templateLoading}
                      className="px-4 py-2.5 rounded-xl border border-flash/15 text-flash text-sm hover:bg-flash/5 transition-all">
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// EMAIL ACCOUNTS TAB
// ═══════════════════════════════════════
function AccountsTab() {
  const dispatch = useDispatch();
  const { accounts, accountsLoading } = useSelector((s) => s.email);
  const user = useSelector((s) => s.auth.user);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [verifyingId, setVerifyingId] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [saving, setSaving] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const result = await dispatch(addAccount({ email, label }));
      if (result.meta.requestStatus === "fulfilled") {
        setAdding(false);
        setEmail("");
        setLabel("");
      }
    } finally { setSaving(false); }
  };

  const handleVerify = async (id) => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setSaving(true);
    try {
      const result = await dispatch(verifyAccount({ id, otp: code }));
      if (result.meta.requestStatus === "fulfilled") {
        setVerifyingId(null);
        setOtp(["", "", "", "", "", ""]);
      }
    } finally { setSaving(false); }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleResend = async (id) => {
    if (cooldown > 0) return;
    await dispatch(resendAccountOtp(id));
    setCooldown(60);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ghost">Connected Emails</h2>
        <button onClick={() => { setAdding(true); setEmail(user?.email || ""); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium transition-all">
          <IconPlus size={14} /> Add Email
        </button>
      </div>

      {/* Add email form */}
      {adding && (
        <div className="glass rounded-2xl p-5 speed-shadow-lg mb-4 animate-fade-in-up space-y-4">
          <h3 className="text-sm font-semibold text-ghost">Add Sender Email</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
              className="px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all" />
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)"
              className="px-4 py-2.5 rounded-xl bg-void/80 border border-flash/10 text-ghost text-sm focus:outline-none focus:border-flash/30 transition-all" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={saving || !email}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium disabled:opacity-50 transition-all">
              {saving ? <IconLoader size={14} /> : "Send Verification"}
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-xl text-muted text-sm hover:text-silver transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* OTP verification */}
      {verifyingId && (
        <div className="glass rounded-2xl p-5 speed-shadow-lg mb-4 animate-fade-in-up space-y-4">
          <h3 className="text-sm font-semibold text-ghost">Enter Verification Code</h3>
          <p className="text-xs text-muted">Check the email inbox for a 6-digit code.</p>
          <div className="flex justify-center gap-2">
            {otp.map((d, i) => (
              <input key={i} ref={(el) => (inputRefs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`w-10 h-12 text-center text-lg font-bold rounded-xl bg-void/80 border text-ghost focus:outline-none focus:border-flash/50 focus:ring-1 focus:ring-flash/20 transition-all ${d ? "border-flash/30" : "border-flash/10"}`} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleVerify(verifyingId)} disabled={saving || otp.join("").length !== 6}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-flash to-turbo text-white text-sm font-medium disabled:opacity-50 transition-all">
              {saving ? <IconLoader size={14} /> : "Verify"}
            </button>
            <button onClick={() => handleResend(verifyingId)} disabled={cooldown > 0}
              className="text-sm text-flash hover:text-bolt disabled:text-muted transition-colors">
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
            </button>
            <button onClick={() => { setVerifyingId(null); setOtp(["", "", "", "", "", ""]); }}
              className="text-sm text-muted hover:text-silver transition-colors ml-auto">Cancel</button>
          </div>
        </div>
      )}

      {/* Account list */}
      {accountsLoading ? (
        <div className="flex justify-center py-16"><IconLoader size={24} className="text-flash" /></div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16"><IconMail size={36} className="text-muted/20 mx-auto mb-3" /><p className="text-muted text-sm">No connected emails</p><p className="text-muted/60 text-xs mt-1">Add a sender email to start creating campaigns</p></div>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <div key={a._id} className="group glass rounded-xl px-5 py-4 flex items-center gap-4 border border-flash/5 hover:border-flash/12 hover:speed-shadow transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-flash/8 border border-flash/10 flex items-center justify-center shrink-0">
                {a.isVerified ? <IconCheck size={16} className="text-success" /> : <IconClock size={16} className="text-warning" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ghost truncate">{a.email}</p>
                  {a.isDefault && <span className="px-1.5 py-0.5 rounded-md bg-flash/10 text-[10px] text-flash font-medium flex items-center gap-1"><IconStar size={8} /> Default</span>}
                  {!a.isVerified && <span className="px-1.5 py-0.5 rounded-md bg-warning/10 text-[10px] text-warning font-medium">Pending</span>}
                </div>
                {a.label && <p className="text-xs text-muted mt-0.5">{a.label}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {!a.isVerified && (
                  <button onClick={() => { setVerifyingId(a._id); setOtp(["", "", "", "", "", ""]); }}
                    className="px-3 py-1.5 rounded-lg text-xs text-flash hover:bg-flash/8 transition-all">Verify</button>
                )}
                {a.isVerified && !a.isDefault && (
                  <button onClick={() => dispatch(setDefaultAccount(a._id))}
                    className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-flash hover:bg-flash/8 transition-all">Set Default</button>
                )}
                <button onClick={() => dispatch(removeAccount(a._id))}
                  className="p-2 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition-all"><IconTrash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// CONFIRM MODAL
// ═══════════════════════════════════════
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm" onClick={onCancel}>
      <div className="glass rounded-2xl border border-danger/15 speed-shadow-lg p-6 w-full max-w-sm mx-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ghost">{title}</h3>
          <button onClick={onCancel} className="text-muted hover:text-ghost transition-colors"><IconX size={16} /></button>
        </div>
        <p className="text-sm text-silver mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-muted border border-flash/10 hover:bg-steel/30 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white bg-danger hover:bg-danger/80 transition-all font-medium">Delete</button>
        </div>
      </div>
    </div>
  );
}
