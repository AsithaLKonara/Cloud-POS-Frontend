"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Boxes,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Barcode,
  Save,
  Scale,
  FileCheck,
  Building2,
  X,
  PlusCircle,
  MinusCircle,
  Eye,
  Check
} from "lucide-react";
import { erpService, StocktakeSession, StocktakeItem } from "@/services/erp.service";
import { useBranches } from "@/hooks/useInventory";

export default function StocktakingPage() {
  const [sessions, setSessions] = useState<StocktakeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Session Audit Workspace
  const [activeSession, setActiveSession] = useState<StocktakeSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [varianceFilter, setVarianceFilter] = useState<'ALL' | 'VARIANCE_ONLY' | 'UNCOUNTED'>('ALL');

  // Pagination states for high-volume inventory items
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Local Counts editing buffer: { [variantId]: number }
  const [countsBuffer, setCountsBuffer] = useState<Record<string, number | "">>({});
  const [savingCounts, setSavingCounts] = useState(false);

  // Start Session Modal
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [startingSession, setStartingSession] = useState(false);

  // Reconcile Modal
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [managerNotes, setManagerNotes] = useState("Stocktake physical audit verified and approved.");
  const [reconciling, setReconciling] = useState(false);

  const { data: realBranches } = useBranches();

  const loadSessions = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await erpService.getStocktakeSessions();
      setSessions(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to load stocktake sessions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const openSessionDetail = async (sessionId: string) => {
    setSessionLoading(true);
    try {
      const detail = await erpService.getStocktakeSession(sessionId);
      setActiveSession(detail);

      // Initialize buffer from existing items
      const buffer: Record<string, number | ""> = {};
      (detail.items || []).forEach(it => {
        if (it.countedQuantity !== null && it.countedQuantity !== undefined) {
          buffer[it.variantId] = it.countedQuantity;
        }
      });
      setCountsBuffer(buffer);
    } catch (err: any) {
      alert("Failed to load session details: " + err.message);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || !sessionTitle) return;

    try {
      setStartingSession(true);
      const newSession = await erpService.startStocktake({
        branchId: selectedBranchId,
        title: sessionTitle,
        notes: sessionNotes || undefined
      });
      setStartModalOpen(false);
      setSessionTitle("");
      setSessionNotes("");
      await loadSessions(true);
      await openSessionDetail(newSession.id);
    } catch (err: any) {
      alert("Failed to start stocktake: " + (err.response?.data?.error || err.message));
    } finally {
      setStartingSession(false);
    }
  };

  const handleCountChange = (variantId: string, val: string) => {
    setCountsBuffer(prev => ({
      ...prev,
      [variantId]: val === "" ? "" : Math.max(0, parseInt(val) || 0)
    }));
  };

  const handleQuickAdjust = (variantId: string, delta: number, currentVal: number) => {
    const existing = countsBuffer[variantId] !== undefined && countsBuffer[variantId] !== ""
      ? Number(countsBuffer[variantId])
      : currentVal;
    setCountsBuffer(prev => ({
      ...prev,
      [variantId]: Math.max(0, existing + delta)
    }));
  };

  const handleMatchSystem = (variantId: string, systemQty: number) => {
    setCountsBuffer(prev => ({
      ...prev,
      [variantId]: systemQty
    }));
  };

  const handleSaveCounts = async () => {
    if (!activeSession) return;
    try {
      setSavingCounts(true);
      const payload = Object.entries(countsBuffer)
        .filter(([_, qty]) => qty !== "")
        .map(([variantId, qty]) => ({
          variantId,
          countedQty: Number(qty)
        }));

      if (payload.length === 0) {
        alert("No counts entered to save.");
        return;
      }

      await erpService.recordCounts(activeSession.id, payload);
      await openSessionDetail(activeSession.id);
      alert("Counts saved successfully.");
    } catch (err: any) {
      alert("Failed to save counts: " + (err.response?.data?.error || err.message));
    } finally {
      setSavingCounts(false);
    }
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    try {
      setReconciling(true);
      // Auto-save any unsaved counts first
      const payload = Object.entries(countsBuffer)
        .filter(([_, qty]) => qty !== "")
        .map(([variantId, qty]) => ({
          variantId,
          countedQty: Number(qty)
        }));
      if (payload.length > 0) {
        await erpService.recordCounts(activeSession.id, payload);
      }

      const updated = await erpService.reconcileStocktake(activeSession.id, managerNotes);
      setActiveSession(updated);
      setReconcileModalOpen(false);
      await loadSessions(true);
      alert("Stocktake successfully reconciled! Inventory updated and GL entries posted.");
    } catch (err: any) {
      alert("Reconciliation failed: " + (err.response?.data?.error || err.message));
    } finally {
      setReconciling(false);
    }
  };

  // Filter items in active session
  const filteredItems = useMemo(() => {
    if (!activeSession?.items) return [];
    return activeSession.items.filter(it => {
      const q = itemSearchQuery.toLowerCase();
      const nameMatch = (it.productTitle || "").toLowerCase().includes(q) ||
        (it.variantName || "").toLowerCase().includes(q);
      const skuMatch = (it.sku || "").toLowerCase().includes(q) ||
        (it.barcode || "").toLowerCase().includes(q);
      const matchesSearch = !q || nameMatch || skuMatch;

      if (!matchesSearch) return false;

      const currentCount = countsBuffer[it.variantId] !== undefined && countsBuffer[it.variantId] !== ""
        ? Number(countsBuffer[it.variantId])
        : it.countedQuantity;

      if (varianceFilter === 'VARIANCE_ONLY') {
        if (currentCount === null || currentCount === undefined) return false;
        return currentCount !== it.systemQuantity;
      }

      if (varianceFilter === 'UNCOUNTED') {
        return currentCount === null || currentCount === undefined;
      }

      return true;
    });
  }, [activeSession, itemSearchQuery, varianceFilter, countsBuffer]);

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [itemSearchQuery, varianceFilter]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    if (pageSize >= 9999) return filteredItems;
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Aggregate audit calculations
  const { totalItems, countedCount, netVarianceValue, totalShrinkageVal, totalSurplusVal } = useMemo(() => {
    if (!activeSession?.items) return { totalItems: 0, countedCount: 0, netVarianceValue: 0, totalShrinkageVal: 0, totalSurplusVal: 0 };
    let counted = 0;
    let netVal = 0;
    let shrinkage = 0;
    let surplus = 0;

    for (const it of activeSession.items) {
      const c = countsBuffer[it.variantId] !== undefined && countsBuffer[it.variantId] !== ""
        ? Number(countsBuffer[it.variantId])
        : it.countedQuantity;

      if (c !== null && c !== undefined) {
        counted++;
        const variance = c - it.systemQuantity;
        const lineVal = variance * (it.unitCost || 0);
        netVal += lineVal;
        if (lineVal < 0) shrinkage += Math.abs(lineVal);
        else surplus += lineVal;
      }
    }

    return {
      totalItems: activeSession.items.length,
      countedCount: counted,
      netVarianceValue: netVal,
      totalShrinkageVal: shrinkage,
      totalSurplusVal: surplus
    };
  }, [activeSession, countsBuffer]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Physical Stocktaking & Cycle Counting
            </h1>
            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              Inventory Reconciliation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Freeze branch inventory snapshots, conduct physical counts, and reconcile shrinkage directly to the General Ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSessions(true)}
            disabled={refreshing}
            className="p-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-border text-foreground rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setStartModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>Start Stocktake</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Total Audits</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Boxes size={15} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground mt-2">
            {sessions.length}
          </div>
          <p className="text-[11px] text-muted mt-1">Lifetime stocktake sessions</p>
        </div>

        <div className="bg-surface border border-amber-500/20 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-500 mt-2">
            {sessions.filter(s => s.status === 'IN_PROGRESS').length}
          </div>
          <p className="text-[11px] text-muted mt-1">Active counting workspaces</p>
        </div>

        <div className="bg-surface border border-emerald-500/20 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Reconciled</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-500 mt-2">
            {sessions.filter(s => s.status === 'RECONCILED').length}
          </div>
          <p className="text-[11px] text-muted mt-1">Posted to General Ledger</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Outlets Audited</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Building2 size={15} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground mt-2">
            {new Set(sessions.map(s => s.branchId)).size}
          </div>
          <p className="text-[11px] text-muted mt-1">Unique store locations</p>
        </div>
      </div>

      {/* Main Grid: Left Sessions List, Right Workspace or Sessions Table */}
      {!activeSession ? (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground">Stocktake Sessions Register</h3>
              <p className="text-xs text-muted">Click any session to open the physical count workspace</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/80 border-b border-border text-muted font-semibold">
                <tr>
                  <th className="py-3 px-4">Session Title</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Snapshot Date</th>
                  <th className="py-3 px-4 text-center">Items Frozen</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((sess) => (
                  <tr
                    key={sess.id}
                    onClick={() => openSessionDetail(sess.id)}
                    className="hover:bg-background/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {sess.title}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {sess.branchName || `Branch #${sess.branchId.slice(0, 8)}`}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {new Date(sess.snapshotAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-foreground">
                      {sess._count?.items || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        sess.status === 'RECONCILED'
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : sess.status === 'IN_PROGRESS'
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-neutral-800 text-neutral-300 border-neutral-700"
                      }`}>
                        {sess.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openSessionDetail(sess.id);
                        }}
                        className="flex items-center gap-1 mx-auto px-2.5 py-1 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-border rounded-lg text-[11px] font-semibold text-foreground transition-colors"
                      >
                        <Eye size={12} />
                        <span>{sess.status === 'RECONCILED' ? "View Audit" : "Count"}</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-muted">
                      No stocktaking sessions recorded. Click <strong>"Start Stocktake"</strong> to initiate an audit.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Active Session Counting Workspace */
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <button
                  onClick={() => setActiveSession(null)}
                  className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1 mb-1.5"
                >
                  ← Back to Sessions Register
                </button>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-foreground">{activeSession.title}</h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    activeSession.status === 'RECONCILED'
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }`}>
                    {activeSession.status}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {activeSession.branchName || "Branch"} • Snapshot frozen: {new Date(activeSession.snapshotAt).toLocaleString()}
                </p>
              </div>

              {activeSession.status === 'IN_PROGRESS' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveCounts}
                    disabled={savingCounts}
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-border text-foreground rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Save size={14} className={savingCounts ? "animate-spin" : ""} />
                    <span>Save Draft Counts</span>
                  </button>

                  <button
                    onClick={() => setReconcileModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <FileCheck size={14} />
                    <span>Reconcile to General Ledger</span>
                  </button>
                </div>
              )}
            </div>

            {/* Audit Progress Bar & Variance Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-background/50 border border-border rounded-xl p-3.5 text-xs">
              <div>
                <span className="text-muted text-[11px] font-medium block">Audit Progress</span>
                <span className="font-bold text-foreground text-sm">
                  {countedCount} / {totalItems} items counted ({totalItems > 0 ? Math.round((countedCount / totalItems) * 100) : 0}%)
                </span>
                <div className="w-full bg-border h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{ width: `${totalItems > 0 ? (countedCount / totalItems) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <span className="text-muted text-[11px] font-medium block">Total Inventory Shrinkage</span>
                <span className="font-mono font-bold text-rose-500 text-sm">
                  Rs. {totalShrinkageVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-muted block mt-0.5">Missing stock loss</span>
              </div>

              <div>
                <span className="text-muted text-[11px] font-medium block">Total Inventory Surplus</span>
                <span className="font-mono font-bold text-emerald-500 text-sm">
                  Rs. {totalSurplusVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-muted block mt-0.5">Unrecorded stock gain</span>
              </div>

              <div>
                <span className="text-muted text-[11px] font-medium block">Net P&L Balance Impact</span>
                <span className={`font-mono font-bold text-sm ${netVarianceValue < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  Rs. {netVarianceValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-muted block mt-0.5">Account 6100 Shrinkage</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Scan barcode, SKU, or search item name..."
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'All Items' },
                  { id: 'VARIANCE_ONLY', label: 'Variances Only' },
                  { id: 'UNCOUNTED', label: 'Uncounted' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setVarianceFilter(f.id as any)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                      varianceFilter === f.id
                        ? "bg-amber-500 text-white"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items Counting Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-background/80 border-b border-border text-muted font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Product Title & SKU</th>
                    <th className="py-2.5 px-3 text-center w-24">System Qty</th>
                    <th className="py-2.5 px-3 text-center w-48">Physical Count</th>
                    <th className="py-2.5 px-3 text-center w-24">Variance</th>
                    <th className="py-2.5 px-3 text-right w-28">Unit Cost</th>
                    <th className="py-2.5 px-3 text-right w-32">Financial Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedItems.map((item) => {
                    const currentCount = countsBuffer[item.variantId] !== undefined && countsBuffer[item.variantId] !== ""
                      ? Number(countsBuffer[item.variantId])
                      : item.countedQuantity;

                    const isCounted = currentCount !== null && currentCount !== undefined;
                    const variance = isCounted ? (currentCount - item.systemQuantity) : null;
                    const impactVal = variance !== null ? (variance * (item.unitCost || 0)) : null;

                    return (
                      <tr key={item.id} className="hover:bg-background/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-foreground">{item.productTitle || "Product Item"}</div>
                          <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{item.sku || "-"}</span>
                            {item.barcode && <span className="font-mono text-[10px]">[{item.barcode}]</span>}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold text-foreground">
                          {item.systemQuantity}
                        </td>

                        <td className="py-2.5 px-3">
                          {activeSession.status === 'IN_PROGRESS' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleQuickAdjust(item.variantId, -1, item.systemQuantity)}
                                className="p-1 rounded-lg bg-background hover:bg-neutral-200 dark:hover:bg-neutral-800 text-muted hover:text-foreground border border-border"
                                title="-1"
                              >
                                <MinusCircle size={13} />
                              </button>

                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={countsBuffer[item.variantId] !== undefined ? countsBuffer[item.variantId] : (item.countedQuantity ?? "")}
                                onChange={(e) => handleCountChange(item.variantId, e.target.value)}
                                className="w-16 bg-background border border-border focus:border-amber-500 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-xs focus:outline-none"
                              />

                              <button
                                onClick={() => handleQuickAdjust(item.variantId, 1, item.systemQuantity)}
                                className="p-1 rounded-lg bg-background hover:bg-neutral-200 dark:hover:bg-neutral-800 text-muted hover:text-foreground border border-border"
                                title="+1"
                              >
                                <PlusCircle size={13} />
                              </button>

                              <button
                                onClick={() => handleMatchSystem(item.variantId, item.systemQuantity)}
                                className="px-1.5 py-1 rounded bg-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[10px] text-muted hover:text-foreground border border-border"
                                title="Set to system qty"
                              >
                                Match
                              </button>
                            </div>
                          ) : (
                            <div className="text-center font-mono font-bold text-foreground">
                              {item.countedQuantity ?? "-"}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          {variance === null ? (
                            <span className="text-muted text-[11px] font-normal">Pending</span>
                          ) : variance === 0 ? (
                            <span className="text-emerald-500">0</span>
                          ) : variance > 0 ? (
                            <span className="text-amber-500 font-bold">+{variance}</span>
                          ) : (
                            <span className="text-rose-500 font-bold">{variance}</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-muted">
                          Rs. {item.unitCost.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {impactVal === null ? (
                            "-"
                          ) : impactVal === 0 ? (
                            <span className="text-muted">Rs. 0.00</span>
                          ) : impactVal < 0 ? (
                            <span className="text-rose-500">-Rs. {Math.abs(impactVal).toFixed(2)}</span>
                          ) : (
                            <span className="text-emerald-500">+Rs. {impactVal.toFixed(2)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted">
                        No items match the search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredItems.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-muted border-t border-border">
                <div className="flex items-center gap-2">
                  <span>
                    Showing {Math.min((currentPage - 1) * pageSize + 1, filteredItems.length)} - {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} items
                  </span>
                  <span className="text-border">|</span>
                  <label className="flex items-center gap-1.5">
                    <span>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={99999}>All</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 bg-surface border border-border rounded-lg disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    « First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 bg-surface border border-border rounded-lg disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    ‹ Prev
                  </button>
                  <span className="px-3 py-1 font-semibold text-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-2.5 py-1 bg-surface border border-border rounded-lg disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Next ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="px-2 py-1 bg-surface border border-border rounded-lg disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Last »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Start Stocktake */}
      {startModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Initiate Physical Stocktake</h3>
                <p className="text-xs text-muted">Freezes an instantaneous inventory snapshot</p>
              </div>
              <button
                onClick={() => setStartModalOpen(false)}
                className="p-1.5 text-muted hover:text-foreground rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStartSession} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Select Branch / Outlet *</label>
                <select
                  required
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="">Select Branch...</option>
                  {(realBranches || []).map((br: any) => (
                    <option key={br.id} value={br.id}>
                      {br.name} ({br.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Audit Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Main Store Physical Cycle Count"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Auditor Notes</label>
                <textarea
                  placeholder="e.g. Annual audit led by External Controller. Cut-off time 18:00."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStartModalOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted hover:text-foreground text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={startingSession || !selectedBranchId || !sessionTitle}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  {startingSession ? "Freezing Snapshot..." : "Freeze & Start Count"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reconcile Stocktake Confirmation */}
      {reconcileModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Reconcile Stocktake & Post to GL</h3>
                <p className="text-xs text-muted">Final sign-off by Inventory Manager</p>
              </div>
              <button
                onClick={() => setReconcileModalOpen(false)}
                className="p-1.5 text-muted hover:text-foreground rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReconcileSubmit} className="p-5 space-y-4">
              <div className="bg-background/80 border border-border rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Total Items Audited:</span>
                  <span className="font-semibold text-foreground font-mono">{countedCount} / {totalItems}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Total Shrinkage (Loss):</span>
                  <span className="font-semibold text-rose-500 font-mono">Rs. {totalShrinkageVal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Total Surplus (Gain):</span>
                  <span className="font-semibold text-emerald-500 font-mono">Rs. {totalSurplusVal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 font-bold text-foreground">
                  <span>Net Ledger Impact:</span>
                  <span className={`font-mono ${netVarianceValue < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                    Rs. {netVarianceValue.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                <p className="font-semibold mb-1">Accounting & Audit Ledger Protocol:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  <li>Adjusts live physical stock quantities to match physical counts.</li>
                  <li>Generates immutable <strong>CYCLE_COUNT_RECONCILIATION</strong> inventory transactions.</li>
                  <li>Posts automatic double-entry journal entry to <strong>6100 Shrinkage / 1200 Inventory</strong>.</li>
                </ul>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Manager Sign-off Notes *</label>
                <textarea
                  required
                  rows={2}
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReconcileModalOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted hover:text-foreground text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reconciling}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  {reconciling ? "Posting Reconciliation..." : "Confirm & Post Reconciliation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

