"use client";

import { useEffect, useRef, useState } from "react";
import useChatStore from "@/store/chatStore";

function IconChip({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2M15 20v2M2 15h2M20 15h2M9 2v2M9 20v2M2 9h2M20 9h2" />
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

const PROVIDER_LABELS = {
  together: "Together AI",
  openai: "OpenAI",
  google: "Google AI",
  anthropic: "Anthropic",
};

export default function ProviderSelector() {
  const { providers, selectedProvider, setSelectedProvider, fetchProviders } = useChatStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (providers.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px]
          text-muted hover:text-flash bg-obsidian/60 border border-flash/6
          hover:border-flash/20 hover:speed-shadow transition-all duration-200">
        <IconChip size={11} className="text-flash/60" />
        <span>{PROVIDER_LABELS[selectedProvider] || selectedProvider}</span>
        <IconChevron className={`transition-transform duration-200 text-muted ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 min-w-[180px] rounded-xl
          glass border border-flash/10 speed-shadow-lg py-2 z-50 animate-fade-in-up">
          {providers.map((p) => (
            <button key={p.name} type="button"
              onClick={() => { setSelectedProvider(p.name); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 transition-all duration-150
                ${p.name === selectedProvider ? "text-flash bg-flash/8" : "text-muted hover:text-silver hover:bg-white/[0.02]"}`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${p.name === selectedProvider ? "bg-flash" : "bg-muted/20"}`} />
              {PROVIDER_LABELS[p.name] || p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
