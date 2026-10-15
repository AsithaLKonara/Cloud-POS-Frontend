"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import { usePnLStatement } from "@/hooks/usePnL";
import { useBranches } from "@/hooks/useInventory";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Building2,
  Calendar,
  AlertTriangle,
  Receipt,
  Download,
  Filter,
  RefreshCw,
  Droplets,
  Layers,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function PnLPageClient() {
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [datePreset, setDatePreset] = useState<"TODAY" | "MONTH" | "QUARTER" | "YEAR" | "ALL">("MONTH");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const { data: branchesData } = useBranches();
  const branches = Array.isArray(branchesData) ? branchesData : (branchesData as any)?.data || [];

  // Calculate start/end date based on preset
  const { startDate, endDate } = useMemo(() => {
    if (datePreset === "ALL") return { startDate: undefined, endDate: undefined };
    if (customStartDate || customEndDate) return { startDate: customStartDate || undefined, endDate: customEndDate || undefined };

    const now = new Date();
    if (datePreset === "TODAY") {
      const todayStr = now.toISOString().split("T")[0];
      return { startDate: `${todayStr}T00:00:00.000Z`, endDate: `${todayStr}T23:59:59.999Z` };
    }
    if (datePreset === "MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { startDate: firstDay, endDate: now.toISOString() };
    }
    if (datePreset === "QUARTER") {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const firstDay = new Date(now.getFullYear(), quarterStartMonth, 1).toISOString();
      return { startDate: firstDay, endDate: now.toISOString() };
    }
    if (datePreset === "YEAR") {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString();
      return { startDate: firstDay, endDate: now.toISOString() };
    }
    return { startDate: undefined, endDate: undefined };
  }, [datePreset, customStartDate, customEndDate]);

  const { data: pnlData, isLoading, refetch, isFetching } = usePnLStatement({
    branchId: selectedBranch || undefined,
    startDate,
    endDate,
  });

  const summary = pnlData?.summary || {
    totalOrdersCount: 0,
    grossRevenue: 0,
    totalDiscounts: 0,
    totalTaxes: 0,
    netRevenue: 0,
    cogs: { totalCogs: 0, oilCogs: 0, nonOilCogs: 0, oilRevenue: 0, nonOilRevenue: 0 },
    grossProfit: 0,
    grossMarginPercent: 0,
    operatingExpenses: { total: 0, breakdown: [] },
    wastageLoss: 0,
    netProfit: 0,
    netMarginPercent: 0,
  };

  const branchComparison = pnlData?.branchComparison || [];

  const formatRs = (amount: number) => {
    return `Rs. ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex flex-col p-4 md:p-8 max-w-[1400px] mx-auto w-full gap-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 tracking-wider uppercase">
              Executive Analytics
            </span>
            <span className="text-xs text-stone-400 font-mono">Consolidated Multi-Branch P&L</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight font-poppins">
            Profit & Loss (P&L) Statement
          </h1>
          <p className="text-sm text-stone-500 font-inter">
            Authoritative Gross Margin, COGS, Operational Overhead, and Net Retail Profit.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Selector */}
          <div className="flex items-center bg-white border border-stone-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Building2 size={16} className="text-stone-400 mr-2 shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-sm font-inter text-stone-800 outline-none cursor-pointer pr-2"
            >
              <option value="">All Branches Network</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Preset Buttons */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-inter font-semibold">
            {(
              [
                { id: "TODAY", label: "Today" },
                { id: "MONTH", label: "This Month" },
                { id: "QUARTER", label: "Quarter" },
                { id: "YEAR", label: "Year" },
                { id: "ALL", label: "All Time" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setDatePreset(p.id);
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  datePreset === p.id && !customStartDate
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all shadow-sm disabled:opacity-50"
            title="Refresh P&L calculation"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin text-amber-600" : ""} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-stone-200">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-inter text-stone-500 font-medium">Computing canonical P&L ledger...</p>
        </div>
      ) : (
        <>
          {/* Top Primary Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Net Revenue */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-inter">Net Revenue</span>
                <span className="p-2 bg-stone-100 rounded-lg text-stone-700">
                  <Receipt size={16} />
                </span>
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-extrabold text-stone-900 font-mono tracking-tight">
                  {formatRs(summary.netRevenue)}
                </span>
                <p className="text-xs text-stone-500 mt-1 font-inter">
                  From {summary.totalOrdersCount} completed POS sales
                </p>
              </div>
            </div>

            {/* Total COGS */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-inter">Cost of Goods (COGS)</span>
                <span className="p-2 bg-stone-100 rounded-lg text-stone-700">
                  <Layers size={16} />
                </span>
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-extrabold text-stone-700 font-mono tracking-tight">
                  {formatRs(summary.cogs.totalCogs)}
                </span>
                <p className="text-xs text-stone-500 mt-1 font-inter">
                  Oil: {formatRs(summary.cogs.oilCogs)} · Non-Oil: {formatRs(summary.cogs.nonOilCogs)}
                </p>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-inter">Gross Profit</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 font-mono">
                  {summary.grossMarginPercent}% Margin
                </span>
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
                  {formatRs(summary.grossProfit)}
                </span>
                <p className="text-xs text-stone-500 mt-1 font-inter">Net Revenue minus Inventory Cost</p>
              </div>
            </div>

            {/* Net Retail Profit */}
            <div className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
              summary.netProfit >= 0 ? "bg-stone-900 border-stone-900 text-white" : "bg-rose-950 border-rose-900 text-white"
            }`}>
              <div className="flex items-center justify-between text-stone-300 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-inter">Net Retail Profit</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                  summary.netProfit >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-300"
                }`}>
                  {summary.netMarginPercent}% Net
                </span>
              </div>
              <div>
                <span className={`text-2xl lg:text-3xl font-extrabold font-mono tracking-tight ${
                  summary.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {formatRs(summary.netProfit)}
                </span>
                <p className="text-xs text-stone-400 mt-1 font-inter">
                  After Expenses ({formatRs(summary.operatingExpenses.total)}) & Wastage
                </p>
              </div>
            </div>
          </div>

          {/* Section: Category Revenue & COGS Split (Oils vs Non-Oil) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Oil vs Non-Oil Breakdown */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base font-poppins text-stone-900 flex items-center gap-2">
                    <Droplets size={18} className="text-amber-600" />
                    Oils vs Non-Oil Revenue Split
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Oils Stream */}
                  <div>
                    <div className="flex justify-between text-xs font-inter font-semibold mb-1.5">
                      <span className="text-stone-700">🛢️ Oils & Lubricants</span>
                      <span className="text-stone-900 font-mono">{formatRs(summary.cogs.oilRevenue)}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-600 h-2.5 rounded-full"
                        style={{
                          width: `${
                            summary.netRevenue > 0
                              ? Math.min(100, (summary.cogs.oilRevenue / summary.netRevenue) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono mt-1 block">
                      COGS: {formatRs(summary.cogs.oilCogs)} (Gross: {formatRs(summary.cogs.oilRevenue - summary.cogs.oilCogs)})
                    </span>
                  </div>

                  {/* Non-Oil Items Stream */}
                  <div>
                    <div className="flex justify-between text-xs font-inter font-semibold mb-1.5">
                      <span className="text-stone-700">⚙️ Non-Oil Items (Filters, Batteries, Spares)</span>
                      <span className="text-stone-900 font-mono">{formatRs(summary.cogs.nonOilRevenue)}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${
                            summary.netRevenue > 0
                              ? Math.min(100, (summary.cogs.nonOilRevenue / summary.netRevenue) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono mt-1 block">
                      COGS: {formatRs(summary.cogs.nonOilCogs)} (Gross: {formatRs(summary.cogs.nonOilRevenue - summary.cogs.nonOilCogs)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Wastage / Leakage Alert */}
              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-500" />
                  Spillage & Leakage Losses:
                </span>
                <span className="font-mono font-bold text-rose-600">
                  {formatRs(summary.wastageLoss)}
                </span>
              </div>
            </div>

            {/* Operating Expenses Breakdown */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base font-poppins text-stone-900 flex items-center gap-2">
                      <Building2 size={18} className="text-stone-700" />
                      Branch Operating Overhead
                    </h3>
                    <p className="text-xs text-stone-500 font-inter">
                      Total: {formatRs(summary.operatingExpenses.total)}
                    </p>
                  </div>
                </div>

                {summary.operatingExpenses.breakdown.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-400 font-inter">
                    No operating expenses logged for this period.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {summary.operatingExpenses.breakdown.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                            {exp.category}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {exp.percentageOfExpenses.toFixed(1)}% of expenses
                          </span>
                        </div>
                        <span className="font-mono font-bold text-stone-900 text-sm">
                          {formatRs(exp.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Multi-Branch Profitability Comparison Table (When viewing All Branches) */}
          {branchComparison.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div>
                  <h3 className="font-bold text-base font-poppins text-stone-900">
                    Inter-Branch Profitability Comparison
                  </h3>
                  <p className="text-xs text-stone-500 font-inter">
                    Real-time financial yield comparison across all active retail locations.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-100/50 text-[11px] font-bold text-stone-600 uppercase tracking-wider font-inter">
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4 text-right">Revenue</th>
                      <th className="py-3 px-4 text-right">Expenses</th>
                      <th className="py-3 px-4 text-right">Estimated Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm font-inter">
                    {branchComparison.map((b) => (
                      <tr key={b.branchId} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-stone-900">{b.branchName}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-stone-500">{b.branchCode}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900">
                          {formatRs(b.revenue)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                          {formatRs(b.expenses)}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                          b.estimatedNet >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {formatRs(b.estimatedNet)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
