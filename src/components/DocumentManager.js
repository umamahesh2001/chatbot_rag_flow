"use client";

import { useEffect, useRef } from "react";
import useChatStore from "@/store/chatStore";

function IconUpload({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}
function IconFile({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconTrash({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}
function IconLoader({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}
function IconCheck({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function DocumentManager() {
  const { documents, isUploading, fetchDocuments, uploadDocument, deleteDocument } = useChatStore();
  const fileRef = useRef(null);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await uploadDocument(file);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="px-3 pb-2">
      <div className="border border-flash/6 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-flash/5">
          <span className="text-[11px] text-muted font-medium tracking-wide uppercase">Documents</span>
          <span className="text-[10px] text-muted">{documents.filter((d) => d.status === "ready").length} ready</span>
        </div>
        <div className="p-2">
          <input ref={fileRef} type="file" accept=".pdf,.txt" onChange={handleUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
              border border-dashed border-flash/12 hover:border-flash/25
              text-muted hover:text-flash text-xs transition-all duration-200 disabled:opacity-40">
            {isUploading ? <><IconLoader /> Uploading...</> : <><IconUpload size={14} /> Upload PDF or TXT</>}
          </button>
        </div>
        {documents.length > 0 && (
          <div className="px-2 pb-2 space-y-1 max-h-[180px] overflow-y-auto">
            {documents.map((doc) => (
              <div key={doc._id} className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-obsidian/30 hover:bg-steel/20 transition-all">
                {doc.status === "processing" && <IconLoader size={12} className="text-warning shrink-0" />}
                {doc.status === "ready" && <IconCheck size={12} className="text-success shrink-0" />}
                {doc.status === "error" && <span className="text-danger text-[10px] shrink-0">!</span>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <IconFile size={10} className="text-muted shrink-0" />
                    <span className="text-[11px] text-silver truncate">{doc.originalName}</span>
                  </div>
                  <div className="text-[9px] text-muted mt-0.5">
                    {formatSize(doc.size)}{doc.chunkCount > 0 && ` · ${doc.chunkCount} chunks`}
                  </div>
                </div>
                <button onClick={() => deleteDocument(doc._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger/15 transition-all shrink-0">
                  <IconTrash className="text-danger/60" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
