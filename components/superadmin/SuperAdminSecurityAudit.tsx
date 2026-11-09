"use client";

import React, { useState, useEffect } from "react";
import {
  superAdminService,
  GlobalAuditLogItem,
  AuditStatsResponse,
  TenantRegistryItem,
} from "@/services/superadmin.service";
import { toast } from "@/store/toast.store";
import { formatDistanceToNow, format } from "date-fns";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  KeyRound,
  Lock,
  Activity,
  SlidersHorizontal,
  Building2,
  Clock,
  Code,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
} from "lucide-react";

interface SuperAdminSecurityAuditProps {
  tenants: TenantRegistryItem[];
}

export default function SuperAdminSecurityAudit({ tenants }: SuperAdminSecurityAuditProps) {
  const [logs, setLogs] = useState<GlobalAuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [tenantFilter, setTenantFilter] = useState("ALL");
  const [timeframe, setTimeframe] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector Modal
  const [selectedLogForDiff, setSelectedLogForDiff] = useState<GlobalAuditLogItem | null>(null);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const [logRes, statRes] = await Promise.all([
        superAdminService.getGlobalAuditLogs({
          search: search || undefined,
          action: actionFilter !== "ALL" ? actionFilter : undefined,
          tenantId: tenantFilter !== "ALL" ? tenantFilter : undefined,
          timeframe: timeframe !== "ALL" ? timeframe : undefined,
          page,
          limit: 20,
        }),
        superAdminService.getAuditStats(),
      ]);

      setLogs(logRes.logs || []);
      setTotalPages(logRes.pagination.totalPages || 1);
      setTotalCount(logRes.pagination.total || 0);
      setStats(statRes);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load security audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [actionFilter, tenantFilter, timeframe, page]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAuditData();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("IMPERSONATE")) {
      return {
        label: "Masquerade Session",
        color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        icon: KeyRound,
      };
    }
    if (act.includes("FLAG")) {
      return {
        label: "Master Kill-Switch",
        color: "bg-purple-500/10 text-purple-300 border-purple-500/30",
        icon: SlidersHorizontal,
      };
    }
    if (act.includes("ENTITLEMENT")) {
      return {
        label: "Tenant Entitlement",
        color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
        icon: Lock,
      };
    }
    if (act.includes("PASSWORD")) {
      return {
        label: "Password Override",
        color: "bg-rose-500/10 text-rose-300 border-rose-500/30",
        icon: ShieldAlert,
      };
    }
    if (act.includes("PROVISION") || act.includes("STATUS")) {
      return {
        label: "Tenant Governance",
        color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
        icon: Building2,
      };
    }
    return {
      label: action,
      color: "bg-zinc-800 text-zinc-300 border-zinc-700",
      icon: Activity,
    };
  };

  return (
    <div className="space-y-6">
      {/* 4 Security KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Total Audit Ledger</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {stats?.totalEvents ?? totalCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-2">Immutable security ledger entries</span>
        </div>

        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Events Recorded (24h)</span>
            <Activity size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {stats?.events24h ?? 0}
          </div>
          <span className="text-[11px] text-cyan-500/80 mt-2">Active platform operations</span>
        </div>

        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Masquerade Sessions</span>
            <KeyRound size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {stats?.impersonationCount ?? 0}
          </div>
          <span className="text-[11px] text-amber-400/80 mt-2">Tenant impersonations executed</span>
        </div>

        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Security Modifications</span>
            <Lock size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
            {stats?.securityEvents ?? 0}
          </div>
          <span className="text-[11px] text-purple-400/80 mt-2">Passwords, flags & permissions</span>
        </div>
      </div>

      {/* Filter Control Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#121417] p-3 rounded-xl border border-[#1E2227]">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            data-testid="audit-search-input"
            placeholder="Search action, email, IP, or tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181B1F] border border-[#262B33] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#181B1F] border border-[#262B33] text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50"
          >
            <option value="ALL">All Actions</option>
            <option value="IMPERSONATE">Masquerade Sessions</option>
            <option value="FLAG">Global Feature Flags</option>
            <option value="ENTITLEMENT">Tenant Entitlements</option>
            <option value="PASSWORD">Password Resets</option>
            <option value="STATUS">Status Changes</option>
          </select>

          {/* Tenant Filter */}
          <select
            value={tenantFilter}
            onChange={(e) => {
              setTenantFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#181B1F] border border-[#262B33] text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50 max-w-[180px] truncate"
          >
            <option value="ALL">All Outlets & System</option>
            <option value="PLATFORM_SYSTEM">Platform System Only</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Timeframe */}
          <div className="flex items-center gap-1 bg-[#181B1F] p-1 rounded-lg border border-[#262B33]">
            {["ALL", "24H", "7D", "30D"].map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  setPage(1);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  timeframe === tf
                    ? "bg-amber-500 text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tf === "ALL" ? "All Time" : tf}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAuditData}
            disabled={loading}
            className="p-2 rounded-lg bg-[#181B1F] hover:bg-[#20242A] border border-[#262B33] text-zinc-300 hover:text-white transition-colors"
            title="Refresh logs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Security Audit Table */}
      <div 
        data-testid="security-audit-table"
        className="rounded-2xl bg-[#121417] border border-[#1E2227] overflow-hidden shadow-lg"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#15181D] text-zinc-400 font-semibold border-b border-[#1E2227]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action / Event</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Target Tenant</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Payload Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181B1F] text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <RefreshCw size={18} className="animate-spin inline-block mr-2 text-amber-500" />
                    Fetching cross-tenant security audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No security audit events found matching query criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;
                  const hasDiff = Boolean(log.oldData || log.newData);

                  return (
                    <tr
                      key={log.id}
                      data-testid={`audit-row-${log.id}`}
                      className="hover:bg-[#15181D]/60 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-mono text-zinc-200">
                            {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
                          >
                            <Icon size={11} />
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[160px]" title={log.action}>
                            {log.action}
                          </span>
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-white truncate">
                            {log.user?.name || log.user?.email || "System"}
                          </span>
                          {log.user?.email && log.user?.name && (
                            <span className="text-[10px] text-zinc-500 truncate font-mono">
                              {log.user.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Target Tenant */}
                      <td className="py-3 px-4">
                        {log.tenant ? (
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-zinc-200 truncate">
                              {log.tenant.name}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              @{log.tenant.slug}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-zinc-500">
                            Platform Wide
                          </span>
                        )}
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-[#181B1F] border border-[#242930] text-[10px]">
                            {log.entity}
                          </span>
                          {log.entityId && (
                            <span className="text-[10px] text-zinc-600 truncate max-w-[80px]" title={log.entityId}>
                              #{log.entityId.slice(0, 6)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {log.ipAddress}
                      </td>

                      {/* View Diff */}
                      <td className="py-3 px-4 text-right">
                        {hasDiff ? (
                          <button
                            onClick={() => setSelectedLogForDiff(log)}
                            data-testid={`view-diff-${log.id}`}
                            className="px-2.5 py-1 rounded bg-[#1C2025] hover:bg-amber-950/40 text-amber-300 hover:text-amber-200 border border-[#2B3037] hover:border-amber-500/40 text-[11px] font-medium transition-all inline-flex items-center gap-1 shadow-sm"
                          >
                            <Code size={11} />
                            <span>Inspect Diff</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-mono">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#1E2227] bg-[#14161B] flex items-center justify-between text-xs text-zinc-400">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total entries)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1 rounded bg-[#181B1F] hover:bg-[#20242A] border border-[#262B33] disabled:opacity-40 text-zinc-300"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-2.5 py-1 rounded bg-[#181B1F] hover:bg-[#20242A] border border-[#262B33] disabled:opacity-40 text-zinc-300"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Payload Diff Modal */}
      {selectedLogForDiff && (
        <div 
          data-testid="payload-diff-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[#0F1115] border border-[#1E2228] p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2228]">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Code size={15} className="text-amber-400" />
                  Security Payload Diff
                </h3>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  Action: {selectedLogForDiff.action} • Entity: {selectedLogForDiff.entity}
                </p>
              </div>
              <button
                onClick={() => setSelectedLogForDiff(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Old Data */}
              <div>
                <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1">
                  Previous State (oldData)
                </div>
                <pre className="p-3 rounded-xl bg-[#14161B] border border-[#1E2228] font-mono text-[11px] text-zinc-300 overflow-x-auto">
                  {selectedLogForDiff.oldData
                    ? JSON.stringify(selectedLogForDiff.oldData, null, 2)
                    : "// No prior record (Initial creation)"}
                </pre>
              </div>

              {/* New Data */}
              <div>
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                  Updated State (newData)
                </div>
                <pre className="p-3 rounded-xl bg-[#14161B] border border-[#1E2228] font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  {selectedLogForDiff.newData
                    ? JSON.stringify(selectedLogForDiff.newData, null, 2)
                    : "// No mutation payload recorded"}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1E2228] flex justify-end">
              <button
                onClick={() => setSelectedLogForDiff(null)}
                className="px-4 py-1.5 rounded-lg bg-[#181B1F] hover:bg-[#20242A] text-zinc-300 text-xs font-medium border border-[#262B33]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

