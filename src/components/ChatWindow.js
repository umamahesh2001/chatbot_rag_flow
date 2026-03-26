"use client";

import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { sendMessage } from "@/store/chatSlice";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

function IconBolt({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export default function ChatWindow() {
  const { messages, isSending, isLoading } = useSelector((state) => state.chat);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  return (
    <div className="flex-1 flex flex-col h-screen relative z-10">
      <header className="glass border-b border-flash/5 px-6 py-3.5 flex items-center gap-3 speed-shadow relative overflow-hidden">
        <div className="w-2 h-2 rounded-full bg-success status-dot" />
        <h1 className="text-sm font-bold text-ghost tracking-wide">Connect Fast</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-flash/15" />
          <span className="text-[10px] text-muted tracking-wider uppercase">Live</span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-flash/15" />
        </div>
        <div className="absolute inset-0 speed-streak pointer-events-none" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 xl:px-24 py-6">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="shimmer w-12 h-12 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg) => (
              <MessageBubble key={msg._id} message={msg} isTyping={msg.streaming && isSending} />
            ))}
            {isSending && !messages.some((m) => m.streaming) &&
              messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <ChatInput />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-flash/15 to-turbo/10
          border border-flash/10 flex items-center justify-center speed-shadow-lg">
          <IconBolt size={36} className="text-flash" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-2
          bg-gradient-to-b from-flash/10 to-transparent rounded-full blur-md" />
      </div>
      <h2 className="text-2xl font-bold text-ghost mb-2 tracking-tight">Ready to race?</h2>
      <p className="text-sm text-muted max-w-sm leading-relaxed">
        Ask anything — code, writing, images, analysis. Lightning-fast responses from multiple AI providers.
      </p>
      <div className="flex flex-wrap justify-center gap-2.5 mt-8">
        {["Explain quantum computing", "Write a Python script", "Generate an image of space", "Help me brainstorm"].map((text) => (
          <SuggestionChip key={text} text={text} />
        ))}
      </div>
    </div>
  );
}

function SuggestionChip({ text }) {
  const dispatch = useDispatch();
  const isSending = useSelector((state) => state.chat.isSending);
  return (
    <button onClick={() => !isSending && dispatch(sendMessage(text))} disabled={isSending}
      className="px-4 py-2.5 rounded-xl text-xs text-muted border border-flash/8
        bg-obsidian/50 hover:bg-steel/30 hover:text-silver hover:border-flash/15
        speed-shadow transition-all duration-200 disabled:opacity-30">
      {text}
    </button>
  );
}
