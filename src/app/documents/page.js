"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useChatStore from "@/store/chatStore";

function IconBolt({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function IconArrowLeft({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function IconUploadCloud({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}
function IconFile({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconTrash({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
function IconLoader({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}
function IconCheck({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconAlert({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function IconX({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function DocumentsPage() {
  const { documents, isUploading, fetchDocuments, uploadDocument, deleteDocument } = useChatStore();
  const fileRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // Poll for processing status
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(() => fetchDocuments(), 3000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await uploadDocument(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadDocument(file);
  };

  const handleDelete = async (id) => {
    await deleteDocument(id);
    setDeleteConfirm(null);
  };

  const readyCount = documents.filter((d) => d.status === "ready").length;
  const processingCount = documents.filter((d) => d.status === "processing").length;
  const errorCount = documents.filter((d) => d.status === "error").length;

  return (
    <div className="min-h-screen bg-void relative">
      {/* Top nav */}
      <header className="glass border-b border-flash/5 speed-shadow sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/"
            className="flex items-center gap-2 text-muted hover:text-flash transition-colors group">
            <IconArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm">Back to Chat</span>
          </Link>
          <div className="h-5 w-px bg-flash/10" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-flash to-turbo flex items-center justify-center speed-shadow">
              <IconBolt size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-ghost">Documents</h1>
              <p className="text-[10px] text-muted tracking-wider uppercase">RAG Knowledge Base</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Ready", value: readyCount, color: "text-success", bg: "bg-success/8 border-success/15" },
            { label: "Processing", value: processingCount, color: "text-warning", bg: "bg-warning/8 border-warning/15" },
            { label: "Errors", value: errorCount, color: "text-danger", bg: "bg-danger/8 border-danger/15" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border px-4 py-3 ${stat.bg}`}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-8 text-center mb-8 transition-all duration-200
            ${dragOver
              ? "border-flash/40 bg-flash/5 scale-[1.01]"
              : "border-flash/10 hover:border-flash/20 bg-obsidian/30"}`}
        >
          <input ref={fileRef} type="file" accept=".pdf,.txt" onChange={handleUpload} className="hidden" />
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <>
                <IconLoader size={32} className="text-flash" />
                <p className="text-sm text-flash font-medium">Uploading & processing...</p>
                <p className="text-xs text-muted">This may take a moment for large files</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-flash/8 border border-flash/10 flex items-center justify-center">
                  <IconUploadCloud size={28} className="text-flash/70" />
                </div>
                <div>
                  <p className="text-sm text-ghost font-medium">
                    Drag & drop your file here, or{" "}
                    <button onClick={() => fileRef.current?.click()} className="text-flash hover:text-bolt underline underline-offset-2">
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-muted mt-1">Supports PDF and TXT files up to 10MB</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Document list */}
        {documents.length === 0 ? (
          <div className="text-center py-16">
            <IconFile size={40} className="text-muted/20 mx-auto mb-4" />
            <p className="text-muted text-sm">No documents uploaded yet</p>
            <p className="text-muted/70 text-xs mt-1">Upload PDFs or text files to enable RAG mode in chat</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="text-sm font-semibold text-ghost">{documents.length} document{documents.length !== 1 ? "s" : ""}</h2>
              <button onClick={() => fetchDocuments()} className="text-[11px] text-muted hover:text-flash transition-colors">
                Refresh
              </button>
            </div>
            {documents.map((doc) => (
              <div key={doc._id}
                className="group glass rounded-xl px-5 py-4 flex items-center gap-4 border border-flash/5 hover:border-flash/12 hover:speed-shadow transition-all duration-200">
                {/* Status icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  ${doc.status === "ready" ? "bg-success/10 border border-success/20" : ""}
                  ${doc.status === "processing" ? "bg-warning/10 border border-warning/20" : ""}
                  ${doc.status === "error" ? "bg-danger/10 border border-danger/20" : ""}`}>
                  {doc.status === "ready" && <IconCheck size={18} className="text-success" />}
                  {doc.status === "processing" && <IconLoader size={18} className="text-warning" />}
                  {doc.status === "error" && <IconAlert size={18} className="text-danger" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ghost truncate">{doc.originalName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                      ${doc.status === "ready" ? "bg-success/10 text-success" : ""}
                      ${doc.status === "processing" ? "bg-warning/10 text-warning" : ""}
                      ${doc.status === "error" ? "bg-danger/10 text-danger" : ""}`}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                    <span>{formatSize(doc.size)}</span>
                    {doc.chunkCount > 0 && <span>{doc.chunkCount} chunks</span>}
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                  {doc.status === "error" && doc.error && (
                    <p className="text-[11px] text-danger/80 mt-1 truncate">{doc.error}</p>
                  )}
                </div>

                {/* Delete */}
                <button onClick={() => setDeleteConfirm(doc._id)}
                  className="shrink-0 p-2 rounded-xl text-muted/40 hover:text-danger hover:bg-danger/8 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Delete document">
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm"
          onClick={() => setDeleteConfirm(null)}>
          <div className="glass rounded-2xl border border-danger/15 speed-shadow-lg p-6 w-full max-w-sm mx-4 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ghost">Delete Document</h3>
              <button onClick={() => setDeleteConfirm(null)} className="text-muted hover:text-ghost transition-colors">
                <IconX size={16} />
              </button>
            </div>
            <p className="text-sm text-silver mb-1">
              Are you sure you want to delete{" "}
              <span className="text-ghost font-medium">
                {documents.find((d) => d._id === deleteConfirm)?.originalName}
              </span>
              ?
            </p>
            <p className="text-xs text-muted mb-6">This will remove all chunks and embeddings. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-muted border border-flash/10 hover:bg-steel/30 transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white bg-danger hover:bg-danger/80 transition-all font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
