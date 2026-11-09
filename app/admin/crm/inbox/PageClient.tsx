"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  User,
  CreditCard,
  FileText,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  Bot,
  CheckCheck,
  Clock,
  RefreshCw,
  QrCode,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle
} from "lucide-react";
import { customerService } from "@/services/customer.service";
import { toast } from "@/store/toast.store";

interface Thread {
  phone: string;
  customerId?: string;
  customerName?: string;
  senderName: string;
  customerType?: string;
  lastMessage: string;
  lastDirection: "INBOUND" | "OUTBOUND";
  lastStatus: string;
  lastTimestamp: string;
  messageCount: number;
  unreadCount: number;
  creditBalance?: number;
}

interface Message {
  id: string;
  phone: string;
  direction: "INBOUND" | "OUTBOUND";
  senderName?: string;
  messageType: string;
  content: string;
  status: string;
  metadata?: any;
  createdAt: string;
}

interface CustomerDossier {
  customer: {
    id: string | null;
    name: string;
    phone: string;
    email: string;
    customerType: string;
    creditLimit: number;
    creditBalance: number;
    loyaltyPoints: number;
    loyaltyTier: string;
    totalSpent: number;
    totalOrders: number;
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      total: number;
      status: string;
      paymentStatus: string;
      createdAt: string;
    }>;
  };
}

export default function PageClient() {
  const router = useRouter();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [activeThreadData, setActiveThreadData] = useState<{
    phone: string;
    messages: Message[];
    dossier: CustomerDossier;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load threads on mount
  useEffect(() => {
    loadThreads();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThreadData?.messages]);

  const loadThreads = async () => {
    try {
      setIsLoadingThreads(true);
      const res = await customerService.getInboxThreads();
      const threadList: Thread[] = res?.data || [];
      setThreads(threadList);

      if (threadList.length > 0 && !selectedPhone) {
        setSelectedPhone(threadList[0].phone);
        loadThreadMessages(threadList[0].phone);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load conversation threads");
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const loadThreadMessages = async (phone: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await customerService.getThreadMessages(phone);
      if (res?.data) {
        setActiveThreadData(res.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectThread = (phone: string) => {
    setSelectedPhone(phone);
    loadThreadMessages(phone);
  };

  const handleSendReply = async (actionType?: string, customText?: string) => {
    if (!selectedPhone) return;

    const textToSend = customText || replyText;
    if (!actionType && (!textToSend || !textToSend.trim())) {
      toast.error("Please enter a message reply");
      return;
    }

    try {
      setIsSending(true);
      await customerService.sendInboxReply(selectedPhone, textToSend, actionType);
      toast.success("WhatsApp message dispatched!");
      setReplyText("");
      // Reload active conversation
      await loadThreadMessages(selectedPhone);
      // Reload threads list to update last message preview
      const res = await customerService.getInboxThreads();
      if (res?.data) setThreads(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to dispatch WhatsApp reply");
    } finally {
      setIsSending(false);
    }
  };

  const filteredThreads = threads.filter(
    (t) =>
      (t.customerName || t.senderName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery) ||
      (t.lastMessage || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-3.5 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-500/10">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-foreground font-poppins">WhatsApp CRM Inbox & Sales</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Meta Graph API
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Conversational commerce, automated AI customer care, instant LankaQR payment links, and CRM 360 dossiers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadThreads}
            disabled={isLoadingThreads}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface/80 text-xs font-medium text-foreground transition-all"
            title="Refresh Threads"
          >
            <RefreshCw size={13} className={isLoadingThreads ? "animate-spin text-emerald-500" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Main 3-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Conversation Threads List */}
        <div className="w-80 lg:w-96 border-r border-border bg-surface/30 flex flex-col shrink-0">
          {/* Thread Search Box */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by customer, phone, or chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Threads Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {isLoadingThreads ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <RefreshCw size={18} className="animate-spin text-emerald-500" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <MessageSquare size={24} className="text-muted-foreground/40" />
                <span>No conversation threads found.</span>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = selectedPhone === t.phone;
                return (
                  <button
                    key={t.phone}
                    data-testid={`crm-thread-${t.phone}`}
                    onClick={() => handleSelectThread(t.phone)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 hover:bg-surface/80 ${
                      isSelected
                        ? "bg-emerald-500/10 border-l-4 border-l-emerald-500"
                        : "border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-xs text-foreground font-poppins">
                        {(t.customerName || t.senderName || "C").charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {t.customerName || t.senderName}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(t.lastTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="font-mono text-[11px] text-muted-foreground">{t.phone}</span>
                        {t.customerType && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary/10 text-primary">
                            {t.customerType}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        {t.lastDirection === "OUTBOUND" ? "You: " : ""}
                        {t.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Pane 2: Live Chat & Reply Composer */}
        <div className="flex-1 flex flex-col bg-background/50 overflow-hidden" data-testid="crm-chat-pane">
          {activeThreadData ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-3 border-b border-border bg-surface/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-500 text-sm">
                    {activeThreadData.dossier.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-foreground">
                        {activeThreadData.dossier.customer.name}
                      </h2>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {activeThreadData.dossier.customer.customerType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone size={11} className="text-emerald-500" />
                      <span className="font-mono">{activeThreadData.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push("/pos")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                  >
                    <ShoppingBag size={13} />
                    <span>Launch POS</span>
                  </button>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {isLoadingMessages ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    <RefreshCw size={18} className="animate-spin text-emerald-500 mr-2" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : activeThreadData.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
                    <MessageSquare size={32} className="text-muted-foreground/30 mb-2" />
                    <span>No messages recorded in this conversation yet.</span>
                  </div>
                ) : (
                  activeThreadData.messages.map((m) => {
                    const isInbound = m.direction === "INBOUND";
                    const isAiReply = (m.senderName || "").includes("System") || (m.content || "").includes("AI Copilot");

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {isInbound ? (
                            <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                              <User size={10} />
                              {m.senderName || "Customer"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                              {isAiReply ? <Bot size={10} /> : <ShieldCheck size={10} />}
                              {m.senderName || "Store Agent"}
                            </span>
                          )}
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div
                          className={`max-w-xl rounded-2xl p-3.5 text-xs shadow-sm ${
                            isInbound
                              ? "bg-surface border border-border text-foreground rounded-tl-sm"
                              : "bg-emerald-600 text-white rounded-tr-sm"
                          }`}
                        >
                          <p className="whitespace-pre-line leading-relaxed">{m.content}</p>

                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                              isInbound ? "text-muted-foreground" : "text-emerald-100"
                            }`}
                          >
                            <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                            {!isInbound && <CheckCheck size={12} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions Bar */}
              <div className="px-6 py-2 border-t border-border bg-surface/40 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" /> Quick Dispatches:
                </span>

                <button
                  data-testid="crm-quick-lankaqr-btn"
                  onClick={() => handleSendReply("lankaqr")}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all shrink-0"
                >
                  <QrCode size={12} />
                  <span>Send LankaQR Link</span>
                </button>

                <button
                  data-testid="crm-quick-statement-btn"
                  onClick={() => handleSendReply("statement")}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-all shrink-0"
                >
                  <FileText size={12} />
                  <span>Send AR Statement</span>
                </button>

                <button
                  data-testid="crm-quick-catalog-btn"
                  onClick={() => handleSendReply("catalog")}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all shrink-0"
                >
                  <ShoppingBag size={12} />
                  <span>Send Catalog Storefront</span>
                </button>
              </div>

              {/* Message Composer Box */}
              <div className="p-4 border-t border-border bg-surface/70">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendReply();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    data-testid="crm-reply-input"
                    placeholder={`Reply to ${activeThreadData.dossier.customer.name} via WhatsApp...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={isSending}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500 text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    data-testid="crm-send-reply-btn"
                    disabled={isSending || !replyText.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Send size={14} className={isSending ? "animate-spin" : ""} />
                    <span>{isSending ? "Sending..." : "Send"}</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs p-8 text-center">
              <MessageSquare size={48} className="text-muted-foreground/20 mb-3" />
              <h3 className="font-bold text-sm text-foreground mb-1">Select a Conversation</h3>
              <p className="max-w-xs text-muted-foreground">
                Choose a customer thread from the left sidebar to inspect live chats, dispatch LankaQR links, and review customer dossiers.
              </p>
            </div>
          )}
        </div>

        {/* Pane 3: Customer 360 Dossier & Intelligence Card */}
        {activeThreadData && (
          <div
            className="w-80 lg:w-96 border-l border-border bg-surface/30 p-5 overflow-y-auto shrink-0 space-y-4"
            data-testid="crm-dossier-card"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground font-poppins">
                  Customer 360 Dossier
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                  {activeThreadData.dossier.customer.customerType}
                </span>
              </div>

              {/* Profile Card */}
              <div className="p-4 rounded-xl border border-border bg-surface/60 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-base flex items-center justify-center shadow-md">
                    {activeThreadData.dossier.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {activeThreadData.dossier.customer.name}
                    </h4>
                    <p className="font-mono text-xs text-muted-foreground">{activeThreadData.phone}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{activeThreadData.dossier.customer.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border border-border bg-surface/50">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] mb-1 font-semibold uppercase">
                  <TrendingUp size={12} className="text-emerald-500" /> Lifetime Value
                </div>
                <div className="font-bold text-sm text-foreground font-mono">
                  Rs. {Number(activeThreadData.dossier.customer.totalSpent || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {activeThreadData.dossier.customer.totalOrders} total orders
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border bg-surface/50">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] mb-1 font-semibold uppercase">
                  <Award size={12} className="text-amber-500" /> Loyalty Tier
                </div>
                <div className="font-bold text-sm text-amber-500 font-mono">
                  {activeThreadData.dossier.customer.loyaltyTier}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {activeThreadData.dossier.customer.loyaltyPoints} points available
                </div>
              </div>

              <div className="col-span-2 p-3 rounded-xl border border-border bg-surface/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold uppercase mb-0.5">
                    <CreditCard size={12} className="text-blue-500" /> Credit & Aging Balance
                  </div>
                  <div className="font-bold text-sm font-mono text-foreground">
                    Rs. {Number(activeThreadData.dossier.customer.creditBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">Credit Limit</div>
                  <div className="font-mono text-xs font-semibold text-muted-foreground">
                    Rs. {Number(activeThreadData.dossier.customer.creditLimit || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Ledger */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Recent Orders</h4>
                <span className="text-[10px] text-muted-foreground">Last {activeThreadData.dossier.customer.recentOrders.length}</span>
              </div>

              <div className="space-y-2">
                {activeThreadData.dossier.customer.recentOrders.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    No orders placed yet.
                  </div>
                ) : (
                  activeThreadData.dossier.customer.recentOrders.map((o) => (
                    <div
                      key={o.id}
                      className="p-2.5 rounded-lg border border-border bg-surface/40 flex items-center justify-between hover:bg-surface/70 transition-all text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-foreground">{o.orderNumber}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-foreground">
                          Rs. {Number(o.total).toLocaleString()}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            o.paymentStatus === "PAID"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
