"use client";

import { useState, useRef, useEffect, useCallback, FormEvent, KeyboardEvent } from "react";
import { Target, Send, Loader2, Paperclip, X } from "lucide-react";
import { sendChatMessage, uploadResume, startResearch, getResearchResults, streamResearchProgress } from "@/lib/api";
import VisionBoard from "@/components/board/VisionBoard";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Card {
  type: string;
  title: string;
  content: Record<string, unknown>;
  source_url?: string;
}

const WELCOME_MESSAGE = "Hey! I'm CareerLens — your AI career research buddy. Tell me about your dream role, and I'll help you find the perfect fit and prep you for it.\n\nWhat kind of role are you dreaming about?";

export default function Home() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Research state
  const [researchBoardId, setResearchBoardId] = useState<string | null>(null);
  const [researchProgress, setResearchProgress] = useState<string[]>([]);
  const [researchPercent, setResearchPercent] = useState(0);
  const [cards, setCards] = useState<Card[] | null>(null);

  // UI refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, researchProgress]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

  // Close focus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) return;
    setResumeFile(file);
  };

  const removeFile = () => {
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Parse action from AI response
  const parseAction = (text: string): { company: string; role: string } | null => {
    const match = text.match(/\{"action"\s*:\s*"start_research".*?"company"\s*:\s*"([^"]+)".*?"role"\s*:\s*"([^"]+)"\s*\}/);
    if (match) return { company: match[1], role: match[2] };
    return null;
  };

  // Clean action JSON from display text
  const cleanDisplayText = (text: string): string => {
    return text.replace(/\s*\{"action"\s*:\s*"start_research"[^}]*\}\s*/g, "").trim();
  };

  // Start research flow
  const handleStartResearch = useCallback(async (company: string, role: string) => {
    try {
      const result = await startResearch(sessionId, company, role);
      setResearchBoardId(result.board_id);

      streamResearchProgress(
        result.board_id,
        (data) => {
          setResearchProgress((prev) => [...prev, data.message]);
          if (data.progress >= 0) setResearchPercent(data.progress);
        },
        async () => {
          try {
            const results = await getResearchResults(result.board_id);
            setCards(results);
          } catch {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "Something went wrong fetching the results. Please try again." },
            ]);
          }
        },
        () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "The research connection was interrupted. Please try again." },
          ]);
        }
      );
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to start the research. Please try again." },
      ]);
    }
  }, [sessionId]);

  // Send message
  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !resumeFile) || isLoading) return;

    // Upload resume if attached
    let resumeText: string | undefined;
    if (resumeFile && !resumeUploaded) {
      setIsLoading(true);
      try {
        const result = await uploadResume(sessionId, resumeFile);
        resumeText = result.raw_text;
        setResumeUploaded(true);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I couldn't read that PDF. Could you try again or paste your resume text instead?" },
        ]);
        setIsLoading(false);
        return;
      }
    }

    const userContent = resumeFile && !resumeUploaded
      ? `${trimmed}\n\n[Attached resume: ${resumeFile.name}]`
      : trimmed;

    const userMessage: Message = { role: "user", content: userContent || `[Attached resume: ${resumeFile?.name}]` };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(true);

    try {
      // Send only the conversation messages (not the welcome message system-side)
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(sessionId, apiMessages, resumeText);
      const reply = response.reply;

      // Check if AI wants to start research
      const action = parseAction(reply);
      const displayText = cleanDisplayText(reply);

      setMessages((prev) => [...prev, { role: "assistant", content: displayText }]);

      if (action) {
        // Start deep research
        await handleStartResearch(action.company, action.role);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Could you try that again?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasQueried = messages.length > 1;

  // If we have cards, show the vision board
  if (cards) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
            <Target className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            <h1 className="font-bold tracking-tight text-gray-900 dark:text-gray-100">
              CareerLens
            </h1>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Your Vision Board
            </span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-6">
          <VisionBoard cards={cards} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Dot grid background */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, #d0d5dd 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header — only when conversation has started */}
      {hasQueried && (
        <div className="fixed top-4 left-4 z-20 flex items-center gap-2.5">
          <Target className="w-5 h-5 text-gray-900 dark:text-gray-100" />
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
            CareerLens
          </span>
        </div>
      )}

      {/* Landing hero — before first query */}
      {!hasQueried && (
        <div
          className="fixed left-1/2 z-10 w-full max-w-xl px-6 pointer-events-none"
          style={{ top: "calc(50% - 140px)", transform: "translateX(-50%)" }}
        >
          <header className="flex flex-col items-center gap-2 text-center">
            <Target className="w-10 h-10 text-gray-900 dark:text-gray-100" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              CareerLens
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Your AI career research buddy. Tell me your dream role.
            </p>
          </header>
        </div>
      )}

      {/* Messages area */}
      {hasQueried && (
        <div className="fixed inset-0 z-10 overflow-y-auto pt-16 pb-32">
          <div className="max-w-xl mx-auto px-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: "0s" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Research progress */}
            {researchBoardId && !cards && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-500 font-medium">Deep research in progress...</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {Math.round(researchPercent * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-gray-900 dark:bg-white transition-all duration-500"
                    style={{ width: `${Math.max(researchPercent * 100, 2)}%` }}
                  />
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {researchProgress.slice(-5).map((msg, i) => (
                    <p key={i} className="text-xs text-gray-400">{msg}</p>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input bar */}
      <div
        className={`fixed left-1/2 z-20 w-full max-w-xl px-4 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          hasQueried ? "" : ""
        }`}
        style={{
          top: hasQueried ? "auto" : "50%",
          bottom: hasQueried ? 16 : "auto",
          transform: hasQueried ? "translateX(-50%)" : "translateX(-50%) translateY(-50%)",
        }}
      >
        <div ref={containerRef} className="w-full">
          <form onSubmit={handleSubmit} className="w-full">
            {/* File attachment preview */}
            {resumeFile && (
              <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">
                <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300 text-xs truncate max-w-[200px]">
                  {resumeFile.name}
                </span>
                <button type="button" onClick={removeFile} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg focus-within:border-gray-300 dark:focus-within:border-gray-600 focus-within:shadow-xl transition-all overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3">
                {/* File upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 self-center text-gray-300 hover:text-gray-500 transition-colors"
                  title="Attach resume (PDF)"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Text input */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  placeholder={hasQueried ? "Type a message..." : "What's your dream role?"}
                  rows={1}
                  className="max-h-40 min-h-[28px] flex-1 resize-none overflow-y-auto bg-transparent py-0.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm"
                  disabled={isLoading || (!!researchBoardId && !cards)}
                />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !resumeFile) || (!!researchBoardId && !cards)}
                  className="flex-shrink-0 self-end flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 transition-all hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
