"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  User,
  Send,
  Trash2,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Plus,
  BookMarked,
  Layers,
  HelpCircle,
  Database,
  ExternalLink
} from "lucide-react";
import { aiService, ChatMessage, ChatResponseSource, KnowledgeDocument } from "@/services/ai.service";
import MarkdownView from "@/components/ai/MarkdownView";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatResponseSource[];
  suggestedQuestions?: string[];
  timestamp: string;
}

export default function AiAssistantPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge'>('chat');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [tenantMeta, setTenantMeta] = useState<{ name: string; currency: string; isGlBalanced: boolean; todaySales: number } | null>(null);

  // Custom knowledge state
  const [customDocs, setCustomDocs] = useState<KnowledgeDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docCategory, setDocCategory] = useState("GENERAL");
  const [docTags, setDocTags] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);

  useEffect(() => {
    aiService.getSuggestedPrompts()
      .then((data) => {
        if (data.prompts) setSuggestedPrompts(data.prompts);
        if (data.tenant) setTenantMeta(data.tenant);
      })
      .catch(() => {});

    setMessages([
      {
        id: "msg-init",
        role: "assistant",
        content: `### 👋 Welcome to your dedicated **XONIT AI Support Copilot**

I am equipped with a **tenant-isolated Retrieval-Augmented Generation (RAG)** pipeline. I have real-time visibility into your store's live financial data and operational manuals.

Try asking:
- *"Is our General Ledger in balance right now?"*
- *"What is our Accounts Receivable aging breakdown?"*
- *"How do I freeze and reconcile a physical stocktake?"*
- *"Show today's gross sales and order volume."*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  const loadKnowledge = async () => {
    setDocsLoading(true);
    try {
      const docs = await aiService.getKnowledge();
      setCustomDocs(docs || []);
    } catch (e) {
      // Ignored
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'knowledge') {
      loadKnowledge();
    }
  }, [activeTab]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    const userMsg: DisplayMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload: ChatMessage[] = messages
        .filter(m => m.id !== "msg-init")
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await aiService.chat(text, historyPayload);

      const assistantMsg: DisplayMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        suggestedQuestions: res.suggestedQuestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ **Request failed:** ${err.response?.data?.error || err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent) return;

    try {
      setSavingDoc(true);
      await aiService.addKnowledge({
        title: docTitle,
        category: docCategory,
        content: docContent,
        tags: docTags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setIsAddDocOpen(false);
      setDocTitle("");
      setDocContent("");
      setDocTags("");
      await loadKnowledge();
    } catch (err: any) {
      alert("Failed to save knowledge document: " + err.message);
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom knowledge document?")) return;
    try {
      await aiService.deleteKnowledge(id);
      await loadKnowledge();
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  XONIT AI Copilot & Knowledge Assistant
                </h1>
                <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                  <ShieldCheck size={12} />
                  Tenant Isolated RAG
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Support intelligence grounded in your tenant's live ledger, inventory, and business rules
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-surface border border-border p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? "bg-amber-500 text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Bot size={14} />
            <span>AI Chat Assistant</span>
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'knowledge'
                ? "bg-amber-500 text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <BookMarked size={14} />
            <span>Custom Knowledge Base</span>
          </button>
        </div>
      </div>

      {/* Live Telemetry Status Bar */}
      {tenantMeta && (
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-muted block text-[11px]">Tenant Organization</span>
            <span className="font-bold text-foreground text-sm">{tenantMeta.name}</span>
          </div>
          <div>
            <span className="text-muted block text-[11px]">General Ledger Health</span>
            <span className={`font-semibold text-sm ${tenantMeta.isGlBalanced ? "text-emerald-500" : "text-amber-500"}`}>
              {tenantMeta.isGlBalanced ? "Balanced (Debits = Credits)" : "Variance Flagged"}
            </span>
          </div>
          <div>
            <span className="text-muted block text-[11px]">Today's Recorded Sales</span>
            <span className="font-bold text-foreground text-sm font-mono">
              {tenantMeta.currency} {tenantMeta.todaySales.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted block text-[11px]">Isolation Boundary</span>
            <span className="font-semibold text-emerald-500 text-sm">
              Partitioned by Tenant ID
            </span>
          </div>
        </div>
      )}

      {/* Tab 1: AI Chat Assistant */}
      {activeTab === 'chat' && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-[650px]">
          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={17} />
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-sm ${
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

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pl-2 border-l-2 border-amber-500/30 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                        RAG Retrieved Grounding Sources
                      </span>
                      {msg.sources.map((s, idx) => (
                        <div key={idx} className="text-[11px] bg-background/80 border border-border rounded p-1.5">
                          <span className="font-semibold text-foreground block">{s.title}</span>
                          {s.snippet && (
                            <span className="text-muted text-[10px] line-clamp-2 mt-0.5 block">{s.snippet}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Followups */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q)}
                          className="flex items-center gap-1 text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-1 transition-colors"
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
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={17} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Bot size={17} />
                </div>
                <div className="bg-surface border border-border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-xs text-muted shadow-sm">
                  <RefreshCw size={13} className="animate-spin text-amber-500" />
                  <span>Synthesizing response with isolated tenant grounding...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          {suggestedPrompts.length > 0 && (
            <div className="px-4 py-2.5 bg-background border-t border-border flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs text-muted font-medium shrink-0">Quick Prompts:</span>
              {suggestedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  className="shrink-0 text-xs bg-surface hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border border-border rounded-full px-3 py-1 text-muted transition-colors whitespace-nowrap"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-4 bg-surface border-t border-border flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about your General Ledger, AP/AR aging, stocktake audits, or POS terminal..."
              disabled={loading}
              className="flex-1 bg-background border border-border focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <span>Send</span>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Custom Knowledge Base */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Custom Tenant Knowledge Documents</h3>
              <p className="text-xs text-muted mt-0.5">
                Add store-specific FAQs, refund guidelines, and internal SOPs. The RAG pipeline will automatically index these for your tenant only.
              </p>
            </div>
            <button
              onClick={() => setIsAddDocOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Plus size={15} />
              <span>Add Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customDocs.map((doc) => (
              <div key={doc.id} className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {doc.category}
                    </span>
                    <h4 className="font-bold text-sm text-foreground mt-1.5">{doc.title}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-1.5 text-muted hover:text-red-500 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <p className="text-xs text-muted line-clamp-3 whitespace-pre-wrap">
                  {doc.content}
                </p>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {doc.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] bg-background border border-border px-2 py-0.5 rounded text-muted">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {customDocs.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-surface border border-dashed border-border rounded-2xl p-6 text-muted">
                <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold text-foreground">No custom knowledge documents added yet</p>
                <p className="text-xs mt-1">Universal platform documentation is already indexed for standard POS & ERP operations.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Document */}
      {isAddDocOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground">Add Custom Knowledge Chunk</h3>
              <button onClick={() => setIsAddDocOpen(false)} className="p-1.5 text-muted hover:text-foreground">
                <Trash2 size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCustomDoc} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Colombo Store Weekend Return Policy"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="GENERAL">General Policy</option>
                  <option value="POS_OPERATIONS">POS & Billing</option>
                  <option value="ERP_ACCOUNTING">Accounting & Finance</option>
                  <option value="INVENTORY">Inventory & Stocktaking</option>
                  <option value="CRM">Customer & Loyalty</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Content / Guidelines *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide detailed instructions or policy text for the AI RAG index..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. returns, weekend, colombo, refund"
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted hover:text-foreground text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  {savingDoc ? "Indexing..." : "Save & Index into RAG"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

