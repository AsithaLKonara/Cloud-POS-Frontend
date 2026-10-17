"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Layers,
  Building2,
  ArrowRightLeft,
  Calendar,
  AlertTriangle,
  Receipt,
  Download,
  Shield,
  CreditCard,
  Banknote,
  Wrench,
  Clock,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { useBranches } from "@/hooks/useInventory";
import { useExecutiveOverview } from "@/hooks/useAnalytics";
import { useAuthStore } from "@/store/auth.store";
import StockTransferModal from "@/components/admin/StockTransferModal";
import LossProfitTrendChart from "@/components/admin/LossProfitTrendChart";
import Link from "next/link";

export default function SuperAdminDashboard() {
  const [activeBranchId, setActiveBranchId] = useState<string>("");
  const [activePeriod, setActivePeriod] = useState<string>("This Month");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const { isSuperAdmin, isAdmin, hasPermission, isLoading: authLoading } = useAuthStore();
  const { data: branchesData } = useBranches();
  const branches: any[] = Array.isArray(branchesData) ? branchesData : (branchesData as any)?.data || [];

  const { data: overview, isLoading, refetch, isFetching } = useExecutiveOverview(activePeriod, activeBranchId || undefined);

  if (authLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto animate-pulse">
        <div className="h-12 bg-stone-100 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-stone-100 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  const canAccess = isSuperAdmin() || isAdmin() || hasPermission("reports:view_dashboard") || hasPermission("reports:view_financial");
  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-stone-200 rounded-2xl shadow-sm my-8 max-w-xl mx-auto">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 mb-4">
          <Shield size={32} />
        </div>
        <h2 className="font-inter font-bold text-xl text-stone-900 mb-2">Dashboard Restricted</h2>
        <p className="font-inter text-sm text-stone-500 leading-relaxed max-w-md">
          You do not have permission to view the executive central command. Contact system administration.
        </p>
      </div>
    );
  }

  const pnl = overview?.pnl || {
    netRevenue: 0,
    grossRevenue: 0,
    grossProfit: 0,
    grossMarginPercent: 0,
    netProfit: 0,
    netMarginPercent: 0,
    cogs: { totalCogs: 0, oilCogs: 0, nonOilCogs: 0 },
    operatingExpenses: { total: 0 },
    wastageLoss: 0,
    totalOrdersCount: 0,
  };

  const inv = overview?.inventory || {
    totalUnits: 0,
    valuationAtCost: 0,
    valuationAtRetail: 0,
    lowStockAlerts: 0,
    outOfStockCount: 0,
  };

  const branchMatrix: any[] = overview?.branchMatrix || [];
  const tenders: any[] = overview?.tenders || [];
  const transfers = overview?.transfers || { pendingApproval: 0, dispatchedInTransit: 0 };
  const recentTransactions: any[] = overview?.recentTransactions || [];

  const formatRs = (amount: number) => {
    return `Rs. ${(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCompactRs = (amount: number) => {
    const val = amount || 0;
    if (val >= 1000000) return `Rs. ${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `Rs. ${(val / 1000).toFixed(1)}K`;
    return `Rs. ${val.toFixed(0)}`;
  };

  return (
    <div className="flex flex-col p-4 md:p-8 max-w-[1440px] mx-auto w-full gap-8">
      {/* Top Header & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-slate-950 tracking-wider uppercase">
              EXECUTIVE COMMAND
            </span>
            <span className="text-xs text-muted font-mono">Consolidated Multi-Branch Network</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight font-poppins">
            Oil Retail ERP & POS Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector */}
          <select
            value={activeBranchId}
            onChange={(e) => setActiveBranchId(e.target.value)}
            className="bg-surface border border-border text-foreground text-sm font-semibold rounded-xl px-4 py-2.5 shadow-sm outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Branches ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>

          {/* Period Selector */}
          <select
            value={activePeriod}
            onChange={(e) => setActivePeriod(e.target.value)}
            className="bg-surface border border-border text-foreground text-sm font-semibold rounded-xl px-4 py-2.5 shadow-sm outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
          </select>

          {/* Quick Actions */}
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl shadow-sm transition-all"
          >
            <ArrowRightLeft size={16} /> New Transfer
          </button>

          <Link
            href="/admin/reports/pnl"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-surface border border-border hover:bg-background text-foreground text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <span>P&L Statement</span>
            <ExternalLink size={14} className="text-muted" />
          </Link>
        </div>
      </div>

      {/* Row 1: Executive Financial Performance KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-inter">
            Financial & Profitability Metrics ({activePeriod})
          </h2>
          {isFetching && <span className="text-xs text-amber-500 animate-pulse font-medium">Refreshing metrics...</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Net Sales Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold">
                <DollarSign size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-foreground tracking-tight">{formatCompactRs(pnl.netRevenue)}</div>
              <p className="text-xs text-muted mt-1 font-mono">{formatRs(pnl.netRevenue)}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
              <span>{pnl.totalOrdersCount} Completed Orders</span>
              <span className="text-emerald-500 font-bold">100% Volume</span>
            </div>
          </div>

          {/* COGS */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Cost of Goods (COGS)</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center font-bold">
                <Layers size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-foreground tracking-tight">{formatCompactRs(pnl.cogs.totalCogs)}</div>
              <p className="text-xs text-muted mt-1 font-mono">{formatRs(pnl.cogs.totalCogs)}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
              <span>Lubricants: {formatCompactRs(pnl.cogs.oilCogs)}</span>
              <span className="text-muted">Parts: {formatCompactRs(pnl.cogs.nonOilCogs)}</span>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Gross Profit</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold">
                <TrendingUp size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-foreground tracking-tight">{formatCompactRs(pnl.grossProfit)}</div>
              <p className="text-xs text-muted mt-1 font-mono">{formatRs(pnl.grossProfit)}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
              <span>Gross Margin</span>
              <span className="font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[11px]">
                {pnl.grossMarginPercent}%
              </span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Net Operating Profit</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold">
                <Receipt size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-foreground tracking-tight">{formatCompactRs(pnl.netProfit)}</div>
              <p className="text-xs text-muted mt-1 font-mono">{formatRs(pnl.netProfit)}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
              <span>After Expenses & Losses</span>
              <span className="font-extrabold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                {pnl.netMarginPercent}% Net
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1.5: Big Loss vs Profit & Revenue Line Chart */}
      <LossProfitTrendChart pnl={pnl} activePeriod={activePeriod} />

      {/* Row 2: Inventory Capital & Valuation KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-inter">
            Inventory Valuation & Working Capital
          </h2>
          <Link href="/admin/inventory" className="text-xs text-amber-500 font-semibold hover:underline flex items-center gap-1">
            Manage All Stock <ExternalLink size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stock Quantity */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Total Units / Liters</span>
              <Package size={16} className="text-muted" />
            </div>
            <div className="text-2xl font-black text-foreground tracking-tight">
              {inv.totalUnits.toLocaleString()}
            </div>
            <p className="text-xs text-muted mt-1">Cans, Drums, & Bulk Liters in Stock</p>
          </div>

          {/* Valuation at Cost */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Valuation at Cost</span>
              <DollarSign size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {formatCompactRs(inv.valuationAtCost)}
            </div>
            <p className="text-xs text-muted mt-1 font-mono">{formatRs(inv.valuationAtCost)} capital</p>
          </div>

          {/* Valuation at Retail */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Retail Sales Potential</span>
              <DollarSign size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCompactRs(inv.valuationAtRetail)}
            </div>
            <p className="text-xs text-muted mt-1 font-mono">{formatRs(inv.valuationAtRetail)}</p>
          </div>

          {/* Low Stock Alerts & Transfers */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Alerts & Transfers</span>
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <div className="flex items-center gap-4 my-1">
              <div>
                <span className="text-xl font-black text-red-500">{inv.lowStockAlerts}</span>
                <p className="text-[11px] text-muted">Low Stock</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div>
                <span className="text-xl font-black text-amber-500">{transfers.pendingApproval}</span>
                <p className="text-[11px] text-muted">Pending Transfers</p>
              </div>
            </div>
            <div className="text-[11px] text-muted pt-2 border-t border-border flex justify-between">
              <span>In Transit: {transfers.dispatchedInTransit}</span>
              <button onClick={() => setIsTransferModalOpen(true)} className="text-amber-500 font-bold hover:underline">
                Dispatch Stock →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Multi-Branch Performance Matrix */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-inter font-bold text-foreground text-lg flex items-center gap-2">
              <Building2 className="text-amber-500" size={20} />
              Branch Performance & Live Terminal Matrix
            </h2>
            <p className="font-inter text-xs text-muted mt-0.5">
              Comparative performance, stock valuation, and cashier terminal shifts across all stores
            </p>
          </div>
          <div className="text-xs font-mono text-muted bg-surface border border-border px-3 py-1.5 rounded-xl shadow-sm">
            {branches.length} Operational Branches
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-inter border-collapse">
            <thead className="bg-background/80 border-b border-border text-muted text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Branch</th>
                <th className="py-3.5 px-4 text-right">Revenue</th>
                <th className="py-3.5 px-4 text-center">Orders</th>
                <th className="py-3.5 px-4 text-right">Operating Expenses</th>
                <th className="py-3.5 px-4 text-right">Stock Valuation (Cost)</th>
                <th className="py-3.5 px-4 text-center">Low Stock</th>
                <th className="py-3.5 px-6 text-center">Active POS Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {branchMatrix.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    No branch data available for the selected period
                  </td>
                </tr>
              ) : (
                branchMatrix.map((b) => (
                  <tr key={b.branchId} className="hover:bg-background/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-foreground">{b.branchName}</div>
                      <div className="text-xs font-mono text-muted">{b.branchCode} · {b.phone || "No phone"}</div>
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-foreground">
                      {formatRs(b.revenue)}
                    </td>
                    <td className="py-4 px-4 text-center text-foreground font-semibold">
                      {b.ordersCount}
                    </td>
                    <td className="py-4 px-4 text-right text-muted font-mono text-xs">
                      {formatRs(b.expenses)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      {formatRs(b.inventoryCost)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {b.lowStockCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {b.lowStockCount} items
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {b.activeShift ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{b.activeShift.cashierName}</span>
                          <span className="text-[10px] text-muted font-mono">
                            ({formatCompactRs(b.activeShift.openingFloat)})
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                          <Clock size={12} /> Shift Closed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Two Columns (Tender Breakdown & Recent Transactions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Tenders Breakdown */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-inter font-bold text-foreground text-base mb-1">Payment Tender Distribution</h3>
            <p className="text-xs text-muted mb-5">Breakdown by cash, cards, and workshop credit accounts</p>

            <div className="flex flex-col gap-3.5">
              {tenders.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No payment records for this period</p>
              ) : (
                tenders.map((t) => {
                  const isCredit = t.method.includes("CREDIT") || t.method.includes("GARAGE");
                  const isCash = t.method.includes("CASH");
                  const isCard = t.method.includes("CARD");

                  return (
                    <div key={t.method} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2 text-foreground">
                          {isCash && <Banknote size={15} className="text-emerald-500" />}
                          {isCard && <CreditCard size={15} className="text-blue-500" />}
                          {isCredit && <Wrench size={15} className="text-amber-500" />}
                          {!isCash && !isCard && !isCredit && <Receipt size={15} className="text-muted" />}
                          <span>{t.method.replace("_", " ")}</span>
                          <span className="text-[11px] text-muted font-normal">({t.count} txns)</span>
                        </div>
                        <span className="font-mono text-foreground font-bold">{formatRs(t.amount)}</span>
                      </div>
                      <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border/40">
                        <div
                          className={`h-full rounded-full ${isCash ? 'bg-emerald-500' : isCard ? 'bg-blue-500' : isCredit ? 'bg-amber-500' : 'bg-muted'}`}
                          style={{ width: `${Math.max(5, t.percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>B2B Garage Credit Share</span>
            <span className="font-bold text-amber-500">
              {tenders.find(t => t.method.includes("CREDIT"))?.percentage || 0}% of Total Volume
            </span>
          </div>
        </div>

        {/* Recent B2B Oil Retail Transactions */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-5 border-b border-border bg-background/50 flex items-center justify-between">
            <div>
              <h3 className="font-inter font-bold text-foreground text-base">Recent Sales Transactions</h3>
              <p className="text-xs text-muted mt-0.5">Live lubricant sales across all store terminals</p>
            </div>
            <Link href="/admin/orders" className="text-xs text-amber-500 font-semibold hover:underline flex items-center gap-1">
              View All Orders <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-inter text-xs">
              <thead className="bg-background/80 border-b border-border text-muted font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Order / Time</th>
                  <th className="py-3 px-4">Customer / Garage</th>
                  <th className="py-3 px-4">Vehicle #</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-5 text-center">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted">
                      No recent transactions recorded
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-background/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-bold text-foreground">{tx.id.substring(0, 8)}</span>
                        <div className="text-[10px] text-muted">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {tx.customerName}
                        {tx.customerType === "GARAGE_WORKSHOP" && (
                          <span className="ml-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">· Garage</span>
                        )}
                        {tx.customerType === "COMMERCIAL_FLEET" && (
                          <span className="ml-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">· Fleet</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-muted">
                        {tx.vehicleNumber || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-muted font-medium">
                        {tx.branchName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-foreground">
                        {formatRs(tx.amount)}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="text-xs font-medium text-foreground/80">
                          {tx.paymentMethod.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Transfer Modal */}
      {isTransferModalOpen && (
        <StockTransferModal
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            refetch();
          }}
          initialFromBranchId={activeBranchId || undefined}
        />
      )}
    </div>
  );
}
