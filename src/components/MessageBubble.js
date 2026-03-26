"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDispatch } from "react-redux";
import { retryMessage } from "@/store/chatSlice";
import SourcesCitation from "./SourcesCitation";

function IconBolt({ size = 15 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>);
}
function IconUser({ size = 15 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" /></svg>);
}
function IconRetry({ size = 11 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>);
}
function IconAlert({ size = 13 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>);
}
function IconDownload({ size = 11 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>);
}

export default function MessageBubble({ message, isTyping }) {
  const dispatch = useDispatch();
  const isUser = message.role === "user";
  const hasError = message.error;

  return (
    <div className={`animate-fade-in-up flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-flash to-turbo flex items-center justify-center speed-shadow">
          <IconBolt size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser ? "bg-gradient-to-br from-flash/12 to-turbo/8 border border-flash/12 text-ghost speed-shadow" : "bg-obsidian/80 border border-white/[0.04] text-silver"}
          ${hasError ? "border-danger/30 bg-danger/5" : ""}`}>
          {message.imageUrl && (
            <div className="mb-3">
              <img src={message.imageUrl} alt={message.content} className="rounded-xl max-w-full border border-flash/10 speed-shadow" loading="lazy" />
              <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-bolt hover:text-spark transition-colors">
                <IconDownload size={10} /> Open full size
              </a>
            </div>
          )}
          {(!message.imageUrl || isTyping) && (
            <div className={isTyping ? "typing-cursor" : ""}>
              {isUser ? (
                message.content.split("\n").map((line, i) => (<p key={i} className={i > 0 ? "mt-1.5" : ""}>{line}</p>))
              ) : (
                <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown></div>
              )}
            </div>
          )}
          {hasError && isUser && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-danger/15">
              <IconAlert className="text-danger" />
              <span className="text-[11px] text-danger">Failed to send</span>
              <button onClick={() => dispatch(retryMessage(message.content))} className="ml-auto flex items-center gap-1 text-[11px] text-bolt hover:text-spark transition-colors"><IconRetry /> Retry</button>
            </div>
          )}
          {hasError && !isUser && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-danger/15">
              <IconAlert className="text-danger shrink-0" /><span className="text-[11px] text-danger">Provider error</span>
            </div>
          )}
          {!isUser && message.sources && <SourcesCitation sources={message.sources} />}
        </div>
        {!isUser && message.provider && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-muted px-2 tracking-wider uppercase">
            <span className="w-1 h-1 rounded-full bg-flash/30" />{message.provider}
          </span>
        )}
      </div>
      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-steel border border-flash/8 flex items-center justify-center">
          <IconUser size={14} className="text-silver" />
        </div>
      )}
    </div>
  );
}
