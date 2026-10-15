"use client";

import { useState } from "react";
import {
  Building2,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ArrowRightLeft,
  Clock,
  AlertTriangle,
  Receipt,
  CreditCard,
  Banknote,
  Wrench,
  CheckCircle2,
  ShoppingCart,
  Send,
  Download,
  Shield,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { useBranchDashboard } from "@/hooks/useAnalytics";
import { useBranches, useUpdateTransferStatus } from "@/hooks/useInventory";
import { useAuthStore } from "@/store/auth.store";
import StockTransferModal from "@/components/admin/StockTransferModal";
import Link from "next/link";

export default function BranchAdminPage() {
  const { user, isSuperAdmin, isAdmin } = useAuthStore();
  const { data: branchesData } = useBranches();
  const branches: any[] = Array.isArray(branchesData) ? branchesData : (branchesData as any)?.data || [];

  // If user is superadmin/admin, allow selecting branch, otherwise locked to user's branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const activeBranchId = selectedBranchId || user?.branchId || (branches.length > 0 ? branches[0].id : "");

  const { data: dashboard, isLoading, refetch, isFetching } = useBranchDashboard(activeBranchId || undefined);
  const updateTransferStatus = useUpdateTransferStatus();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const formatRs = (amount: number) => {
    return `Rs. ${(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCompactRs = (amount: number) => {
    const val = amount || 0;
    if (val >= 1000000) return `Rs. ${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `Rs. ${(val / 1000).toFixed(1)}K`;
    return `Rs. ${val.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto animate-pulse">
        <div className="h-14 bg-stone-100 rounded-2xl w-1/2"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-stone-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const branch = dashboard?.branch || {
    name: "Branch Terminal",
    code: "BR",
    address: "",
    phone: "",
  };

  const today = dashboard?.today || {
    sales: 0,
    ordersCount: 0,
    avgOrderValue: 0,
    yesterdaySales: 0,
    salesGrowth: "+0.0%",
  };

  const activeShift = dashboard?.activeShift;
  const criticalLubricants: any[] = dashboard?.criticalLubricants || [];
  const tenders: any[] = dashboard?.tenders || [];
  const incomingTransfers: any[] = dashboard?.incomingTransfers || [];
  const outgoingTransfers: any[] = dashboard?.outgoingTransfers || [];
  const recentOrders: any[] = dashboard?.recentOrders || [];

  return (
    <div className="flex flex-col p-4 md:p-8 max-w-[1400px] mx-auto w-full gap-8">
      {/* Branch Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-600 text-white tracking-wider uppercase">
              BRANCH STORE OPERATIONS
            </span>
            <span className="text-xs text-stone-500 font-mono font-bold">{branch.code}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight font-poppins flex items-center gap-3">
            {branch.name}
            {isFetching && <span className="text-xs text-amber-600 font-normal animate-pulse">Updating...</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-2">
            {branch.address && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-stone-400" /> {branch.address}
              </span>
            )}
            {branch.phone && (
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-stone-400" /> {branch.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Switcher for Admins */}
          {(isSuperAdmin() || isAdmin()) && branches.length > 1 && (
            <select
              value={activeBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-white border border-stone-200 text-stone-800 text-sm font-semibold rounded-xl px-4 py-2.5 shadow-sm outline-none focus:ring-2 focus:ring-stone-900"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          )}

          <Link
            href="/pos"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-sm rounded-xl shadow-sm transition-all"
          >
            <ShoppingCart size={16} /> Open POS Terminal
          </Link>

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
          >
            <ArrowRightLeft size={16} /> Request Stock
          </button>
        </div>
      </div>

      {/* Row 1: Today's Branch Performance Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-inter mb-3">
          Today's Store Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Sales */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Today's Sales</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900 tracking-tight">{formatCompactRs(today.sales)}</div>
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400">vs Yesterday ({formatCompactRs(today.yesterdaySales)})</span>
              <span className={`font-bold ${today.salesGrowth.startsWith("+") ? "text-emerald-600" : "text-stone-500"}`}>
                {today.salesGrowth}
              </span>
            </div>
          </div>

          {/* Orders Count */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Orders / Invoices</span>
              <Receipt size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl font-black text-stone-900 tracking-tight">{today.ordersCount}</div>
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Avg Ticket Value</span>
              <span className="font-bold text-stone-800">{formatCompactRs(today.avgOrderValue)}</span>
            </div>
          </div>

          {/* Drawer Cash */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Cash in Drawer</span>
              <Banknote size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-800 tracking-tight">
              {formatCompactRs(activeShift?.estimatedCashInDrawer || 0)}
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Opening Float</span>
              <span className="font-mono font-bold text-stone-700">
                {formatCompactRs(activeShift?.openingFloat || 0)}
              </span>
            </div>
          </div>

          {/* Critical Low Stock Count */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Low Stock Lubricants</span>
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 tracking-tight">{criticalLubricants.length}</div>
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Requires Restock</span>
              <span className="text-blue-600 font-bold">Action Needed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Active Shift Status Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${activeShift ? "bg-emerald-500 animate-pulse" : "bg-stone-300"}`}></div>
            <div>
              <h3 className="font-inter font-bold text-stone-900 text-base">
                {activeShift ? "Active POS Terminal Shift" : "No Active Shift"}
              </h3>
              <p className="text-xs text-stone-500">
                {activeShift
                  ? `Opened at ${new Date(activeShift.openedAt).toLocaleTimeString()} by ${activeShift.cashierName}`
                  : "Cashier must open a shift float to begin processing sales."}
              </p>
            </div>
          </div>
          {activeShift && (
            <div className="text-right">
              <span className="text-xs text-stone-400 font-mono">Session ID: {activeShift.sessionId.substring(0, 8)}</span>
            </div>
          )}
        </div>

        {activeShift && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-2">
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Cash Tender</span>
              <div className="text-base font-extrabold text-stone-900 mt-0.5">
                {formatRs(activeShift.totalCashSales || 0)}
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Card Payments</span>
              <div className="text-base font-extrabold text-stone-900 mt-0.5">
                {formatRs(activeShift.totalCardSales || 0)}
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Workshop Credit</span>
              <div className="text-base font-extrabold text-amber-700 mt-0.5">
                {formatRs(activeShift.totalCreditSales || 0)}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Expected Cash Drawer</span>
              <div className="text-base font-extrabold text-emerald-900 mt-0.5">
                {formatRs(activeShift.estimatedCashInDrawer || 0)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Critical Lubricants Alert & Inter-Branch Transfers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Low Stock Lubricants */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div>
              <h3 className="font-inter font-bold text-stone-900 text-base flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                Critical Low Stock Lubricants
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Items in this branch at or below threshold</p>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + Request Stock
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left font-inter text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Lubricant / Part</th>
                  <th className="py-3 px-4">Brand / Viscosity</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-5 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {criticalLubricants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-stone-400">
                      All branch inventory items are healthy and above reorder thresholds.
                    </td>
                  </tr>
                ) : (
                  criticalLubricants.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-stone-900">{item.productName}</div>
                        <div className="text-[10px] font-mono text-stone-400">{item.sku}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-700">{item.brand || "—"}</span>
                        {item.grade && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {item.grade}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-700">
                          {item.quantity} / {item.threshold}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-stone-900">
                        {formatRs(item.price)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inter-Branch Transfers Pending */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div>
              <h3 className="font-inter font-bold text-stone-900 text-base flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-blue-600" />
                Inter-Branch Stock Movement
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Incoming shipments to receive & outgoing dispatches</p>
            </div>
            <Link href="/admin/inventory" className="text-xs font-bold text-blue-600 hover:underline">
              View All Transfers →
            </Link>
          </div>

          <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[360px]">
            {/* Incoming */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                <Download size={13} className="text-emerald-600" /> Incoming to This Branch
              </h4>
              {incomingTransfers.length === 0 ? (
                <p className="text-xs text-stone-400 py-2">No incoming shipments in transit.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {incomingTransfers.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    >
                      <div>
                        <div className="font-bold text-stone-900">
                          {t.variant.name} (x{t.quantity})
                        </div>
                        <div className="text-[11px] text-stone-500">From: {t.fromBranch.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {t.status}
                        </span>
                        {t.status === "DISPATCHED" && (
                          <button
                            onClick={() => updateTransferStatus.mutate({ id: t.id, status: "RECEIVED" })}
                            className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px] hover:bg-emerald-700"
                          >
                            Receive
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing */}
            <div className="pt-3 border-t border-stone-100">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                <Send size={13} className="text-blue-600" /> Outgoing from This Branch
              </h4>
              {outgoingTransfers.length === 0 ? (
                <p className="text-xs text-stone-400 py-2">No outgoing transfer requests pending.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {outgoingTransfers.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    >
                      <div>
                        <div className="font-bold text-stone-900">
                          {t.variant.name} (x{t.quantity})
                        </div>
                        <div className="text-[11px] text-stone-500">To: {t.toBranch.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-800">
                          {t.status}
                        </span>
                        {t.status === "PENDING" && (
                          <button
                            onClick={() => updateTransferStatus.mutate({ id: t.id, status: "DISPATCHED" })}
                            className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px] hover:bg-blue-700"
                          >
                            Dispatch
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Branch Orders Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <h3 className="font-inter font-bold text-stone-900 text-base">Recent Branch Orders</h3>
            <p className="text-xs text-stone-500 mt-0.5">Walk-in retail customers and garage credit sales</p>
          </div>
          <Link href="/pos" className="text-xs font-bold text-blue-600 hover:underline">
            Go to POS Terminal →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-inter text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Order ID / Time</th>
                <th className="py-3.5 px-4">Customer / Garage</th>
                <th className="py-3.5 px-4">Vehicle #</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-6 text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-stone-400">
                    No orders recorded for this branch today.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-stone-900">{o.id.substring(0, 8)}</div>
                      <div className="text-[10px] text-stone-400">{new Date(o.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-stone-800">
                      {o.customerName}
                      {o.customerType === "GARAGE_WORKSHOP" && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                          GARAGE
                        </span>
                      )}
                      {o.customerType === "COMMERCIAL_FLEET" && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                          FLEET
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-stone-700">
                      {o.vehicleNumber || "—"}
                    </td>
                    <td className="py-4 px-4 text-stone-500 max-w-xs truncate">
                      {o.itemsSummary || `${o.itemsCount} items`}
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-stone-900">
                      {formatRs(o.amount)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-stone-100 text-stone-800 uppercase">
                        {o.paymentMethod.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          initialFromBranchId={activeBranchId}
        />
      )}
    </div>
  );
}
