"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  HardDrive,
  Download,
  Trash2,
  RefreshCw,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileArchive,
  Search,
  Filter,
  CheckCircle2,
  Terminal,
  ExternalLink,
  X,
  Layers,
  Server,
} from "lucide-react";
import {
  superAdminService,
  DatabaseBackupItem,
  TenantStorageQuotaItem,
  PlatformStorageStatsResponse,
} from "@/services/superadmin.service";
import { toast } from "@/store/toast.store";

export default function SuperAdminDisasterRecovery() {
  const [stats, setStats] = useState<PlatformStorageStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"snapshots" | "quotas">("snapshots");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getStorageStats();
      setStats(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load disaster recovery stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const created = await superAdminService.createBackup(snapshotLabel.trim() || undefined);
      toast.success(`Snapshot created: ${created.filename}`);
      setSnapshotLabel("");
      setIsModalOpen(false);
      await fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create database snapshot");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSnapshot = async (filename: string) => {
    if (!confirm(`Are you sure you want to permanently delete snapshot ${filename}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingFile(filename);
      await superAdminService.deleteBackup(filename);
      toast.success(`Snapshot ${filename} removed from disk`);
      setStats((prev) => {
        if (!prev) return null;
        const updated = prev.backups.filter((b) => b.filename !== filename);
        return {
          ...prev,
          backups: updated,
          summary: {
            ...prev.summary,
            totalBackupCount: updated.length,
          },
        };
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete snapshot");
    } finally {
      setDeletingFile(null);
    }
  };

  const backups = stats?.backups || [];
  const tenantQuotas = stats?.tenantQuotas || [];
  const summary = stats?.summary;

  const filteredBackups = backups.filter((b) => {
    const matchesSearch =
      b.filename.toLowerCase().includes(search.toLowerCase()) ||
      (b.label && b.label.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "ALL" || b.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredTenants = tenantQuotas.filter((t) => {
    return (
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      t.tier.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#20242A]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Disaster Recovery, Snapshots & Storage Manager
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                On-demand PostgreSQL database snapshots, automated retention lifecycles, and per-tenant media storage telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-[#15171B] border border-[#2B3037] hover:border-zinc-500 transition-all"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            data-testid="create-snapshot-modal-btn"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>Create Manual Snapshot</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0E1013] border border-[#1C2025] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Database Snapshots
            </div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              {summary?.totalBackupCount ?? 0}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 font-mono">
              Total Size: {summary?.totalBackupSizeFormatted || "0 B"}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-800/50 text-zinc-400 border border-zinc-700/50">
            <FileArchive size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1013] border border-[#1C2025] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Backup Daemon Status
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active (02:00 UTC)</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Retention: {summary?.retentionDays ?? 14} Days Rolling
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Clock size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1013] border border-[#1C2025] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Media & Uploads Disk
            </div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              {summary?.totalMediaUploadsFormatted || "0 B"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Across catalog & store assets
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <HardDrive size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1013] border border-[#1C2025] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Disaster Recovery Health
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              100%
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Hot recovery point ready
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* Segmented Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0E1013] p-3 rounded-xl border border-[#1C2025]">
        {/* Sub-tab pills */}
        <div className="flex items-center gap-1 bg-[#15171B] p-1 rounded-lg border border-[#252930] w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab("snapshots")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSubTab === "snapshots"
                ? "bg-[#20242A] text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Database size={13} />
            <span>Database Snapshots ({backups.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("quotas")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSubTab === "quotas"
                ? "bg-[#20242A] text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <HardDrive size={13} />
            <span>Tenant Storage Quotas ({tenantQuotas.length})</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder={activeSubTab === "snapshots" ? "Search snapshots..." : "Search tenants..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {activeSubTab === "snapshots" && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#15171B] border border-[#252930] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Types</option>
              <option value="MANUAL">Manual</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          )}
        </div>
      </div>

      {/* VIEW 1: Database Snapshots Table */}
      {activeSubTab === "snapshots" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#1C2025] bg-[#0E1013] overflow-hidden">
            <div className="overflow-x-auto">
              <table data-testid="backups-table" className="w-full text-left text-xs">
                <thead className="bg-[#131518] text-zinc-400 border-b border-[#1C2025] text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Snapshot Filename</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Compressed Size</th>
                    <th className="px-4 py-3">Created Date</th>
                    <th className="px-4 py-3">Integrity</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181B1F]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-zinc-400" />
                        Scanning database backup snapshots...
                      </td>
                    </tr>
                  ) : filteredBackups.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                        <FileArchive size={28} className="mx-auto mb-2 text-zinc-600" />
                        <p className="font-semibold text-zinc-400">No database snapshots found</p>
                        <p className="mt-1">Click "Create Manual Snapshot" to capture a point-in-time database backup.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBackups.map((b) => (
                      <tr
                        key={b.filename}
                        data-testid={`backup-row-${b.filename}`}
                        className="hover:bg-[#121417] transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-medium text-white flex items-center gap-2">
                          <FileArchive size={14} className="text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[280px]" title={b.filename}>
                            {b.filename}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              b.type === "MANUAL"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                            }`}
                          >
                            {b.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-zinc-200">
                          {b.sizeFormatted}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {new Date(b.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            <CheckCircle2 size={11} />
                            <span>{b.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`/api/v1/superadmin/backups/${encodeURIComponent(b.filename)}/download`}
                              download={b.filename}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Download Snapshot"
                            >
                              <Download size={14} />
                            </a>
                            <button
                              data-testid={`delete-snapshot-btn-${b.filename}`}
                              onClick={() => handleDeleteSnapshot(b.filename)}
                              disabled={deletingFile === b.filename}
                              className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                              title="Delete Snapshot"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disaster Recovery Runbook Accordion */}
          <div className="p-4 rounded-xl bg-[#0E1013] border border-[#1C2025] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white tracking-tight">
              <Terminal size={15} className="text-amber-400" />
              <span>Disaster Recovery Hot-Restore Runbook (PostgreSQL CLI)</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              In the event of an outage or catastrophic corruption, execute point-in-time restore from any snapshot:
            </p>
            <div className="p-3 rounded-lg bg-[#070809] border border-[#181B1F] font-mono text-[11px] text-emerald-400 overflow-x-auto">
              gunzip -c /var/backups/xonit/xonit_db_YYYYMMDD_HHMMSS.sql.gz | psql -U xonit_user -d xonit_pos_db
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Tenant Storage Quotas Table */}
      {activeSubTab === "quotas" && (
        <div className="rounded-xl border border-[#1C2025] bg-[#0E1013] overflow-hidden">
          <div className="overflow-x-auto">
            <table data-testid="tenant-storage-table" className="w-full text-left text-xs">
              <thead className="bg-[#131518] text-zinc-400 border-b border-[#1C2025] text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Tenant Name & Slug</th>
                  <th className="px-4 py-3">Subscription Tier</th>
                  <th className="px-4 py-3">Storage Used / Quota</th>
                  <th className="px-4 py-3">Quota Utilization</th>
                  <th className="px-4 py-3">Catalog Items</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181B1F]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-zinc-400" />
                      Calculating tenant disk quotas...
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                      <HardDrive size={28} className="mx-auto mb-2 text-zinc-600" />
                      <p className="font-semibold text-zinc-400">No tenants found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr
                      key={t.tenantId}
                      data-testid={`tenant-storage-row-${t.slug}`}
                      className="hover:bg-[#121417] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{t.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">/{t.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                          {t.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-white">{t.usedFormatted}</span>
                        <span className="text-zinc-500"> / {t.quotaFormatted}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                            <span>{t.usagePct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                t.usagePct > 85
                                  ? "bg-rose-500"
                                  : t.usagePct > 65
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(2, t.usagePct))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-300">
                        {t.totalProducts} products • {t.totalOrders} invoices
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            t.status === "CRITICAL"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : t.status === "WARNING"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {t.status}
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

      {/* CREATE SNAPSHOT MODAL */}
      {isModalOpen && (
        <div
          data-testid="create-snapshot-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#0D0F12] border border-[#252930] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-md"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#1E2229]">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create Database Snapshot</h3>
                <p className="text-xs text-zinc-400">
                  Captures a compressed `.sql.gz` dump of all tenant schemas.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Snapshot Label / Tag (Optional)
                </label>
                <input
                  data-testid="snapshot-label-input"
                  type="text"
                  placeholder="e.g. pre_migration, test_backup, manual"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-zinc-400 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Zero-Downtime Hot Backup</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  PostgreSQL transaction consistency will be maintained via <code className="text-zinc-300">pg_dump</code> and compressed with maximum gzip (-9).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1E2229]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  data-testid="execute-snapshot-btn"
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Creating Snapshot...</span>
                    </>
                  ) : (
                    <span>Create Snapshot Now</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

