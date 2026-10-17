"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Filter, RotateCcw, AlertCircle, CheckCircle2, Truck, Package,
  Clock, RefreshCw, Store, X, ChevronDown
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import BulkReturnModal from "@/components/admin/BulkReturnModal";
import ManualBulkReturnModal from "@/components/admin/ManualBulkReturnModal";
import { useReturns } from "@/hooks/useReturns";
import { globalDialog } from "@/store/dialog.store";
import { useDebounce } from "@/hooks/useDebounce";

const STATUS_CONFIG: Record<string, { icon: any; bg: string; color: string; label: string }> = {
  REQUESTED: { icon: AlertCircle, bg: "bg-orange-100", color: "text-orange-700", label: "Requested" },
  APPROVED: { icon: Clock, bg: "bg-blue-100", color: "text-blue-700", label: "Awaiting Item" },
  IN_TRANSIT: { icon: Truck, bg: "bg-purple-100", color: "text-purple-700", label: "In Transit" },
  RECEIVED: { icon: Package, bg: "bg-indigo-100", color: "text-indigo-700", label: "Inspecting" },
  REFUNDED: { icon: CheckCircle2, bg: "bg-emerald-100", color: "text-emerald-700", label: "Refunded" },
  REJECTED: { icon: AlertCircle, bg: "bg-red-100", color: "text-red-700", label: "Rejected" },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] || { icon: RotateCcw, bg: "bg-stone-100", color: "text-stone-700", label: status };

const ORIGIN_LABELS: Record<string, { label: string; bg: string; color: string; border: string; icon: any }> = {
  POS: { label: "POS In-Store", bg: "bg-violet-50", color: "text-violet-700", border: "border-violet-200", icon: Store },
  COURIER: { label: "Courier / Online", bg: "bg-sky-50", color: "text-sky-700", border: "border-sky-200", icon: Truck },
};

const TYPE_LABELS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  EXCHANGE: { label: "Exchange", bg: "bg-amber-50", color: "text-amber-700", border: "border-amber-200" },
  REFUND: { label: "Refund", bg: "bg-rose-50", color: "text-rose-700", border: "border-rose-200" },
};

const STATUS_FILTERS = ["ALL", "REQUESTED", "APPROVED", "RECEIVED", "REFUNDED", "REJECTED"];
const ORIGIN_FILTERS = ["ALL", "POS", "COURIER"];
const TYPE_FILTERS = ["ALL", "REFUND", "EXCHANGE"];

export default function AdminReturnsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [originFilter, setOriginFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [selectedRMAs, setSelectedRMAs] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useReturns(
    page, 10, debouncedSearch,
    statusFilter === "ALL" ? undefined : statusFilter,
    undefined,
    originFilter === "ALL" ? undefined : originFilter,
    typeFilter === "ALL" ? undefined : typeFilter
  );

  const returns = data?.returns || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const posCount = returns.filter((r: any) => r.origin === "POS").length;
  const courierCount = returns.filter((r: any) => r.origin === "COURIER").length;
  const exchangeCount = returns.filter((r: any) => r.type === "EXCHANGE").length;

  const handleExport = () => {
    if (!returns || returns.length === 0) {
      globalDialog.alert("No data to export");
      return;
    }
    const headers = ["RMA Number", "Order ID", "Customer", "Date", "Status", "Type", "Origin", "Amount"];
    const csvContent = [
      headers.join(","),
      ...returns.map((r: any) => [
        r.rmaId, r.orderId || "MANUAL", `"${r.customer}"`,
        r.date, r.status, r.type, r.origin, r.amount
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `returns_export_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRMAs(e.target.checked ? returns.map((r: any) => r.id) : []);
  };

  const handleSelectOne = (id: string) => {
    setSelectedRMAs(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const hasActiveFilters = statusFilter !== "ALL" || originFilter !== "ALL" || typeFilter !== "ALL";

  const clearFilters = () => {
    setStatusFilter("ALL");
    setOriginFilter("ALL");
    setTypeFilter("ALL");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Returns & Exchanges"
        subtitle="Manage returns and exchanges from POS in-store and courier/online channels."
        actionLabel="Manual Return"
        onAction={() => setShowManualModal(true)}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Total Returns</p>
          <p className="text-2xl font-bold text-stone-900">{total}</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-1">POS In-Store</p>
          <p className="text-2xl font-bold text-violet-700">{posCount}</p>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">Courier / Online</p>
          <p className="text-2xl font-bold text-sky-700">{courierCount}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Exchanges</p>
          <p className="text-2xl font-bold text-amber-700">{exchangeCount}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              placeholder="Search by RMA, Order ID, or Customer..."
              className="w-full h-10 pl-10 pr-4 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm font-inter"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-medium font-inter transition-colors ${
                hasActiveFilters
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
              }`}
            >
              <Filter size={15} />
              Filters
              {hasActiveFilters && (
                <span className="bg-white text-stone-900 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {[statusFilter !== "ALL", originFilter !== "ALL", typeFilter !== "ALL"].filter(Boolean).length}
                </span>
              )}
              <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-600 font-medium hover:underline font-inter">
                Clear all
              </button>
            )}
            <button
              onClick={handleExport}
              className="h-10 px-4 bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-sm font-medium font-inter hover:bg-stone-100 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-stone-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => { setStatusFilter(f); setPage(1); }}
                    className={`px-3 py-1.5 font-inter text-xs font-medium rounded-lg transition-colors capitalize ${
                      statusFilter === f ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    {f.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Channel</p>
              <div className="flex flex-wrap gap-1.5">
                {ORIGIN_FILTERS.map(f => {
                  const cfg = f !== "ALL" ? ORIGIN_LABELS[f] : null;
                  return (
                    <button
                      key={f}
                      onClick={() => { setOriginFilter(f); setPage(1); }}
                      className={`px-3 py-1.5 font-inter text-xs font-medium rounded-lg transition-colors ${
                        originFilter === f ? "bg-stone-900 text-white" : cfg ? `${cfg.bg} ${cfg.color} border ${cfg.border} hover:opacity-80` : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200"
                      }`}
                    >
                      {f === "ALL" ? "All Channels" : f === "POS" ? "POS In-Store" : "Courier / Online"}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Type</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_FILTERS.map(f => {
                  const cfg = f !== "ALL" ? TYPE_LABELS[f] : null;
                  return (
                    <button
                      key={f}
                      onClick={() => { setTypeFilter(f); setPage(1); }}
                      className={`px-3 py-1.5 font-inter text-xs font-medium rounded-lg transition-colors ${
                        typeFilter === f ? "bg-stone-900 text-white" : cfg ? `${cfg.bg} ${cfg.color} border ${cfg.border} hover:opacity-80` : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200"
                      }`}
                    >
                      {f === "ALL" ? "All Types" : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto min-w-[900px]">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="py-4 px-6 w-12">
                  <input type="checkbox" checked={selectedRMAs.length === returns.length && returns.length > 0} onChange={handleSelectAll} className="rounded text-primary focus:ring-primary border-border" />
                </th>
                <th className="font-inter font-semibold text-xs text-muted uppercase tracking-wider py-4 px-2">RMA</th>
                <th className="font-inter font-semibold text-xs text-muted uppercase tracking-wider py-4 px-4">Order</th>
                <th className="font-inter font-semibold text-xs text-muted uppercase tracking-wider py-4 px-4">Customer</th>
                <th className="font-inter font-semibold text-xs text-muted uppercase tracking-wider py-4 px-4">Channel</th>
                <th className="font-inter font-semibold text-xs text-muted uppercase tracking-wider py-4 px-4">Type</th>
                <th className="font-inter font-semibold text-xs text-muted uppercase tracking-wider py-4 px-4">Date</th>
                <th className="font-inter font-semibold text-xs text-muted uppercase tracking-wider py-4 px-4">Status</th>
                <th className="font-inter font-semibold text-xs text-muted uppercase tracking-wider py-4 px-4 text-right">Amount</th>
                <th className="py-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={10} className="py-3 px-6"><div className="h-5 bg-surface-hover rounded animate-pulse w-full" /></td></tr>
                ))
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted">
                      <RotateCcw size={36} className="opacity-30" />
                      <p className="font-inter text-sm font-medium">No returns found</p>
                      <p className="font-inter text-xs">Try adjusting your filters or search terms</p>
                    </div>
                  </td>
                </tr>
              ) : (
                returns.map((ret: any) => {
                  const statusInfo = getStatusConfig(ret.status);
                  const originCfg = ORIGIN_LABELS[ret.origin] || ORIGIN_LABELS["COURIER"];
                  const OriginIcon = originCfg.icon;
                  const typeCfg = TYPE_LABELS[ret.type] || TYPE_LABELS["REFUND"];
                  return (
                    <tr key={ret.id} className={`hover:bg-surface-hover/60 transition-colors ${selectedRMAs.includes(ret.id) ? "bg-surface-hover" : ""}`}>
                      <td className="py-4 px-6">
                        <input type="checkbox" checked={selectedRMAs.includes(ret.id)} onChange={() => handleSelectOne(ret.id)} className="rounded text-primary focus:ring-primary border-border" />
                      </td>
                      <td className="py-4 px-2 font-inter font-semibold text-sm text-foreground font-mono">{ret.rmaId}</td>
                      <td className="py-4 px-4 font-inter text-sm text-primary hover:underline cursor-pointer">
                        {ret.orderId ? ret.orderId : <span className="text-muted font-medium text-xs uppercase">Manual</span>}
                      </td>
                      <td className="py-4 px-4 font-inter text-sm text-foreground">{ret.customer}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                          <OriginIcon size={12} className="text-muted" />
                          {originCfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center text-xs font-medium text-muted">
                          {ret.type === "EXCHANGE" ? "Exchange" : "Refund"}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-inter text-sm text-muted">{ret.date}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide">
                          <span className={`w-1.5 h-1.5 rounded-full ${ret.status === "REFUNDED" ? "bg-emerald-500" : ret.status === "REJECTED" ? "bg-rose-500" : "bg-amber-500"}`} />
                          <span className={ret.status === "REFUNDED" ? "text-emerald-500" : ret.status === "REJECTED" ? "text-rose-500" : "text-amber-500"}>
                            {statusInfo.label}
                          </span>
                        </span>
                      </td>
                      <td className="py-4 px-4 font-inter text-sm text-foreground text-right font-medium">LKR {ret.amount.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right">
                        <Link 
                          href={`/admin/returns/${ret.id}`} 
                          title="Process Return Request"
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted hover:text-primary hover:border-primary transition-all inline-flex items-center justify-center shadow-sm"
                        >
                          <RotateCcw size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-border bg-background/50">
          <span className="font-inter text-sm text-stone-500">
            Showing <span className="font-medium text-stone-900">{(page - 1) * 10 + (returns.length > 0 ? 1 : 0)}</span>–<span className="font-medium text-stone-900">{(page - 1) * 10 + returns.length}</span> of <span className="font-medium text-stone-900">{total}</span>
          </span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 disabled:text-stone-400 hover:bg-stone-50 font-inter text-sm rounded-md shadow-sm transition-colors disabled:cursor-not-allowed">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 disabled:text-stone-400 hover:bg-stone-50 font-inter text-sm rounded-md shadow-sm transition-colors disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

      {selectedRMAs.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-40">
          <span className="font-inter font-medium text-sm">{selectedRMAs.length} selected</span>
          <div className="w-px h-6 bg-stone-700" />
          <button onClick={() => setShowBulkModal(true)} className="font-inter font-semibold text-sm bg-white text-stone-900 px-4 py-2 rounded-full hover:bg-stone-100 transition-colors flex items-center gap-2">
            <RefreshCw size={14} /> Process Bulk Return
          </button>
          <button onClick={() => setSelectedRMAs([])} className="text-stone-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
      )}

      {showBulkModal && (
        <BulkReturnModal selectedRMAs={returns.filter((r: any) => selectedRMAs.includes(r.id))} onClose={() => setShowBulkModal(false)} onSuccess={() => { setShowBulkModal(false); setSelectedRMAs([]); }} />
      )}
      {showManualModal && (
        <ManualBulkReturnModal onClose={() => setShowManualModal(false)} onSuccess={() => setShowManualModal(false)} />
      )}
    </div>
  );
}
