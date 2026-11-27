"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  SupportTicketService,
  SupportTicketItem,
  HelpdeskMetrics,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  CannedResponseItem,
} from "@/services/support-ticket.service";
import { superAdminService } from "@/services/superadmin.service";
import { toast } from "@/store/toast.store";
import { globalDialog } from "@/store/dialog.store";
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Send,
  Building2,
  ExternalLink,
  User,
  Sliders,
  Sparkles,
  Paperclip,
  Star,
  Tv,
  Printer,
  Scale,
  Terminal,
  Activity,
  Layers,
  ChevronRight,
  X,
  Plus,
} from "lucide-react";

export default function SuperAdminSupportHelpdesk() {
  const [metrics, setMetrics] = useState<HelpdeskMetrics | null>(null);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [cannedResponses, setCannedResponses] = useState<CannedResponseItem[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [slaBreachedOnly, setSlaBreachedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Message Composer State
  const [replyContent, setReplyContent] = useState("");
  const [isInternalWhisper, setIsInternalWhisper] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await SupportTicketService.getHelpdeskMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.warn("Error fetching helpdesk metrics:", err);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SupportTicketService.getSuperadminTickets({
        search: searchQuery || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        slaBreached: slaBreachedOnly || undefined,
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
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter, slaBreachedOnly, page]);

  const fetchCanned = useCallback(async () => {
    try {
      const data = await SupportTicketService.getCannedResponses();
      setCannedResponses(data);
    } catch (err: any) {
      console.warn("Error loading canned responses:", err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchCanned();
  }, [fetchMetrics, fetchCanned]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openTicketDrawer = async (ticketId: string) => {
    setTicketDetailLoading(true);
    try {
      const detail = await SupportTicketService.getSuperadminTicketDetail(ticketId);
      setSelectedTicket(detail);
      setReplyContent("");
      setIsInternalWhisper(false);
    } catch (err: any) {
      toast.error(err.message || "Could not load ticket dossier");
    } finally {
      setTicketDetailLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;
    setSendingReply(true);
    try {
      const msg = await SupportTicketService.addSuperadminMessage(
        selectedTicket.id,
        replyContent.trim(),
        isInternalWhisper
      );
      toast.success(isInternalWhisper ? "Whisper note logged (Hidden from tenant)" : "Reply sent to customer");
      setReplyContent("");

      // Refresh ticket detail
      const detail = await SupportTicketService.getSuperadminTicketDetail(selectedTicket.id);
      setSelectedTicket(detail);
      fetchTickets();
      fetchMetrics();
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch message");
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    try {
      await SupportTicketService.updateSuperadminStatus(selectedTicket.id, newStatus);
      toast.success(`Ticket marked as ${newStatus}`);
      const detail = await SupportTicketService.getSuperadminTicketDetail(selectedTicket.id);
      setSelectedTicket(detail);
      fetchTickets();
      fetchMetrics();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleUpdatePriority = async (newPriority: TicketPriority) => {
    if (!selectedTicket) return;
    try {
      await SupportTicketService.updatePriority(selectedTicket.id, newPriority);
      toast.success(`Priority updated to ${newPriority}`);
      const detail = await SupportTicketService.getSuperadminTicketDetail(selectedTicket.id);
      setSelectedTicket(detail);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to update priority");
    }
  };

  const handleImpersonateTenant = async () => {
    if (!selectedTicket?.tenantId) return;
    setImpersonating(true);
    try {
      await superAdminService.impersonateTenant(selectedTicket.tenantId);
      toast.success(`Switched session to ${selectedTicket.tenant?.name || "Tenant"}`);
      window.location.href = "/pos";
    } catch (err: any) {
      toast.error(err.message || "Could not impersonate tenant");
    } finally {
      setImpersonating(false);
    }
  };

  const insertCannedResponse = (content: string) => {
    setReplyContent((prev) => (prev ? `${prev}\n\n${content}` : content));
  };

  const formatSlaTimer = (ticket: SupportTicketItem) => {
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      return (
        <span className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1">
          <CheckCircle2 size={12} /> Resolved
        </span>
      );
    }

    if (ticket.slaFirstResponseBreached || ticket.slaResolutionBreached) {
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold flex items-center gap-1 border border-rose-500/30 animate-pulse">
          <AlertTriangle size={11} /> SLA BREACHED
        </span>
      );
    }

    const due = new Date(ticket.firstRespondedAt ? ticket.resolutionDueAt : ticket.firstResponseDueAt);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();

    if (diffMs <= 0) {
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30">
          Due Now
        </span>
      );
    }

    const mins = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(mins / 60);

    return (
      <span className="text-xs text-amber-400 font-mono flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
        <Clock size={11} />
        {hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`} left
      </span>
    );
  };

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case "CRITICAL_URGENT":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Critical
          </span>
        );
      case "HIGH":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
            High
          </span>
        );
      case "MEDIUM":
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
            Medium
          </span>
        );
      case "LOW":
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-700/40 text-zinc-400 border border-zinc-600/30 uppercase tracking-wider">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case "OPEN":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">OPEN</span>;
      case "IN_PROGRESS":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">IN PROGRESS</span>;
      case "WAITING_ON_CUSTOMER":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">WAITING CUSTOMER</span>;
      case "RESOLVED":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">RESOLVED</span>;
      case "CLOSED":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">CLOSED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0D0F12] border border-[#1C2025] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-inner">
            <LifeBuoy size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">SaaS Support & Helpdesk Triage</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                MULTI-TENANT SLA
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live customer issue resolution, internal whisper notes, and automated hardware diagnostics telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchMetrics();
            fetchTickets();
          }}
          className="px-3.5 py-2 rounded-xl bg-[#14171B] hover:bg-[#1A1E24] border border-[#22272E] text-xs font-semibold text-zinc-200 transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh Triage
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[#0D0F12] border border-[#1C2025] space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Tickets</span>
          <div className="text-2xl font-black text-white font-mono">{metrics?.totalCount ?? 0}</div>
          <span className="text-[10px] text-zinc-500 block">All-time across SaaS</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D0F12] border border-rose-500/20 space-y-1">
          <span className="text-[11px] font-medium text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Open Queue
          </span>
          <div className="text-2xl font-black text-rose-300 font-mono">{metrics?.openCount ?? 0}</div>
          <span className="text-[10px] text-rose-400/70 block">Awaiting engineer triage</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D0F12] border border-cyan-500/20 space-y-1">
          <span className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">In Progress</span>
          <div className="text-2xl font-black text-cyan-300 font-mono">{metrics?.inProgressCount ?? 0}</div>
          <span className="text-[10px] text-cyan-400/70 block">Under investigation</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D0F12] border border-emerald-500/20 space-y-1">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Resolved</span>
          <div className="text-2xl font-black text-emerald-300 font-mono">{metrics?.resolvedCount ?? 0}</div>
          <span className="text-[10px] text-emerald-400/70 block">Successfully fixed</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D0F12] border border-amber-500/20 space-y-1">
          <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">SLA Adherence</span>
          <div className="text-2xl font-black text-amber-300 font-mono">{metrics?.adherenceRate ?? 100}%</div>
          <span className="text-[10px] text-amber-400/70 block">{metrics?.breachedCount ?? 0} tickets breached</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D0F12] border border-violet-500/20 space-y-1">
          <span className="text-[11px] font-medium text-violet-400 uppercase tracking-wider flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" /> CSAT Score
          </span>
          <div className="text-2xl font-black text-white font-mono">{metrics?.avgCsat ?? 5.0} / 5.0</div>
          <span className="text-[10px] text-violet-400/70 block">From {metrics?.csatResponsesCount ?? 0} reviews</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0D0F12] border border-[#1C2025] flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ticket #, subject, or tenant..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#14171B] border border-[#22272E] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Tabs */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-[#14171B] border border-[#22272E] text-zinc-300 font-medium focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-[#14171B] border border-[#22272E] text-zinc-300 font-medium focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL_URGENT">Critical / Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-[#14171B] border border-[#22272E] text-zinc-300 font-medium focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Categories</option>
            <option value="HARDWARE_PERIPHERAL">Hardware (Printers, Pole, Scales)</option>
            <option value="POS_REGISTER">POS & Register</option>
            <option value="ERP_INVENTORY">ERP & Inventory</option>
            <option value="CRM_COMMERCE">CRM & WhatsApp</option>
            <option value="BILLING_SUBSCRIPTION">Billing & Subscription</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
          </select>

          {/* SLA Breached Toggle */}
          <button
            onClick={() => {
              setSlaBreachedOnly(!slaBreachedOnly);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
              slaBreachedOnly
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-[#14171B] text-zinc-400 border-[#22272E] hover:text-white"
            }`}
          >
            <AlertTriangle size={12} className={slaBreachedOnly ? "text-rose-400" : "text-zinc-500"} />
            SLA Breached
          </button>
        </div>
      </div>

      {/* Tickets Triage Table */}
      <div className="rounded-2xl bg-[#0D0F12] border border-[#1C2025] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121418] text-zinc-400 uppercase tracking-wider font-mono text-[10px] border-b border-[#1C2025]">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Tenant / Outlet</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">SLA Countdown</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2025] text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-violet-400" />
                    Loading cross-tenant support queue...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    No support tickets found matching active criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openTicketDrawer(t.id)}
                    className="hover:bg-[#14171B] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-violet-400">#{t.ticketNumber}</span>
                        {t.posMetadata && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono"
                            title="Hardware telemetry captured"
                          >
                            POS-LOG
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-white truncate max-w-[260px] mt-0.5">{t.subject}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[260px]">{t.description}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Building2 size={13} className="text-zinc-500" />
                        <span>{t.tenant?.name || "Merchant"}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {t.branch?.name ? `${t.branch.name} • ` : ""}
                        <span className="text-violet-400 font-semibold">{t.tenant?.subscriptionTier}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                      {t.category.replace(/_/g, " ")}
                    </td>

                    <td className="py-3 px-4">{getPriorityBadge(t.priority)}</td>

                    <td className="py-3 px-4">{formatSlaTimer(t)}</td>

                    <td className="py-3 px-4">{getStatusBadge(t.status)}</td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTicketDrawer(t.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#181B20] hover:bg-violet-600 hover:text-white text-zinc-300 font-medium transition-colors border border-[#262C34]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#1C2025] flex items-center justify-between text-xs text-zinc-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded bg-[#14171B] hover:bg-[#1A1E24] disabled:opacity-40 text-white font-medium"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded bg-[#14171B] hover:bg-[#1A1E24] disabled:opacity-40 text-white font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail & Triage Drawer Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#0B0D10] border border-[#1C2025] rounded-3xl w-full max-w-5xl h-[88vh] shadow-2xl flex flex-col overflow-hidden text-zinc-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#1C2025] flex items-center justify-between bg-[#0E1014] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 font-mono font-bold">
                  #{selectedTicket.ticketNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{selectedTicket.subject}</h3>
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                    <span>Tenant: <strong className="text-white">{selectedTicket.tenant?.name}</strong></span>
                    <span>•</span>
                    <span>Opened by: <strong className="text-white">{selectedTicket.createdBy?.name || selectedTicket.createdBy?.email}</strong></span>
                    <span>•</span>
                    <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-[#181B20] rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Drawer Body (2 Columns) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Timeline & Conversation */}
              <div className="flex-1 flex flex-col border-r border-[#1C2025] overflow-hidden bg-[#0A0B0E]">
                {/* Telemetry Snapshot Banner (if captured) */}
                {selectedTicket.posMetadata && (
                  <div className="p-3 mx-4 mt-4 rounded-xl bg-[#12151B] border border-cyan-500/30 text-xs text-zinc-300 space-y-2">
                    <div className="flex items-center justify-between text-cyan-400 font-bold font-mono">
                      <span className="flex items-center gap-1.5">
                        <Terminal size={14} /> Hardware Diagnostics Telemetry
                      </span>
                      <span>Route: {selectedTicket.sourceRoute || "/pos"}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                      <div className="p-1.5 rounded bg-[#090A0D] border border-[#1A1E24]">
                        <span className="text-zinc-500 block">Thermal Bridge</span>
                        <span className={selectedTicket.posMetadata.hardware?.thermalBridge?.status === "ONLINE" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {selectedTicket.posMetadata.hardware?.thermalBridge?.status || "OFFLINE"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-[#090A0D] border border-[#1A1E24]">
                        <span className="text-zinc-500 block">Pole Display</span>
                        <span className="text-zinc-200">
                          {selectedTicket.posMetadata.hardware?.poleDisplay?.baudRate || 2400} bps ({selectedTicket.posMetadata.hardware?.poleDisplay?.protocol || "ESC Q A"})
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-[#090A0D] border border-[#1A1E24]">
                        <span className="text-zinc-500 block">Cashier / Session</span>
                        <span className="text-zinc-200 truncate block">
                          {selectedTicket.posMetadata.cashierName || selectedTicket.posMetadata.posSessionId || "N/A"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-[#090A0D] border border-[#1A1E24]">
                        <span className="text-zinc-500 block">OS / Browser</span>
                        <span className="text-zinc-200 truncate block">
                          {selectedTicket.posMetadata.device?.os || "Windows"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages Timeline */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                  {selectedTicket.messages?.map((m) => {
                    const isSuperadminSender = m.senderType === "SUPERADMIN_AGENT";
                    const isWhisper = m.isInternal;

                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl text-xs space-y-1.5 border transition-all ${
                          isWhisper
                            ? "bg-amber-950/20 border-amber-500/40 text-amber-100 ml-4"
                            : isSuperadminSender
                            ? "bg-violet-950/20 border-violet-500/30 text-zinc-100 ml-6"
                            : "bg-[#14171C] border-[#22272E] text-zinc-200 mr-6"
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              {m.sender?.name || m.sender?.email || "Support Agent"}
                            </span>
                            {isWhisper ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-bold flex items-center gap-1 border border-amber-500/40">
                                <Lock size={9} /> INTERNAL WHISPER NOTE
                              </span>
                            ) : isSuperadminSender ? (
                              <span className="px-1.5 py-0.2 rounded bg-violet-500/30 text-violet-300 font-bold">
                                SAAS AGENT REPLY
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-zinc-700/50 text-zinc-300">
                                CUSTOMER
                              </span>
                            )}
                          </div>
                          <span className="text-zinc-500">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Dual-Mode Composer */}
                <div className="p-4 border-t border-[#1C2025] bg-[#0E1014] space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-[#14171B] p-1 rounded-xl border border-[#22272E]">
                      <button
                        onClick={() => setIsInternalWhisper(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          !isInternalWhisper
                            ? "bg-violet-600 text-white shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Send size={12} />
                        Public Customer Reply
                      </button>

                      <button
                        onClick={() => setIsInternalWhisper(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isInternalWhisper
                            ? "bg-amber-600 text-white shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Lock size={12} />
                        Whisper Note 🔒
                      </button>
                    </div>

                    {/* Macro / Canned Response Picker */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-zinc-500">Macros:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            insertCannedResponse(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="bg-[#14171B] border border-[#22272E] rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
                      >
                        <option value="">Insert Macro...</option>
                        {cannedResponses.map((c) => (
                          <option key={c.id} value={c.content}>
                            {c.shortcutCode} - {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={
                        isInternalWhisper
                          ? "Write an internal whisper note (visible ONLY to Superadmin engineers)..."
                          : "Type your public reply to the merchant cashier/admin..."
                      }
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all ${
                        isInternalWhisper
                          ? "bg-amber-950/10 border-amber-500/30 text-amber-100 placeholder-amber-400/40 focus:border-amber-500"
                          : "bg-[#14171B] border-[#22272E] text-white placeholder-zinc-500 focus:border-violet-500"
                      }`}
                    />

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {isInternalWhisper ? "🔒 Whisper notes are never seen by the customer." : "Public reply updates ticket status."}
                      </span>

                      <button
                        onClick={handleSendReply}
                        disabled={sendingReply || !replyContent.trim()}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 ${
                          isInternalWhisper
                            ? "bg-amber-600 hover:bg-amber-500 text-white"
                            : "bg-violet-600 hover:bg-violet-500 text-white"
                        }`}
                      >
                        {sendingReply ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : isInternalWhisper ? (
                          <Lock size={13} />
                        ) : (
                          <Send size={13} />
                        )}
                        {isInternalWhisper ? "Log Whisper Note" : "Dispatch Public Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Tenant 360 Dossier & Quick Actions */}
              <div className="w-full md:w-80 p-5 space-y-5 bg-[#0E1014] overflow-y-auto shrink-0">
                {/* 1-Click Impersonate Button */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/30 space-y-2.5">
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-violet-400" />
                    <span>Live Tenant Troubleshooting</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Jump directly into this merchant's POS or ERP interface to reproduce errors.
                  </p>
                  <button
                    onClick={handleImpersonateTenant}
                    disabled={impersonating}
                    className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 disabled:opacity-50"
                  >
                    <ExternalLink size={13} />
                    {impersonating ? "Connecting..." : "Impersonate Tenant"}
                  </button>
                </div>

                {/* Tenant 360 Card */}
                <div className="p-4 rounded-2xl bg-[#121418] border border-[#1C2025] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1C2025] pb-2">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                      Tenant Dossier
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-violet-500/20 text-violet-300 font-bold font-mono">
                      {selectedTicket.tenant?.subscriptionTier}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Business:</span>
                      <span className="font-semibold text-white">{selectedTicket.tenant?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Slug:</span>
                      <span className="font-mono text-zinc-300">{selectedTicket.tenant?.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Outlets:</span>
                      <span className="font-mono text-zinc-200">{selectedTicket.tenant?._count?.branches ?? 1} branch(es)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Active POS Sessions:</span>
                      <span className="font-mono text-emerald-400 font-bold">{selectedTicket.tenant?._count?.posSessions ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Priority Management */}
                <div className="p-4 rounded-2xl bg-[#121418] border border-[#1C2025] space-y-3 text-xs">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono block">
                    Ticket Triage Controls
                  </span>

                  <div className="space-y-1">
                    <label className="text-zinc-500 text-[11px]">Lifecycle Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                      className="w-full bg-[#181B20] border border-[#242A33] rounded-xl px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-violet-500"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="WAITING_ON_CUSTOMER">WAITING ON CUSTOMER</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-500 text-[11px]">SLA Priority</label>
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) => handleUpdatePriority(e.target.value as TicketPriority)}
                      className="w-full bg-[#181B20] border border-[#242A33] rounded-xl px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-violet-500"
                    >
                      <option value="CRITICAL_URGENT">CRITICAL / URGENT (30m SLA)</option>
                      <option value="HIGH">HIGH (2h SLA)</option>
                      <option value="MEDIUM">MEDIUM (6h SLA)</option>
                      <option value="LOW">LOW (12h SLA)</option>
                    </select>
                  </div>
                </div>

                {/* CSAT Feedback Banner (if rated) */}
                {selectedTicket.csatRating && (
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1.5">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Customer Rating: {selectedTicket.csatRating} / 5 Stars
                    </span>
                    {selectedTicket.csatFeedback && (
                      <p className="text-zinc-300 italic">"{selectedTicket.csatFeedback}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
