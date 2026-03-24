"use client";

import { useState } from "react";

function IconBook({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function IconChevron({ size = 10, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function SourcesCitation({ sources }) {
  const [expanded, setExpanded] = useState(false);
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2 border-t border-flash/8">
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-flash/70 hover:text-flash transition-colors">
        <IconBook />
        <span>{sources.length} source{sources.length > 1 ? "s" : ""}</span>
        <IconChevron className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5">
          {sources.map((s, i) => (
            <div key={i} className="px-3 py-2 rounded-lg bg-abyss/60 border border-flash/5 text-[11px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-flash font-medium">{s.documentName}</span>
                <span className="text-muted text-[9px]">{Math.round(s.similarity * 100)}% match</span>
              </div>
              <p className="text-muted leading-snug">{s.chunkPreview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
