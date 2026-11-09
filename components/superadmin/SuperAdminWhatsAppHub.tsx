"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  RefreshCw,
  Send,
  Building2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  ShieldAlert,
  Search,
  Filter,
  Users,
  Smartphone,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Layers,
  Phone,
  Bot,
  Cpu,
  Zap,
  Code,
  Check,
  Megaphone,
  Clock,
  Play
} from "lucide-react";
import { superAdminService } from "@/services/superadmin.service";
import { toast } from "@/store/toast.store";

interface TelemetryData {
  totalMessages: number;
  inboundCount: number;
  outboundCount: number;
  deliverySuccessRate: number;
  connectedTenantsCount: number;
  totalTenantsCount: number;
  totalWhatsAppGmv: number;
  recentMessages: any[];
}

interface TenantIntegration {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  subscriptionTier: string;
  isEnabled: boolean;
  environment: string;
  healthStatus: string;
  phoneNumberId?: string;
  wabaId?: string;
  lastTestedAt?: string;
  totalMessages: number;
  lastActiveAt?: string;
}

export default function SuperAdminWhatsAppHub() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [tenants, setTenants] = useState<TenantIntegration[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<
    "registry" | "broadcast" | "activity" | "ai-agent" | "campaigns" | "crm-inspector"
  >("registry");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [targetTier, setTargetTier] = useState("ALL");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

  // AI Sales Agent Governance State
  const [aiGovernance, setAiGovernance] = useState<any>(null);
  const [isSavingGovernance, setIsSavingGovernance] = useState(false);

  // AI Agent Simulator Sandbox State
  const [simulatorMessage, setSimulatorMessage] = useState("");
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [simulatorLogs, setSimulatorLogs] = useState<
    Array<{
      sender: "user" | "agent";
      text: string;
      toolCalls?: any[];
      orderCreated?: any;
      paymentLink?: string;
      timestamp: string;
    }>
  >([
    {
      sender: "agent",
      text: "👋 Hello Super Admin! I am the Autonomous AI Sales Agent. Type a test prompt (e.g. 'Check stock for Ceylon Tea and reserve 2 packs') to test real-time tool calling and order generation.",
      timestamp: "Ready",
    },
  ]);

  // Proactive Outbound Campaigns State
  const [campaignData, setCampaignData] = useState<any>(null);
  const [triggeringCampaign, setTriggeringCampaign] = useState<string | null>(null);
  const [campaignExecutionLogs, setCampaignExecutionLogs] = useState<any[]>([]);

  // Cross-Tenant CRM Live Thread Inspector State
  const [crmThreads, setCrmThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [threadCustomerDossier, setThreadCustomerDossier] = useState<any | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [interventionText, setInterventionText] = useState("");
  const [isSendingIntervention, setIsSendingIntervention] = useState(false);
  const [threadTenantFilter, setThreadTenantFilter] = useState("ALL");
  const [threadSearch, setThreadSearch] = useState("");

  useEffect(() => {
    loadHubData();
  }, []);

  const loadHubData = async () => {
    try {
      setLoading(true);
      const [tel, ten, aiGov, camps, threads] = await Promise.all([
        superAdminService.getWhatsAppTelemetry(),
        superAdminService.getWhatsAppTenants(),
        superAdminService.getWhatsAppAiGovernance(),
        superAdminService.getWhatsAppCampaigns(),
        superAdminService.getWhatsAppThreads(),
      ]);
      setTelemetry(tel);
      setTenants(ten || []);
      setAiGovernance(aiGov);
      setCampaignData(camps);
      setCrmThreads(threads || []);
      if (threads && threads.length > 0 && !selectedThread) {
        setSelectedThread(threads[0]);
        superAdminService
          .getWhatsAppThreadDetails(threads[0].tenantId, threads[0].phone)
          .then((det: any) => {
            setThreadMessages(det?.messages || []);
            setThreadCustomerDossier(det?.customerDossier || threads[0].customerDossier || null);
          })
          .catch(() => {});
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load WhatsApp platform hub data");
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Please provide both title and announcement message");
      return;
    }

    try {
      setIsBroadcasting(true);
      const res = await superAdminService.broadcastWhatsAppNotice(
        broadcastTitle.trim(),
        broadcastMessage.trim(),
        targetTier
      );
      toast.success(res.message || "Broadcast dispatched to tenant merchant owners!");
      setBroadcastHistory((prev) => [
        {
          id: `bcast-${Date.now()}`,
          title: broadcastTitle,
          message: broadcastMessage,
          targetTier,
          count: res.data?.dispatchedCount || 0,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
      setBroadcastTitle("");
      setBroadcastMessage("");
      const tel = await superAdminService.getWhatsAppTelemetry();
      setTelemetry(tel);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to dispatch WhatsApp broadcast");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSaveAiGovernance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGovernance?.settings) return;
    try {
      setIsSavingGovernance(true);
      await superAdminService.updateWhatsAppAiGovernance(aiGovernance.settings);
      toast.success("AI Sales Agent governance policies saved successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save AI governance policies");
    } finally {
      setIsSavingGovernance(false);
    }
  };

  const handleRunSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatorMessage.trim() || simulatorLoading) return;
    const userText = simulatorMessage.trim();
    setSimulatorMessage("");

    setSimulatorLogs((prev) => [
      ...prev,
      {
        sender: "user",
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    try {
      setSimulatorLoading(true);
      const res = await superAdminService.simulateWhatsAppAiAgent(userText);
      setSimulatorLogs((prev) => [
        ...prev,
        {
          sender: "agent",
          text: res.answer,
          toolCalls: res.toolCallsExecuted,
          orderCreated: res.orderCreated,
          paymentLink: res.paymentLink,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      const updatedAiGov = await superAdminService.getWhatsAppAiGovernance();
      setAiGovernance(updatedAiGov);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "AI Simulator error");
    } finally {
      setSimulatorLoading(false);
    }
  };

  const handleTriggerCampaign = async (
    campaignType: "CART_ABANDONMENT" | "PREDICTIVE_REORDER" | "AR_DUNNING"
  ) => {
    try {
      setTriggeringCampaign(campaignType);
      const res = await superAdminService.triggerWhatsAppCampaign(campaignType);
      toast.success(res.message || `Dispatched campaign ${campaignType}`);

      setCampaignExecutionLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          campaignType,
          dispatchedCount: res.data?.dispatchedCount || 0,
          scannedCount: res.data?.scannedCount || 0,
          targetedValueLkr: res.data?.targetedValueLkr || 0,
          details: res.data?.details || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ]);

      const [tel, camps] = await Promise.all([
        superAdminService.getWhatsAppTelemetry(),
        superAdminService.getWhatsAppCampaigns(),
      ]);
      setTelemetry(tel);
      setCampaignData(camps);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to trigger ${campaignType}`);
    } finally {
      setTriggeringCampaign(null);
    }
  };

  const loadCrmThreads = async (tenantId?: string, search?: string) => {
    try {
      const res = await superAdminService.getWhatsAppThreads(
        tenantId === "ALL" ? undefined : tenantId,
        search
      );
      setCrmThreads(res || []);
      return res || [];
    } catch (err: any) {
      console.error("Failed to load cross-tenant CRM threads", err);
      return [];
    }
  };

  const handleSelectThread = async (thread: any) => {
    setSelectedThread(thread);
    try {
      setThreadLoading(true);
      const details = await superAdminService.getWhatsAppThreadDetails(
        thread.tenantId,
        thread.phone
      );
      setThreadMessages(details?.messages || []);
      setThreadCustomerDossier(details?.customerDossier || thread.customerDossier || null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load thread messages");
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSendIntervention = async (customText?: string) => {
    const textToSend = customText || interventionText;
    if (!selectedThread || !textToSend.trim() || isSendingIntervention) return;

    try {
      setIsSendingIntervention(true);
      await superAdminService.sendWhatsAppIntervention(
        selectedThread.tenantId,
        selectedThread.phone,
        textToSend.trim()
      );
      toast.success("Support intervention message dispatched!");
      if (!customText) setInterventionText("");

      const details = await superAdminService.getWhatsAppThreadDetails(
        selectedThread.tenantId,
        selectedThread.phone
      );
      setThreadMessages(details?.messages || []);
      loadCrmThreads(threadTenantFilter, threadSearch);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send intervention");
    } finally {
      setIsSendingIntervention(false);
    }
  };

  const handleFilterTenantChange = async (newTenant: string) => {
    setThreadTenantFilter(newTenant);
    const threads = await loadCrmThreads(newTenant, threadSearch);
    if (threads.length > 0) {
      handleSelectThread(threads[0]);
    } else {
      setSelectedThread(null);
      setThreadMessages([]);
      setThreadCustomerDossier(null);
    }
  };

  const handleSearchThreads = async (e: React.FormEvent) => {
    e.preventDefault();
    const threads = await loadCrmThreads(threadTenantFilter, threadSearch);
    if (threads.length > 0 && (!selectedThread || !threads.some((t: any) => t.threadId === selectedThread.threadId))) {
      handleSelectThread(threads[0]);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenantSlug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.phoneNumberId && t.phoneNumberId.includes(searchQuery))
  );

  return (
    <div className="space-y-6" data-testid="superadmin-whatsapp-hub">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#101317] to-[#16191E] border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-poppins">
                WhatsApp Platform Gateway & Sales Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Meta Cloud API Cluster
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Centralized tenant messaging governance, autonomous sales agent telemetry, and platform-wide merchant broadcasts.
            </p>
          </div>
        </div>

        <button
          onClick={loadHubData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C2025] hover:bg-[#252A32] border border-[#2B3037] text-xs font-semibold text-zinc-200 transition-all shadow-sm"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-emerald-400" : "text-emerald-400"} />
          <span>Refresh Cluster</span>
        </button>
      </div>

      {/* Cluster Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#121417] border border-[#20242A] space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Total Cluster Messages</span>
            <MessageSquare size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {Number(telemetry?.totalMessages || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ArrowDownLeft size={12} /> {telemetry?.inboundCount || 0} In
            </span>
            <span className="flex items-center gap-1 text-teal-400">
              <ArrowUpRight size={12} /> {telemetry?.outboundCount || 0} Out
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121417] border border-[#20242A] space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Connected Merchants</span>
            <Building2 size={16} className="text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {telemetry?.connectedTenantsCount || 0}
            <span className="text-xs text-zinc-500 font-normal"> / {telemetry?.totalTenantsCount || 0} tenants</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} /> Active Meta API Credentials
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121417] border border-[#20242A] space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Delivery Success Rate</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {telemetry?.deliverySuccessRate || 100}%
          </div>
          <div className="text-[11px] text-zinc-400">
            Across sandbox & live Meta webhooks
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121417] border border-[#20242A] space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>WhatsApp Converted GMV</span>
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            Rs. {Number(telemetry?.totalWhatsAppGmv || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            Digital receipts & LankaQR links
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#20242A] pb-3 overflow-x-auto">
        <button
          data-testid="subtab-registry"
          onClick={() => setActiveSubTab("registry")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === "registry"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-zinc-400 hover:text-white hover:bg-[#16191E]"
          }`}
        >
          <Building2 size={14} />
          <span>Tenant WhatsApp Registry ({tenants.length})</span>
        </button>

        <button
          data-testid="subtab-broadcast"
          onClick={() => setActiveSubTab("broadcast")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === "broadcast"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-zinc-400 hover:text-white hover:bg-[#16191E]"
          }`}
        >
          <Send size={14} />
          <span>Platform Broadcast Engine</span>
        </button>

        <button
          data-testid="subtab-activity"
          onClick={() => setActiveSubTab("activity")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === "activity"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-zinc-400 hover:text-white hover:bg-[#16191E]"
          }`}
        >
          <MessageSquare size={14} />
          <span>Live Activity Stream</span>
        </button>

        <button
          data-testid="subtab-ai-agent"
          onClick={() => setActiveSubTab("ai-agent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === "ai-agent"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-zinc-400 hover:text-white hover:bg-[#16191E]"
          }`}
        >
          <Bot size={14} />
          <span>Autonomous AI Sales Agent & Tool Inspector</span>
        </button>

        <button
          data-testid="subtab-campaigns"
          onClick={() => setActiveSubTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === "campaigns"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-zinc-400 hover:text-white hover:bg-[#16191E]"
          }`}
        >
          <Megaphone size={14} />
          <span>Outbound Campaigns & AR Dunning</span>
        </button>

        <button
          data-testid="subtab-crm-inspector"
          onClick={() => {
            setActiveSubTab("crm-inspector");
            if (crmThreads.length > 0 && !selectedThread) {
              handleSelectThread(crmThreads[0]);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === "crm-inspector"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-zinc-400 hover:text-white hover:bg-[#16191E]"
          }`}
        >
          <Users size={14} />
          <span>Cross-Tenant CRM Thread Inspector ({crmThreads.length})</span>
        </button>
      </div>

      {/* Subtab 1: Tenant Registry Table */}
      {activeSubTab === "registry" && (
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#20242A] space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search tenant name, slug, or Phone ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#2B3037] bg-[#181B20] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              Showing {filteredTenants.length} tenants
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181B20] text-zinc-400 font-medium uppercase text-[10px] tracking-wider border-b border-[#2B3037]">
                <tr>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Status & Env</th>
                  <th className="py-3 px-4">Phone Number ID</th>
                  <th className="py-3 px-4">Messages</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20242A] text-zinc-300">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-zinc-500">
                      No matching tenant integrations found.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr key={t.tenantId} className="hover:bg-[#181B20]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{t.tenantName}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{t.tenantSlug}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 font-mono">
                          {t.subscriptionTier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              t.healthStatus === "HEALTHY"
                                ? "bg-emerald-400 animate-pulse"
                                : t.isEnabled
                                ? "bg-amber-400"
                                : "bg-zinc-600"
                            }`}
                          />
                          <span className="font-medium text-white">
                            {t.isEnabled ? t.environment : "DISABLED"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                        {t.phoneNumberId || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {t.totalMessages}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                        {t.lastActiveAt ? new Date(t.lastActiveAt).toLocaleString() : "Never"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#20242A] text-emerald-400 border border-[#2B3037]">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Platform Broadcast Engine */}
      {activeSubTab === "broadcast" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#121417] border border-[#20242A] space-y-4">
            <div>
              <h3 className="font-bold text-sm text-white font-poppins flex items-center gap-2">
                <Send size={15} className="text-emerald-400" />
                Dispatch System WhatsApp Announcement
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Broadcast official platform notices directly to verified tenant business owner phone numbers via Meta WhatsApp.
              </p>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Announcement Title
                </label>
                <input
                  type="text"
                  data-testid="broadcast-title-input"
                  placeholder="e.g. Scheduled Infrastructure Maintenance / Critical Security Update"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#2B3037] bg-[#181B20] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Target Subscription Tier
                </label>
                <select
                  value={targetTier}
                  onChange={(e) => setTargetTier(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#2B3037] bg-[#181B20] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">All Active Tenants ({tenants.length} merchants)</option>
                  <option value="ENTERPRISE">Enterprise Tenants Only</option>
                  <option value="PRO">Pro & Growth Tenants</option>
                  <option value="STARTER">Starter Tier Merchants</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Message Content (WhatsApp Formatted)
                </label>
                <textarea
                  rows={5}
                  data-testid="broadcast-message-input"
                  placeholder="Describe the platform update, scheduled downtime window, or new feature rollout..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-[#2B3037] bg-[#181B20] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                data-testid="send-broadcast-btn"
                disabled={isBroadcasting || !broadcastTitle || !broadcastMessage}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Send size={13} className={isBroadcasting ? "animate-spin" : ""} />
                <span>{isBroadcasting ? "Dispatching Broadcast..." : "Send WhatsApp Broadcast"}</span>
              </button>
            </form>
          </div>

          {/* Live Mobile WhatsApp Bubble Preview */}
          <div className="p-6 rounded-2xl bg-[#121417] border border-[#20242A] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 font-poppins">
                  Mobile Preview
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono">Meta Verified Sender</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B141B] border border-[#20242A] space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800 text-xs text-white">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-[10px]">
                    X
                  </div>
                  <div>
                    <div className="font-semibold">XONIT Cloud Platform</div>
                    <div className="text-[10px] text-zinc-400">Official Operations Broadcast</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#005C4B] text-white text-xs space-y-1.5 shadow-sm max-w-sm">
                  <div className="font-bold">
                    📢 XONIT Platform Alert: {broadcastTitle || "Announcement Title"}
                  </div>
                  <p className="whitespace-pre-line text-zinc-100 leading-relaxed text-[11px]">
                    {broadcastMessage ||
                      "Detailed system announcement will render here formatted with emojis, linebreaks, and merchant details."}
                  </p>
                  <div className="text-[9px] text-emerald-200/60 text-right font-mono">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ✓✓
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-[#181B20] border border-[#2B3037] text-[11px] text-zinc-400 flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>
                Reaches {tenants.length} registered merchant owners with valid phone records in PostgreSQL.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Live Activity Stream */}
      {activeSubTab === "activity" && (
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#20242A] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#20242A]">
            <h3 className="font-bold text-sm text-white font-poppins flex items-center gap-2">
              <Radio size={15} className="text-emerald-400 animate-pulse" />
              Real-time Inbound & Outbound Messaging Stream
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Real-time Stream</span>
          </div>

          <div className="space-y-2">
            {!telemetry?.recentMessages || telemetry.recentMessages.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No recent message activity recorded.
              </div>
            ) : (
              telemetry.recentMessages.map((m: any) => {
                const isInbound = m.direction === "INBOUND";
                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-[#181B20] border border-[#2B3037] flex items-center justify-between gap-4 text-xs hover:border-[#383E48] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isInbound ? "bg-emerald-500/10 text-emerald-400" : "bg-teal-500/10 text-teal-400"
                        }`}
                      >
                        {isInbound ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-white truncate">
                            {m.tenant?.name || "Tenant"}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">{m.phone}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isInbound ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {m.direction}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate max-w-md">{m.content}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-zinc-400">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-medium">
                        {m.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Subtab 4: Autonomous AI Sales Agent Governance & Simulator Sandbox */}
      {activeSubTab === "ai-agent" && (
        <div className="space-y-6" data-testid="ai-sales-agent-panel">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#121417] border border-[#20242A] space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>AI Conversations</span>
                <Bot size={16} className="text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {aiGovernance?.telemetry?.totalAiConversations || 0}
              </div>
              <p className="text-[10px] text-zinc-500">Inbound chats handled autonomously</p>
            </div>

            <div className="p-4 rounded-xl bg-[#121417] border border-[#20242A] space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Agent Tools Dispatched</span>
                <Zap size={16} className="text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-400 font-mono">
                {aiGovernance?.telemetry?.totalToolsDispatched || 0}
              </div>
              <p className="text-[10px] text-zinc-500">Stock checks & order calls</p>
            </div>

            <div className="p-4 rounded-xl bg-[#121417] border border-[#20242A] space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>AI-Generated Orders</span>
                <Sparkles size={16} className="text-teal-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {aiGovernance?.telemetry?.aiAssistedOrdersCount || 0}
              </div>
              <p className="text-[10px] text-teal-400 font-mono">
                Rs. {Number(aiGovernance?.telemetry?.aiAssistedGmv || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} GMV
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121417] border border-[#20242A] space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Escalation Rate</span>
                <ShieldAlert size={16} className="text-violet-400" />
              </div>
              <div className="text-xl font-bold text-violet-400 font-mono">
                {aiGovernance?.telemetry?.escalationRate || 2.4}%
              </div>
              <p className="text-[10px] text-zinc-500">Handoffs to human staff</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#121417] border border-[#20242A] space-y-5">
              <div>
                <h3 className="font-bold text-sm text-white font-poppins flex items-center gap-2">
                  <Cpu size={16} className="text-emerald-400" />
                  Cluster AI Governance Policies
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Universal execution parameters applied across all tenant AI WhatsApp Sales Agents.
                </p>
              </div>

              <form onSubmit={handleSaveAiGovernance} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#181B20] border border-[#2B3037] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Autonomous Order Creation</div>
                    <div className="text-[10px] text-zinc-400">Allow AI to directly insert draft orders in POS DB</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="toggle-auto-orders"
                      checked={aiGovernance?.settings?.autonomousOrderingEnabled ?? true}
                      onChange={(e) =>
                        setAiGovernance((prev: any) => ({
                          ...prev,
                          settings: {
                            ...prev?.settings,
                            autonomousOrderingEnabled: e.target.checked,
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>Confidence Score Threshold</span>
                    <span className="font-mono text-emerald-400">
                      {aiGovernance?.settings?.confidenceThreshold ?? 0.85}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={aiGovernance?.settings?.confidenceThreshold ?? 0.85}
                    onChange={(e) =>
                      setAiGovernance((prev: any) => ({
                        ...prev,
                        settings: {
                          ...prev?.settings,
                          confidenceThreshold: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                    <span>0.50 (Permissive)</span>
                    <span>1.00 (Strict Grounding)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Max Auto Discount %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={aiGovernance?.settings?.maxAutoDiscountPercent ?? 10}
                      onChange={(e) =>
                        setAiGovernance((prev: any) => ({
                          ...prev,
                          settings: {
                            ...prev?.settings,
                            maxAutoDiscountPercent: parseInt(e.target.value, 10),
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#2B3037] bg-[#181B20] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Escalation SLA (mins)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={aiGovernance?.settings?.escalationTimeoutMinutes ?? 15}
                      onChange={(e) =>
                        setAiGovernance((prev: any) => ({
                          ...prev,
                          settings: {
                            ...prev?.settings,
                            escalationTimeoutMinutes: parseInt(e.target.value, 10),
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#2B3037] bg-[#181B20] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Active Gemini Tool Calling Declarations
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { name: "check_branch_stock", desc: "Real-time SKU & branch stock availability query" },
                      { name: "create_whatsapp_order", desc: "Autonomous draft order generation in POS schema" },
                      { name: "generate_payment_link", desc: "Dynamic LankaQR & Card settlement payload" },
                      { name: "escalate_to_staff", desc: "Automated routing to live merchant human desk" },
                    ].map((tool) => (
                      <div
                        key={tool.name}
                        className="p-2 rounded-lg bg-[#181B20] border border-[#2B3037] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Code size={13} className="text-emerald-400" />
                          <span className="font-mono text-zinc-200 text-[11px]">{tool.name}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">{tool.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  data-testid="save-ai-governance-btn"
                  disabled={isSavingGovernance}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Check size={14} />
                  <span>{isSavingGovernance ? "Saving Policies..." : "Save AI Governance Policies"}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 p-5 rounded-2xl bg-[#121417] border border-[#20242A] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#20242A]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Bot size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">AI Sales Agent Sandbox Simulator</h4>
                      <p className="text-[10px] text-zinc-400">
                        Test autonomous multi-turn reasoning and tool invocation live
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    Agentic Loop: Online
                  </span>
                </div>

                <div className="mt-4 space-y-3.5 max-h-[460px] overflow-y-auto pr-2" data-testid="ai-sandbox-chat-feed">
                  {simulatorLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${log.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-500 font-mono">
                        <span>{log.sender === "user" ? "Customer (Test)" : "AI Sales Copilot"}</span>
                        <span>•</span>
                        <span>{log.timestamp}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs max-w-md space-y-2 leading-relaxed ${
                          log.sender === "user"
                            ? "bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-600/10"
                            : "bg-[#181B20] text-zinc-200 border border-[#2B3037] rounded-bl-none"
                        }`}
                      >
                        <p className="whitespace-pre-line">{log.text}</p>

                        {log.toolCalls && log.toolCalls.length > 0 && (
                          <div className="pt-2 border-t border-[#2B3037] space-y-1.5">
                            <div className="text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                              <Zap size={11} /> {log.toolCalls.length} Agent Tool(s) Invoked:
                            </div>
                            {log.toolCalls.map((tc, tidx) => (
                              <div
                                key={tidx}
                                className="p-2 rounded bg-[#101317] border border-[#20242A] text-[10px] font-mono text-zinc-300 space-y-1"
                              >
                                <div className="text-amber-400 font-bold">{tc.tool}()</div>
                                <div className="text-zinc-500 truncate">Args: {JSON.stringify(tc.params)}</div>
                                <div className="text-emerald-400 font-semibold truncate">
                                  Result: {tc.result?.message || (tc.result?.found ? "Item in stock" : "Success")}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {log.paymentLink && (
                          <div className="pt-2">
                            <a
                              href={log.paymentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold hover:bg-emerald-500/30 transition-all"
                            >
                              <ExternalLink size={12} /> Pay via LankaQR Link
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {simulatorLoading && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono py-2">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>AI Agent reasoning & invoking tools...</span>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleRunSimulator} className="pt-3 border-t border-[#20242A]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    data-testid="ai-sandbox-input"
                    placeholder="e.g. Check stock for Ceylon Tea and reserve 2 packs..."
                    value={simulatorMessage}
                    onChange={(e) => setSimulatorMessage(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-[#2B3037] bg-[#181B20] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    data-testid="ai-sandbox-send-btn"
                    disabled={simulatorLoading || !simulatorMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Test Agent</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 5: Autonomous Outbound Campaigns & AR Dunning Engine */}
      {activeSubTab === "campaigns" && (
        <div className="space-y-6" data-testid="campaigns-panel">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#121417] border border-[#20242A] space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Total Campaign Pings</span>
                <Megaphone size={16} className="text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {campaignData?.telemetry?.totalCampaignsDispatched || 0}
              </div>
              <p className="text-[10px] text-zinc-500">Autonomous outbound nudges delivered</p>
            </div>

            <div className="p-4 rounded-xl bg-[#121417] border border-[#20242A] space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Recovered Cart GMV</span>
                <Sparkles size={16} className="text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-400 font-mono">
                Rs. {Number(campaignData?.telemetry?.totalCartRecoveredGmv || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-zinc-500">From abandoned quotation recoveries</p>
            </div>

            <div className="p-4 rounded-xl bg-[#121417] border border-[#20242A] space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>AR Overdue Debt Monitored</span>
                <ShieldAlert size={16} className="text-violet-400" />
              </div>
              <div className="text-xl font-bold text-violet-400 font-mono">
                Rs. {Number(campaignData?.telemetry?.totalArTargeted || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-zinc-500">Cross-tenant debtor ledger balance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Campaign 1: Cart Abandonment */}
            <div className="p-5 rounded-2xl bg-[#121417] border border-[#20242A] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Cron: Every 2h
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Status: ACTIVE</span>
                </div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Megaphone size={16} className="text-emerald-400" />
                  Stalled Cart & Quotation Recovery
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Identifies draft orders & customer carts left unfinished between 2 and 48 hours ago. Sends conversational WhatsApp recovery prompts with 1-click LankaQR payment links.
                </p>
              </div>

              <button
                onClick={() => handleTriggerCampaign("CART_ABANDONMENT")}
                disabled={triggeringCampaign === "CART_ABANDONMENT"}
                data-testid="trigger-cart-recovery-btn"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {triggeringCampaign === "CART_ABANDONMENT" ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Play size={13} />
                )}
                <span>
                  {triggeringCampaign === "CART_ABANDONMENT"
                    ? "Running Scan..."
                    : "Run Cart Recovery Scan Now"}
                </span>
              </button>
            </div>

            {/* Campaign 2: Predictive Replenishment */}
            <div className="p-5 rounded-2xl bg-[#121417] border border-[#20242A] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    Cron: Daily 09:00 UTC
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Status: ACTIVE</span>
                </div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Clock size={16} className="text-teal-400" />
                  Predictive Reorder & Replenishment
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Scans 25–35 day old consumable purchases (coffee, tea, lubricants, packaging) and nudges customers before they run out with pre-filled 1-click cart replenishment.
                </p>
              </div>

              <button
                onClick={() => handleTriggerCampaign("PREDICTIVE_REORDER")}
                disabled={triggeringCampaign === "PREDICTIVE_REORDER"}
                data-testid="trigger-reorder-btn"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2"
              >
                {triggeringCampaign === "PREDICTIVE_REORDER" ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Play size={13} />
                )}
                <span>
                  {triggeringCampaign === "PREDICTIVE_REORDER"
                    ? "Running Scan..."
                    : "Run Replenishment Scan Now"}
                </span>
              </button>
            </div>

            {/* Campaign 3: AR Overdue Dunning */}
            <div className="p-5 rounded-2xl bg-[#121417] border border-[#20242A] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Cron: Daily 09:30 UTC
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Status: ACTIVE</span>
                </div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldAlert size={16} className="text-amber-400" />
                  Intelligent AR Overdue Dunning
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Monitors credit ledgers across all tenants. Dispatches polite progressive dunning statement summaries with dynamic LankaQR payment links for immediate debt settlement.
                </p>
              </div>

              <button
                onClick={() => handleTriggerCampaign("AR_DUNNING")}
                disabled={triggeringCampaign === "AR_DUNNING"}
                data-testid="trigger-ar-dunning-btn"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2"
              >
                {triggeringCampaign === "AR_DUNNING" ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Play size={13} />
                )}
                <span>
                  {triggeringCampaign === "AR_DUNNING"
                    ? "Running Scan..."
                    : "Run AR Dunning Scan Now"}
                </span>
              </button>
            </div>
          </div>

          {/* Real-time Campaign Execution History */}
          <div className="p-5 rounded-2xl bg-[#121417] border border-[#20242A] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-emerald-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                  Campaign Execution Audit Trail
                </h4>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {campaignExecutionLogs.length} runs recorded this session
              </span>
            </div>

            <div className="space-y-2.5">
              {campaignExecutionLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  No manual campaign triggers recorded yet this session. Click any "Run Scan Now" button above to execute immediately.
                </div>
              ) : (
                campaignExecutionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-[#181B20] border border-[#2B3037] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{log.campaignType}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {log.dispatchedCount} Dispatched
                        </span>
                        <span className="text-[10px] text-zinc-500">({log.scannedCount} scanned)</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Targeted Value: Rs. {Number(log.targetedValueLkr).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">{log.timestamp}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 6: Cross-Tenant CRM Live Thread Inspector */}
      {activeSubTab === "crm-inspector" && (
        <div
          className="rounded-2xl bg-[#121417] border border-[#20242A] overflow-hidden flex flex-col md:flex-row h-[750px] shadow-2xl"
          data-testid="cross-tenant-crm-inspector"
        >
          {/* Left Pane: Cross-Tenant Thread List */}
          <div className="w-full md:w-80 border-r border-[#20242A] flex flex-col bg-[#101317] shrink-0">
            <div className="p-3.5 border-b border-[#20242A] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-emerald-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                    Tenant Threads
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1C2025] text-zinc-400 border border-[#2B3037]">
                  {crmThreads.length} Total
                </span>
              </div>

              {/* Tenant Filter Selector */}
              <div className="relative">
                <select
                  data-testid="inspector-tenant-select"
                  value={threadTenantFilter}
                  onChange={(e) => handleFilterTenantChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#2B3037] bg-[#181B20] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="ALL">🏢 All Platform Tenants</option>
                  {tenants.map((t) => (
                    <option key={t.tenantId} value={t.tenantId}>
                      {t.tenantName} ({t.tenantSlug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Thread Search Box */}
              <form onSubmit={handleSearchThreads} className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  data-testid="crm-threads-search"
                  value={threadSearch}
                  onChange={(e) => setThreadSearch(e.target.value)}
                  placeholder="Search customer, phone, text..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#2B3037] bg-[#181B20] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </form>
            </div>

            {/* Threads Scroll List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#1A1E24]">
              {crmThreads.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  No active customer WhatsApp threads found for this filter.
                </div>
              ) : (
                crmThreads.map((thread) => {
                  const isSelected = selectedThread?.threadId === thread.threadId;
                  return (
                    <button
                      key={thread.threadId}
                      data-testid={`thread-item-${thread.phone}`}
                      onClick={() => handleSelectThread(thread)}
                      className={`w-full p-3 text-left transition-all flex flex-col gap-1.5 border-l-2 ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-400"
                          : "border-transparent hover:bg-[#16191E]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-white truncate max-w-[150px]">
                          {thread.customerName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                          {thread.lastActiveAt
                            ? new Date(thread.lastActiveAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1C2025] text-zinc-300 border border-[#2B3037] truncate max-w-[120px]">
                          {thread.tenantName}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          +{thread.phone}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                        {thread.direction === "INBOUND" ? "← " : "→ "}
                        {thread.lastMessage}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Center Pane: Live Chat & Intervention Console */}
          <div
            className="flex-1 flex flex-col bg-[#0D0F12] relative overflow-hidden"
            data-testid="crm-inspector-chat-pane"
          >
            {selectedThread ? (
              <>
                {/* Chat Header Bar */}
                <div className="p-3.5 border-b border-[#20242A] bg-[#121417] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs font-mono">
                      {selectedThread.customerName ? selectedThread.customerName.charAt(0) : "C"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-white">
                          {selectedThread.customerName}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {selectedThread.tenantName}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        +{selectedThread.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="inspector-send-lankaqr-btn"
                      onClick={() =>
                        handleSendIntervention(
                          "💳 *Official Payment Link*: You can settle your pending store balance securely via LankaQR: https://pay.xonit.space/lankaqr/pay"
                        )
                      }
                      disabled={isSendingIntervention}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles size={12} />
                      <span>Send LankaQR Link</span>
                    </button>

                    <button
                      type="button"
                      data-testid="inspector-refresh-thread-btn"
                      onClick={() => handleSelectThread(selectedThread)}
                      className="p-1.5 rounded-lg bg-[#1C2025] hover:bg-[#252A32] border border-[#2B3037] text-zinc-400 hover:text-white"
                      title="Refresh Thread"
                    >
                      <RefreshCw size={13} className={threadLoading ? "animate-spin text-emerald-400" : ""} />
                    </button>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {threadLoading ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-xs gap-2">
                      <RefreshCw size={14} className="animate-spin text-emerald-400" />
                      <span>Loading thread history...</span>
                    </div>
                  ) : threadMessages.length === 0 ? (
                    <div className="text-center text-xs text-zinc-500 mt-10">
                      No message history recorded in this thread yet.
                    </div>
                  ) : (
                    threadMessages.map((msg, idx) => {
                      const isInbound = msg.direction === "INBOUND";
                      const isIntervention =
                        msg.senderName?.includes("Super Admin") ||
                        msg.metadata?.intervention;

                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[10px] font-bold text-zinc-400">
                              {isInbound
                                ? selectedThread.customerName || "Customer"
                                : isIntervention
                                ? "🛡️ SUPER ADMIN SUPPORT"
                                : msg.senderName || "AI Sales Agent"}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>

                          <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                              isInbound
                                ? "bg-[#181B20] text-zinc-100 border border-[#2B3037] rounded-tl-sm"
                                : isIntervention
                                ? "bg-gradient-to-r from-emerald-950/70 to-emerald-900/40 text-emerald-100 border border-emerald-500/30 rounded-tr-sm"
                                : "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 rounded-tr-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Super Admin Intervention Composer */}
                <div className="p-3 border-t border-[#20242A] bg-[#121417] space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      data-testid="inspector-reply-input"
                      value={interventionText}
                      onChange={(e) => setInterventionText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendIntervention();
                        }
                      }}
                      placeholder="Type Super Admin platform support intervention to customer..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#2B3037] bg-[#181B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />

                    <button
                      type="button"
                      data-testid="inspector-send-btn"
                      onClick={() => handleSendIntervention()}
                      disabled={isSendingIntervention || !interventionText.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {isSendingIntervention ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>Intervene</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-500 italic flex items-center gap-1">
                    <ShieldAlert size={11} className="text-emerald-400 shrink-0" />
                    <span>
                      Interventions are sent directly to customer WhatsApp via Meta Cloud API with official platform verification badge.
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 text-xs gap-2">
                <Users size={32} className="text-zinc-600" />
                <p>Select a customer conversation thread from the left to inspect and intervene.</p>
              </div>
            )}
          </div>

          {/* Right Pane: Customer 360 Dossier */}
          <div
            className="w-full md:w-72 border-l border-[#20242A] flex flex-col bg-[#101317] p-4 overflow-y-auto space-y-4 shrink-0"
            data-testid="crm-inspector-dossier"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-[#20242A]">
              <Cpu size={15} className="text-emerald-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                Customer 360 Dossier
              </h4>
            </div>

            {selectedThread ? (
              <>
                <div className="text-center p-4 rounded-xl bg-[#181B20] border border-[#2B3037] space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg font-mono">
                    {selectedThread.customerName ? selectedThread.customerName.charAt(0) : "C"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{selectedThread.customerName}</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">+{selectedThread.phone}</p>
                    {threadCustomerDossier?.email && (
                      <p className="text-[10px] text-zinc-500">{threadCustomerDossier.email}</p>
                    )}
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    {threadCustomerDossier?.customerType || "RETAIL"} VIP
                  </span>
                </div>

                {/* Key Financial & CRM Metrics */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Ledger & Loyalty
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#181B20] border border-[#2B3037]">
                      <span className="text-[10px] text-zinc-400 block">Credit Balance</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        Rs.{" "}
                        {Number(threadCustomerDossier?.creditBalance || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#181B20] border border-[#2B3037]">
                      <span className="text-[10px] text-zinc-400 block">Loyalty Points</span>
                      <span className="font-bold text-amber-400 font-mono">
                        {Number(threadCustomerDossier?.loyaltyPoints || 0)} Pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Stream */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Recent Orders ({threadCustomerDossier?.recentOrders?.length || 0})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {!threadCustomerDossier?.recentOrders ||
                    threadCustomerDossier.recentOrders.length === 0 ? (
                      <div className="text-[11px] text-zinc-500 italic p-2 text-center bg-[#181B20] rounded-lg">
                        No prior orders recorded.
                      </div>
                    ) : (
                      threadCustomerDossier.recentOrders.map((ord: any) => (
                        <div
                          key={ord.id}
                          className="p-2 rounded-lg bg-[#181B20] border border-[#2B3037] flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-white block">#{ord.orderNumber}</span>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400 block font-mono">
                              Rs. {Number(ord.total).toLocaleString()}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400">
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Store Context */}
                <div className="p-3 rounded-xl bg-[#181B20] border border-[#2B3037] text-xs space-y-1">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">
                    Associated Merchant
                  </span>
                  <div className="font-bold text-white">{selectedThread.tenantName}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    ID: {selectedThread.tenantId}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-zinc-500 mt-10">
                No customer selected.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
