"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  SupportTicketService,
  SupportTicketItem,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/services/support-ticket.service";
import { toast } from "@/store/toast.store";
import { useAuthStore } from "@/store/auth.store";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Building2,
  User,
  Star,
  ChevronRight,
  X,
  MessageSquare,
  ShieldAlert,
  Terminal,
  Paperclip,
  Check,
  RotateCcw,
} from "lucide-react";

export default function SupportPageClient() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New Ticket Modal State
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState<TicketCategory>("GENERAL_INQUIRY");
  const [newPriority, setNewPriority] = useState<TicketPriority>("MEDIUM");
  const [newDescription, setNewDescription] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Reply State
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // CSAT State
  const [csatRating, setCsatRating] = useState(5);
  const [csatFeedback, setCsatFeedback] = useState("");
  const [submittingCsat, setSubmittingCsat] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SupportTicketService.getTenantTickets({
        search: searchQuery || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        page,
        limit: 15,
      });
      setTickets(res.tickets);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      toast.error(err.message || "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openTicketDrawer = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const detail = await SupportTicketService.getTenantTicketDetail(ticketId);
      setSelectedTicket(detail);
      setReplyContent("");
      setCsatRating(5);
      setCsatFeedback("");
    } catch (err: any) {
      toast.error(err.message || "Could not load ticket details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error("Please fill in both subject and description");
      return;
    }

    setCreatingTicket(true);
    try {
      // Auto-bundle diagnostic snapshot
      const telemetry = {
        route: window.location.pathname,
        device: {
          userAgent: window.navigator.userAgent,
          screenResolution: `${window.innerWidth}x${window.innerHeight}`,
          online: window.navigator.onLine,
        },
      };

      const res = await SupportTicketService.createTenantTicket({
        subject: newSubject.trim(),
        description: newDescription.trim(),
        category: newCategory,
        priority: newPriority,
        sourceRoute: window.location.pathname,
        posMetadata: telemetry,
      });

      toast.success(res.message || "Ticket opened successfully");
      setIsNewTicketOpen(false);
      setNewSubject("");
      setNewDescription("");
      setNewCategory("GENERAL_INQUIRY");
      setNewPriority("MEDIUM");
      fetchTickets();
      openTicketDrawer(res.data.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit ticket");
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;
    setSendingReply(true);
    try {
      await SupportTicketService.addTenantMessage(selectedTicket.id, replyContent.trim());
      toast.success("Reply dispatched to support team");
      setReplyContent("");
      const detail = await SupportTicketService.getTenantTicketDetail(selectedTicket.id);
      setSelectedTicket(detail);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!selectedTicket) return;
    try {
      await SupportTicketService.updateTenantStatus(selectedTicket.id, "RESOLVED");
      toast.success("Ticket marked as resolved");
      const detail = await SupportTicketService.getTenantTicketDetail(selectedTicket.id);
      setSelectedTicket(detail);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to update ticket");
    }
  };

  const handleReopen = async () => {
    if (!selectedTicket) return;
    try {
      await SupportTicketService.updateTenantStatus(selectedTicket.id, "IN_PROGRESS", "Customer reopened the ticket");
      toast.success("Ticket reopened");
      const detail = await SupportTicketService.getTenantTicketDetail(selectedTicket.id);
      setSelectedTicket(detail);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to reopen ticket");
    }
  };

  const handleSubmitCsat = async () => {
    if (!selectedTicket) return;
    setSubmittingCsat(true);
    try {
      await SupportTicketService.submitCsat(selectedTicket.id, csatRating, csatFeedback.trim() || undefined);
      toast.success("Thank you for your rating!");
      const detail = await SupportTicketService.getTenantTicketDetail(selectedTicket.id);
      setSelectedTicket(detail);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmittingCsat(false);
    }
  };

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case "CRITICAL_URGENT":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 uppercase tracking-wider">
            Critical
          </span>
        );
      case "HIGH":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
            High
          </span>
        );
      case "MEDIUM":
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary-soft text-primary border border-primary/30 uppercase tracking-wider">
            Medium
          </span>
        );
      case "LOW":
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface-elevated text-muted border border-border uppercase tracking-wider">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case "OPEN":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">OPEN</span>;
      case "IN_PROGRESS":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">IN PROGRESS</span>;
      case "WAITING_ON_CUSTOMER":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">ACTION NEEDED</span>;
      case "RESOLVED":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">RESOLVED</span>;
      case "CLOSED":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-elevated text-muted border border-border">CLOSED</span>;
    }
  };

  const openTicketsCount = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const actionNeededCount = tickets.filter((t) => t.status === "WAITING_ON_CUSTOMER").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft border border-primary/30 flex items-center justify-center text-primary shadow-sm">
            <LifeBuoy size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Support & Helpdesk</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/20">
                DIRECT SAAS ENGINEERING
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Report POS, printer, hardware, or inventory issues with automated diagnostic telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-md shadow-primary/20 self-start sm:self-auto"
        >
          <Plus size={15} />
          Open Support Ticket
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-muted font-medium">Active Support Tickets</span>
            <div className="text-2xl font-black text-foreground font-mono mt-0.5">{openTicketsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold">
            <LifeBuoy size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-amber-500/20 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Action Needed (Waiting on You)</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">{actionNeededCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-emerald-500/20 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Resolved Issues</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{resolvedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search tickets by subject or #..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-elevated border border-border text-xs text-foreground placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-surface-elevated border border-border text-foreground font-medium focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CUSTOMER">Action Needed</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-surface-elevated border border-border text-foreground font-medium focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Categories</option>
            <option value="HARDWARE_PERIPHERAL">Hardware (Printer, Pole, Scale)</option>
            <option value="POS_REGISTER">POS & Register</option>
            <option value="ERP_INVENTORY">ERP & Batches</option>
            <option value="CRM_COMMERCE">CRM & WhatsApp</option>
            <option value="BILLING_SUBSCRIPTION">Billing & Plan</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
          </select>

          <button
            onClick={fetchTickets}
            className="p-2 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-muted hover:text-foreground transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-2xl bg-surface border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated text-muted uppercase tracking-wider font-mono text-[10px] border-b border-border">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-primary" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted">
                    No support tickets found. Click "Open Support Ticket" if you need assistance.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openTicketDrawer(t.id)}
                    className="hover:bg-surface-elevated cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">#{t.ticketNumber}</span>
                        {t.posMetadata && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono">
                            DIAG-LOG
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-foreground truncate max-w-[320px] mt-0.5">{t.subject}</div>
                      <div className="text-[11px] text-muted truncate max-w-[320px]">{t.description}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-muted">
                      {t.category.replace(/_/g, " ")}
                    </td>

                    <td className="py-3.5 px-4">{getPriorityBadge(t.priority)}</td>

                    <td className="py-3.5 px-4">{getStatusBadge(t.status)}</td>

                    <td className="py-3.5 px-4 text-muted font-mono text-[11px]">
                      {new Date(t.updatedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTicketDrawer(t.id);
                        }}
                        className="px-3 py-1 rounded-lg bg-surface-elevated hover:bg-primary hover:text-white text-foreground font-medium transition-colors border border-border"
                      >
                        View Thread
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Conversation Drawer Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-4xl h-[86vh] shadow-2xl flex flex-col overflow-hidden text-foreground">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface-elevated shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-soft border border-primary/30 flex items-center justify-center text-primary font-mono font-bold">
                  #{selectedTicket.ticketNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">{selectedTicket.subject}</h3>
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <div className="text-xs text-muted mt-0.5 flex items-center gap-2">
                    <span>Category: <strong>{selectedTicket.category.replace(/_/g, " ")}</strong></span>
                    <span>•</span>
                    <span>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" && (
                  <button
                    onClick={handleMarkResolved}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                  >
                    <Check size={13} />
                    Mark Resolved
                  </button>
                )}

                {selectedTicket.status === "RESOLVED" && (
                  <button
                    onClick={handleReopen}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    Reopen Ticket
                  </button>
                )}

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background custom-scrollbar">
              {/* CSAT Rating Prompt if Resolved */}
              {selectedTicket.status === "RESOLVED" && !selectedTicket.csatRating && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <CheckCircle2 size={16} />
                    <span>This ticket has been marked as resolved! How satisfied are you with our assistance?</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setCsatRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={24}
                          className={star <= csatRating ? "fill-amber-400 text-amber-400" : "text-muted"}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-foreground ml-2 font-mono">{csatRating} of 5 Stars</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={csatFeedback}
                      onChange={(e) => setCsatFeedback(e.target.value)}
                      placeholder="Optional feedback or comment..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleSubmitCsat}
                      disabled={submittingCsat}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
                    >
                      {submittingCsat ? "Submitting..." : "Submit CSAT"}
                    </button>
                  </div>
                </div>
              )}

              {/* Messages List */}
              {selectedTicket.messages?.map((m) => {
                const isAgent = m.senderType === "SUPERADMIN_AGENT";

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl text-xs space-y-1.5 border transition-all ${
                      isAgent
                        ? "bg-primary-soft/40 border-primary/30 text-foreground ml-6"
                        : "bg-surface border-border text-foreground mr-6 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <strong className="text-foreground">{m.sender?.name || m.sender?.email || "Support"}</strong>
                        {isAgent ? (
                          <span className="px-1.5 py-0.2 rounded bg-primary text-white font-bold text-[9px]">
                            SAAS ENGINEER
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-surface-elevated text-muted font-bold text-[9px]">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-muted">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            {selectedTicket.status !== "CLOSED" && (
              <div className="p-4 border-t border-border bg-surface shrink-0 space-y-2">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your response to the support team..."
                    className="w-full p-3 rounded-2xl bg-surface-elevated border border-border text-xs text-foreground placeholder-muted focus:outline-none focus:border-primary"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-muted font-mono">
                      Target resolution SLA: {new Date(selectedTicket.resolutionDueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyContent.trim()}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-50"
                    >
                      {sendingReply ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-150">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-lg shadow-2xl p-6 text-foreground space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold">
                  <LifeBuoy size={18} />
                </div>
                <h3 className="font-bold text-base text-foreground">Open Support Ticket</h3>
              </div>
              <button
                onClick={() => setIsNewTicketOpen(false)}
                className="p-1.5 text-muted hover:text-foreground rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted block">Issue Subject *</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Thermal printer not kicking drawer or pole display blank"
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border text-foreground font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full px-2.5 py-2 rounded-xl bg-surface-elevated border border-border text-foreground font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="HARDWARE_PERIPHERAL">Hardware (Printer, Pole, Scale)</option>
                    <option value="POS_REGISTER">POS & Checkout</option>
                    <option value="ERP_INVENTORY">ERP & Batches</option>
                    <option value="CRM_COMMERCE">CRM & Loyalty</option>
                    <option value="BILLING_SUBSCRIPTION">Billing & Plan</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="GENERAL_INQUIRY">General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted block">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full px-2.5 py-2 rounded-xl bg-surface-elevated border border-border text-foreground font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="CRITICAL_URGENT">Critical (Checkout down - 30m SLA)</option>
                    <option value="HIGH">High (2h SLA)</option>
                    <option value="MEDIUM">Medium (6h SLA)</option>
                    <option value="LOW">Low (12h SLA)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted block">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe what occurred, any error messages displayed, and steps to reproduce..."
                  className="w-full p-3 rounded-xl bg-surface-elevated border border-border text-foreground placeholder-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 rounded-xl bg-primary-soft/30 border border-primary/20 text-[11px] text-muted">
                ⚡ <strong>Automated Diagnostic Telemetry:</strong> Device specs and browser environment will be automatically packaged with this ticket to speed up resolution.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface text-foreground font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-all flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {creatingTicket ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
