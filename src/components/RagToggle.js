"use client";

import useChatStore from "@/store/chatStore";

function IconDocs({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

export default function RagToggle() {
  const { ragMode, setRagMode, documents } = useChatStore();
  const readyDocs = documents.filter((d) => d.status === "ready").length;

  return (
    <button type="button" onClick={() => setRagMode(!ragMode)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] border transition-all duration-200
        ${ragMode
          ? "bg-flash/10 border-flash/20 text-flash speed-shadow"
          : "bg-obsidian/60 border-flash/6 text-muted hover:text-flash hover:border-flash/20"}`}>
      <IconDocs size={11} />
      <span>{ragMode ? "RAG Mode" : "Direct"}</span>
      {ragMode && readyDocs > 0 && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-flash/15 text-[9px] text-flash font-medium">{readyDocs}</span>
      )}
      {ragMode && readyDocs === 0 && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-danger/15 text-[9px] text-danger font-medium">No docs</span>
      )}
    </button>
  );
}
