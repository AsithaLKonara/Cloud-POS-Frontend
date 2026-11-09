"use client";

import React, { useState, useEffect } from "react";
import {
  superAdminService,
  DunningOverviewResponse,
  DelinquentTenantItem,
} from "@/services/superadmin.service";
import { toast } from "@/store/toast.store";
import { formatDistanceToNow, format } from "date-fns";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  CalendarPlus,
  Play,
  Building2,
  Lock,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

interface SuperAdminDunningManagerProps {
  onRefreshData?: () => void;
}

export default function SuperAdminDunningManager({ onRefreshData }: SuperAdminDunningManagerProps) {
  const [data, setData] = useState<DunningOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<string>("ALL");

  const fetchDunningData = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getDunningOverview();
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load dunning overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDunningData();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      const res = await superAdminService.triggerDunningScan();
      toast.success(
        `Dunning scan executed: ${res.scannedCount} tenants evaluated, ${res.suspendedCount} auto-suspended, ${res.inGraceCount} in grace period.`
      );
      await fetchDunningData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to run automated dunning scan");
    } finally {
      setScanning(false);
    }
  };

  const handleExtendGrace = async (tenantId: string, tenantName: string, days: number) => {
    try {
      setActionInProgress(`${tenantId}-grace-${days}`);
      const res = await superAdminService.extendGracePeriod(tenantId, days);
      toast.success(`Grace period for ${tenantName} extended by +${days} days.`);
      await fetchDunningData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to extend grace period");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleExemption = async (tenantId: string, tenantName: string, currentExempt: boolean) => {
    const nextVal = !currentExempt;
    try {
      setActionInProgress(`${tenantId}-exemption`);
      await superAdminService.toggleDunningExemption(tenantId, nextVal);
      if (nextVal) {
        toast.success(`${tenantName} is now marked as VIP EXEMPT from automated suspensions.`);
      } else {
        toast.info(`${tenantName} is now subject to automated dunning suspensions.`);
      }
      await fetchDunningData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle exemption");
    } finally {
      setActionInProgress(null);
    }
  };

  const kpis = data?.kpis || {
    totalDelinquentCount: 0,
    atRiskMrrLkr: 0,
    inGraceCount: 0,
    overdueCount: 0,
    suspendedCount: 0,
    exemptCount: 0,
  };

  const tenants = data?.tenants || [];

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      t.subscriptionTier.toLowerCase().includes(search.toLowerCase());

    if (filterTab === "GRACE") return matchesSearch && t.delinquencyStatus === "IN_GRACE_PERIOD";
    if (filterTab === "OVERDUE") return matchesSearch && t.delinquencyStatus === "OVERDUE";
    if (filterTab === "SUSPENDED") return matchesSearch && t.delinquencyStatus === "SUSPENDED_DELINQUENT";
    if (filterTab === "EXEMPT") return matchesSearch && t.isExempt;
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_GRACE_PERIOD":
        return {
          label: "In Grace Period",
          color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
          desc: "Active with warning banner",
        };
      case "OVERDUE":
        return {
          label: "Overdue (Restricted)",
          color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
          desc: "Write-operations restricted",
        };
      case "SUSPENDED_DELINQUENT":
        return {
          label: "Suspended (Delinquent)",
          color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          desc: "Service lockout active",
        };
      case "EXEMPT":
        return {
          label: "VIP Exempt",
          color: "bg-purple-500/10 text-purple-300 border-purple-500/30",
          desc: "Exempt from auto-suspension",
        };
      default:
        return {
          label: "Healthy",
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          desc: "Current billing",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Dunning KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">At-Risk Subscription MRR</span>
            <TrendingDown size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            Rs. {kpis.atRiskMrrLkr.toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-500 mt-2">Delinquent recurring revenue at risk</span>
        </div>

        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">In Grace Period (Days 1–7)</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {kpis.inGraceCount}
          </div>
          <span className="text-[11px] text-amber-400/80 mt-2">Active with grace banner</span>
        </div>

        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Overdue (&gt; 7 Days)</span>
            <AlertTriangle size={16} className="text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400 mt-1">
            {kpis.overdueCount}
          </div>
          <span className="text-[11px] text-orange-400/80 mt-2">Pending automated lockdown</span>
        </div>

        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Delinquency Suspensions</span>
            <ShieldAlert size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-500 mt-1">
            {kpis.suspendedCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-2">Locked out for non-payment</span>
        </div>
      </div>

      {/* Dunning Stage Lifecycle Timeline */}
      <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            SaaS Dunning Escalation Matrix
          </h3>
          <span className="text-[11px] text-zinc-500 font-mono">
            Automated Cron: Daily at 02:00 UTC
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#16191E] border border-amber-500/20 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-mono">
                1
              </span>
              <span>Stage 1: Grace Period (Days 1–7)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Store remains 100% operational. POS and Admin display a persistent yellow billing notice.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#16191E] border border-orange-500/20 text-xs">
            <div className="flex items-center gap-2 text-orange-400 font-semibold mb-1">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px] font-mono">
                2
              </span>
              <span>Stage 2: Overdue (Days 8–14)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Restricted write operations. Catalog additions and analytics reports are throttled.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#16191E] border border-rose-500/20 text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-semibold mb-1">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px] font-mono">
                3
              </span>
              <span>Stage 3: Auto-Suspension (Day 15+)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Automatic status change to SUSPENDED. All cashiers and staff locked out until restored.
            </p>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121417] p-3 rounded-xl border border-[#1E2227]">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search delinquent merchant by name or tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181B1F] border border-[#262B33] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-[#181B1F] p-1 rounded-lg border border-[#262B33]">
            {[
              { id: "ALL", label: "All Delinquent", count: tenants.length },
              { id: "GRACE", label: "Grace Period", count: kpis.inGraceCount },
              { id: "OVERDUE", label: "Overdue", count: kpis.overdueCount },
              { id: "SUSPENDED", label: "Suspended", count: kpis.suspendedCount },
              { id: "EXEMPT", label: "VIP Exempt", count: kpis.exemptCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  filterTab === tab.id
                    ? "bg-amber-500 text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleRunScan}
            disabled={scanning || loading}
            data-testid="run-dunning-scan-btn"
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-50"
            title="Execute dunning evaluation on all tenants right now"
          >
            <Play size={12} className={scanning ? "animate-spin" : "fill-current"} />
            <span>{scanning ? "Evaluating..." : "Run Dunning Scan"}</span>
          </button>

          <button
            onClick={fetchDunningData}
            disabled={loading}
            className="p-2 rounded-lg bg-[#181B1F] hover:bg-[#20242A] border border-[#262B33] text-zinc-300 hover:text-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Delinquency Ledger Table */}
      <div 
        data-testid="dunning-ledger-table"
        className="rounded-2xl bg-[#121417] border border-[#1E2227] overflow-hidden shadow-lg"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#15181D] text-zinc-400 font-semibold border-b border-[#1E2227]">
              <tr>
                <th className="py-3 px-4">Merchant Tenant</th>
                <th className="py-3 px-4">Delinquency Health</th>
                <th className="py-3 px-4">Days Overdue</th>
                <th className="py-3 px-4">Grace Expiry Date</th>
                <th className="py-3 px-4">At-Risk MRR</th>
                <th className="py-3 px-4 text-right">SuperAdmin Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181B1F] text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <RefreshCw size={18} className="animate-spin inline-block mr-2 text-amber-500" />
                    Scanning platform tenant delinquency status...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <CheckCircle2 size={24} className="inline-block mb-1 text-emerald-400" />
                    <div>Zero delinquent accounts in this view. All merchant subscriptions are paid and healthy.</div>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const badge = getStatusBadge(t.delinquencyStatus);
                  const isBusyGrace7 = actionInProgress === `${t.tenantId}-grace-7`;
                  const isBusyGrace14 = actionInProgress === `${t.tenantId}-grace-14`;
                  const isBusyExempt = actionInProgress === `${t.tenantId}-exemption`;

                  return (
                    <tr
                      key={t.tenantId}
                      data-testid={`dunning-row-${t.slug}`}
                      className="hover:bg-[#15181D]/60 transition-colors"
                    >
                      {/* Tenant */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-white truncate">{t.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-zinc-500">@{t.slug}</span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                              {t.subscriptionTier}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border w-fit ${badge.color}`}
                          >
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-[10px] text-zinc-500">{badge.desc}</span>
                        </div>
                      </td>

                      {/* Days Overdue */}
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                        {t.daysOverdue > 0 ? `${t.daysOverdue} days` : "Current"}
                      </td>

                      {/* Grace Expiry Date */}
                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        {t.graceExpiresAt ? (
                          <div className="flex flex-col">
                            <span>{format(new Date(t.graceExpiresAt), "MMM d, yyyy")}</span>
                            <span className="text-[10px] text-zinc-500">
                              {formatDistanceToNow(new Date(t.graceExpiresAt), { addSuffix: true })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-mono text-xs">Standard Cycle</span>
                        )}
                      </td>

                      {/* Amount at Risk */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        Rs. {t.amountAtRiskLkr.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleExtendGrace(t.tenantId, t.name, 7)}
                            disabled={Boolean(actionInProgress)}
                            data-testid={`btn-grace7-${t.slug}`}
                            className="px-2.5 py-1 rounded bg-[#1C2025] hover:bg-amber-950/40 text-amber-400 text-[11px] font-semibold border border-[#2B3037] hover:border-amber-500/40 transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                            title="Extend grace period by +7 days"
                          >
                            <CalendarPlus size={11} className={isBusyGrace7 ? "animate-spin" : ""} />
                            <span>+7 Days</span>
                          </button>

                          <button
                            onClick={() => handleExtendGrace(t.tenantId, t.name, 14)}
                            disabled={Boolean(actionInProgress)}
                            className="px-2.5 py-1 rounded bg-[#1C2025] hover:bg-blue-950/40 text-blue-400 text-[11px] font-semibold border border-[#2B3037] hover:border-blue-500/40 transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                            title="Extend grace period by +14 days"
                          >
                            <CalendarPlus size={11} className={isBusyGrace14 ? "animate-spin" : ""} />
                            <span>+14 Days</span>
                          </button>

                          <button
                            onClick={() => handleToggleExemption(t.tenantId, t.name, t.isExempt)}
                            disabled={Boolean(actionInProgress)}
                            data-testid={`btn-exempt-${t.slug}`}
                            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                              t.isExempt
                                ? "bg-purple-950/40 text-purple-300 border-purple-500/40"
                                : "bg-[#1C2025] text-zinc-400 border-[#2B3037] hover:text-white"
                            }`}
                            title={t.isExempt ? "Remove VIP Exemption" : "Grant VIP Exemption"}
                          >
                            <ShieldCheck size={11} className={isBusyExempt ? "animate-spin" : ""} />
                            <span>{t.isExempt ? "Exempt" : "Make Exempt"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

