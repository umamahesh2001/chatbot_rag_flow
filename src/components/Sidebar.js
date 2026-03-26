"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { fetchConversations, selectConversation, newConversation, deleteConversation, setSidebarOpen, fetchDocuments } from "@/store/chatSlice";
import { logout } from "@/store/authSlice";

function IconRacing({ size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" /></svg>);
}
function IconPlus({ size = 18 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>);
}
function IconChat({ size = 15 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>);
}
function IconTrash({ size = 13 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>);
}
function IconCollapse({ size = 18 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="M14 9l-3 3 3 3" /></svg>);
}
function IconLogout({ size = 15 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>);
}
function IconMail({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4l-10 8L2 4" /></svg>);
}
function IconChevron({ size = 14, className = "" }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6" /></svg>);
}
function IconZap({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { conversations, activeConversationId, sidebarOpen, documents } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const [automationOpen, setAutomationOpen] = useState(pathname.startsWith("/automation"));

  useEffect(() => { dispatch(fetchConversations()); dispatch(fetchDocuments()); }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  if (!sidebarOpen) {
    return (
      <button onClick={() => dispatch(setSidebarOpen(true))}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl glass speed-shadow hover:speed-shadow-lg transition-all group">
        <IconChat size={18} className="text-flash group-hover:text-bolt transition-colors" />
      </button>
    );
  }

  return (
    <aside className="w-72 h-screen flex flex-col bg-abyss/90 backdrop-blur-2xl border-r border-flash/5 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-flash/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-flash to-turbo flex items-center justify-center speed-shadow">
            <IconRacing size={20} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-ghost text-sm tracking-wide block">Connect Fast</span>
            <span className="text-[9px] text-muted tracking-widest uppercase">AI Engine</span>
          </div>
        </div>
        <button onClick={() => dispatch(setSidebarOpen(false))}
          className="p-1.5 rounded-lg hover:bg-steel/60 transition-all group">
          <IconCollapse size={17} className="text-muted group-hover:text-silver transition-colors" />
        </button>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button onClick={() => { dispatch(newConversation()); router.push("/"); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
            bg-gradient-to-r from-flash/10 to-turbo/10 border border-flash/15 hover:border-flash/30
            text-flash hover:text-bolt speed-shadow hover:speed-shadow-lg
            transition-all duration-200 text-sm font-medium group">
          <IconPlus size={17} className="group-hover:rotate-90 transition-transform duration-300" />
          New Chat
        </button>
      </div>

      {/* Documents link */}
      <div className="px-3 pb-2">
        <Link href="/documents"
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm group
            ${pathname === "/documents" ? "bg-flash/8 text-flash border-flash/15 speed-shadow" : "text-muted hover:text-flash border-flash/6 hover:border-flash/15 hover:bg-flash/5"}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span className="flex-1">Documents</span>
          {documents.filter((d) => d.status === "ready").length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-flash/10 text-[10px] text-flash font-medium">
              {documents.filter((d) => d.status === "ready").length}
            </span>
          )}
          <IconChevron size={14} className="shrink-0 text-muted/40 group-hover:text-flash/60 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Automation section */}
      <div className="px-3 pb-2">
        <button onClick={() => setAutomationOpen(!automationOpen)}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl
            text-muted hover:text-flash border border-flash/6 hover:border-flash/15
            hover:bg-flash/5 transition-all duration-200 text-sm group">
          <IconZap size={16} className="shrink-0" />
          <span className="flex-1 text-left">Automation</span>
          <IconChevron size={14} className={`shrink-0 text-muted/40 group-hover:text-flash/60 transition-all duration-200 ${automationOpen ? "rotate-90" : ""}`} />
        </button>
        {automationOpen && (
          <div className="mt-1 ml-4 border-l border-flash/8 pl-3 space-y-1 animate-fade-in-up">
            <Link href="/automation/inbox"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200
                ${pathname === "/automation/inbox" ? "bg-flash/8 text-flash border border-flash/15 speed-shadow" : "text-muted hover:text-flash hover:bg-flash/5 border border-transparent"}`}>
              <IconMail size={14} />
              <span>Smart Inbox</span>
            </Link>
            <Link href="/automation/email"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200
                ${pathname === "/automation/email" ? "bg-flash/8 text-flash border border-flash/15 speed-shadow" : "text-muted hover:text-flash hover:bg-flash/5 border border-transparent"}`}>
              <IconZap size={14} />
              <span>Email Automation</span>
            </Link>
          </div>
        )}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center mt-10 px-4">
            <IconChat size={20} className="text-muted/30 mx-auto mb-2" />
            <p className="text-muted text-xs">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div key={conv._id}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-sm
                ${activeConversationId === conv._id
                  ? "bg-flash/8 text-ghost border border-flash/15 speed-shadow"
                  : "text-muted hover:bg-steel/30 hover:text-silver border border-transparent"}`}
              onClick={() => { dispatch(selectConversation(conv._id)); router.push("/"); }}>
              <IconChat size={14} className={`shrink-0 ${activeConversationId === conv._id ? "text-flash" : "text-muted/40"}`} />
              <span className="truncate flex-1">{conv.title}</span>
              <button onClick={(e) => { e.stopPropagation(); dispatch(deleteConversation(conv._id)); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-danger/15 transition-all">
                <IconTrash size={12} className="text-danger/70" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* User & Logout */}
      <div className="p-3 border-t border-flash/5">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-flash/20 to-turbo/20 border border-flash/15 flex items-center justify-center shrink-0">
              <span className="text-flash text-xs font-bold uppercase">{user.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ghost text-xs font-medium truncate">{user.name}</p>
              <p className="text-muted text-[10px] truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-danger/10 transition-all group" title="Sign out">
              <IconLogout size={14} className="text-muted group-hover:text-danger transition-colors" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
