"use client";

function IconBolt({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export default function TypingIndicator() {
  return (
    <div className="animate-fade-in-up flex gap-3 justify-start">
      <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-flash to-turbo flex items-center justify-center speed-shadow">
        <IconBolt className="text-white" />
      </div>
      <div className="bg-obsidian/80 border border-white/[0.04] rounded-2xl px-5 py-3.5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-flash/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-flash/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-flash/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
