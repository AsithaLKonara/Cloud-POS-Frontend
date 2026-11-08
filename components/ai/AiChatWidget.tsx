"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  User,
  X,
  Send,
  Trash2,
  Minimize2,
  Maximize2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { usePathname } from "next/navigation";
import { aiService, ChatMessage, ChatResponseSource } from "@/services/ai.service";
import MarkdownView from "./MarkdownView";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatResponseSource[];
  suggestedQuestions?: string[];
  timestamp: string;
}

export default function AiChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load suggested prompts on mount
  useEffect(() => {
    aiService.getSuggestedPrompts()
      .then((data) => {
        if (data.prompts) setSuggestedPrompts(data.prompts);
        if (data.tenant?.name) setTenantName(data.tenant.name);
      })
      .catch(() => {
        // Fallback default prompts
        setSuggestedPrompts([
          "What is our Accounts Receivable aging balance?",
          "How do I start and reconcile a physical stocktake?",
          "Is our General Ledger currently balanced?",
          "Show today's sales and revenue summary"
        ]);
      });

    // Initial greeting message
    setMessages([
      {
        id: "msg-welcome",
        role: "assistant",
        content: `👋 **Welcome to XONIT AI Copilot!**

I am your dedicated support agent with real-time access to your store's live financial ledger, inventory status, and operational guides.

Ask me anything about:
- **General Ledger** & Trial Balance status
- **Accounts Payable / Receivable** aging & overdue invoices
- **Stocktaking & Reconciliation** workflows
- **POS terminal & cash drawer** operations`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    const userMsg: DisplayMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build conversation history payload
      const historyPayload: ChatMessage[] = messages
        .filter(m => m.id !== "msg-welcome")
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await aiService.chat(text, historyPayload);

      const assistantMsg: DisplayMessage = {
        id: `msg-${Date.now()}-a`,
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        suggestedQuestions: res.suggestedQuestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: DisplayMessage = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: `⚠️ **Unable to complete request:** ${err?.response?.data?.error || err.message || "An unexpected error occurred. Please try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg-welcome-reset",
        role: "assistant",
        content: `Chat cleared. How can I assist your team today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const toggleSource = (id: string) => {
    setExpandedSources(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (pathname === "/admin/ai-assistant") {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-xl shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label="Open AI Support Copilot"
        >
          <div className="relative">
            <Sparkles size={20} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
          </div>
          <span className="font-semibold text-xs sm:text-sm tracking-wide">
            AI Copilot
          </span>
          <span className="hidden sm:inline-block text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
            RAG
          </span>
        </button>
      )}

      {/* Floating Assistant Window */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-surface border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isExpanded
              ? "inset-4 sm:inset-10"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[420px] max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-80px)]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-amber-950 text-white px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm leading-tight">XONIT AI Copilot</h3>
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-medium">
                    <ShieldCheck size={10} />
                    Isolated
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 truncate max-w-[200px]">
                  {tenantName ? `${tenantName} • RAG Grounded` : "Multi-Tenant Support Copilot"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear Chat History"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse Window" : "Expand Window"}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close AI Copilot"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                    <Bot size={15} />
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-sm ${
                      msg.role === "user"
                        ? "bg-amber-500 text-white rounded-br-none"
                        : "bg-surface border border-border text-foreground rounded-bl-none"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <MarkdownView content={msg.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {/* Sources Accordion */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1.5">
                      <button
                        onClick={() => toggleSource(msg.id)}
                        className="flex items-center gap-1.5 text-[11px] text-muted hover:text-amber-500 font-medium transition-colors"
                      >
                        <BookOpen size={12} />
                        <span>Sources ({msg.sources.length} retrieved)</span>
                        {expandedSources[msg.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {expandedSources[msg.id] && (
                        <div className="mt-1 space-y-1 pl-2 border-l-2 border-amber-500/30">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="text-[11px] bg-surface/80 border border-border rounded p-1.5">
                              <span className="font-semibold text-foreground block">{src.title}</span>
                              {src.snippet && (
                                <span className="text-muted text-[10px] line-clamp-2 mt-0.5 block">{src.snippet}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Follow-up Questions */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q)}
                          className="flex items-center gap-1 text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-1 transition-colors text-left"
                        >
                          <ArrowRight size={10} className="shrink-0" />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-muted block mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={15} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <Bot size={15} />
                </div>
                <div className="bg-surface border border-border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5 text-xs text-muted shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px]">Retrieving isolated tenant data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompts when few messages */}
          {messages.length <= 2 && suggestedPrompts.length > 0 && (
            <div className="px-3 py-2 bg-background border-t border-border flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-muted shrink-0 font-medium">Try:</span>
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="shrink-0 text-[11px] bg-surface hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border border-border rounded-full px-2.5 py-1 text-muted transition-colors whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-surface border-t border-border flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about GL, AP/AR aging, stocktake, or POS..."
              disabled={loading}
              className="flex-1 bg-background border border-border focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-white flex items-center justify-center transition-all shrink-0 shadow-sm"
              aria-label="Send message"
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

