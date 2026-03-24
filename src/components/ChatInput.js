"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useChatStore from "@/store/chatStore";
import ProviderSelector from "./ProviderSelector";
import RagToggle from "./RagToggle";
import { api } from "@/lib/api";

function IconSend({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMic({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function IconMicOff({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2c0 .78-.13 1.53-.36 2.24" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function IconUpload({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconLoader({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

export default function ChatInput() {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const { sendMessage, isSending } = useChatStore();

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 150) + "px";
    }
  }, [input]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setIsTranscribing(true);
    try {
      const data = await api.transcribeAudio(file);
      setInput((prev) => (prev ? prev + " " + data.text : data.text));
    } catch (err) {
      alert("Transcription failed: " + err.message);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    sendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div
        className={`glass rounded-2xl flex items-end gap-1.5 p-2
        border transition-all duration-300 focus-within:speed-shadow-lg
        ${
          isListening
            ? "border-flash/30 shadow-lg shadow-flash/10"
            : "border-flash/6 focus-within:border-flash/20"
        }`}
      >
        {/* Audio upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.ogg,.webm,.flac"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || isTranscribing}
          className={`shrink-0 p-2.5 rounded-xl transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed
            ${isTranscribing ? "text-flash animate-pulse" : "text-muted hover:text-flash/70 hover:bg-flash/5"}`}
          title="Upload audio file"
        >
          {isTranscribing ? <IconLoader size={17} /> : <IconUpload size={17} />}
        </button>

        {/* Mic */}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={isSending}
            className={`shrink-0 p-2.5 rounded-xl transition-all duration-200
              disabled:opacity-30 disabled:cursor-not-allowed
              ${
                isListening
                  ? "bg-flash/15 text-flash pulse-glow"
                  : "text-muted hover:text-flash/70 hover:bg-flash/5"
              }`}
          >
            {isListening ? <IconMicOff size={17} /> : <IconMic size={17} />}
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Type your message..."}
          rows={1}
          disabled={isSending}
          className="flex-1 bg-transparent text-ghost text-sm placeholder-muted/60
            resize-none outline-none px-3 py-2 max-h-[150px]
            disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="shrink-0 p-2.5 rounded-xl
            bg-gradient-to-r from-flash to-flash
            text-white speed-shadow
            disabled:opacity-20 disabled:cursor-not-allowed
            hover:shadow-lg hover:shadow-flash/25
            active:scale-95 transition-all duration-200"
        >
          <IconSend size={17} />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2.5 px-1">
        <div className="flex items-center gap-2">
          <ProviderSelector />
          <RagToggle />
        </div>
        <p className="text-[10px] text-muted">
          {isListening
            ? "Speak now \u2014 click mic to stop"
            : "Enter to send \u00b7 Shift+Enter for new line"}
        </p>
      </div>
    </form>
  );
}
