"use client";

import { useState } from "react";
import { Search, Loader2, Store, Calendar, FileText, Download, RotateCcw, AlertCircle, Truck, Package, Clock, CheckCircle2, ArrowLeftRight, Eye, X, ExternalLink } from "lucide-react";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(price);

const RETURN_STATUS_CONFIG: Record<string, { icon: any; bg: string; color: string; label: string }> = {
  REQUESTED: { icon: AlertCircle, bg: "bg-orange-100", color: "text-orange-700", label: "Requested" },
  APPROVED: { icon: Clock, bg: "bg-blue-100", color: "text-blue-700", label: "Awaiting" },
  IN_TRANSIT: { icon: Truck, bg: "bg-purple-100", color: "text-purple-700", label: "In Transit" },
  RECEIVED: { icon: Package, bg: "bg-indigo-100", color: "text-indigo-700", label: "Inspecting" },
  REFUNDED: { icon: CheckCircle2, bg: "bg-emerald-100", color: "text-emerald-700", label: "Refunded" },
  REJECTED: { icon: AlertCircle, bg: "bg-red-100", color: "text-red-700", label: "Rejected" },
};

export default function POSSalesClient() {
  const [activeTab, setActiveTab] = useState<"sales" | "returns">("sales");
  const [searchTerm, setSearchTerm] = useState("");
  const [returnSearchTerm, setReturnSearchTerm] = useState("");
  const [returnPage, setReturnPage] = useState(1);

  const { data: branchesData, isLoading: isLoadingBranches } = useBranches();
  const branches = branchesData?.data || [];
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  if (!activeBranchId && branches.length > 0) {
    setActiveBranchId(branches[0].id);
  }

  const { data: ordersData, isLoading: isLoadingOrders } = useOrders({
    branchId: activeBranchId || undefined,
    search: searchTerm || undefined,
    type: "POS",
  });

  const { data: posReturnsData, isLoading: isLoadingReturns } = useReturns(
    returnPage, 10, returnSearchTerm || undefined,
    undefined, undefined, "POS"
  );

  const orders = ordersData?.data || [];
  const meta = ordersData?.meta;
  const posReturns = posReturnsData?.returns || [];
  const posReturnsTotal = posReturnsData?.total || 0;
  const posReturnsTotalPages = posReturnsData?.totalPages || 1;

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsSidePanelOpen(true);
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-emerald-600 dark:text-emerald-400";
      case "PENDING": return "text-amber-600 dark:text-amber-400";
      case "CANCELLED": return "text-red-600 dark:text-red-400";
      default: return "text-muted";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-500";
      case "PENDING": return "bg-amber-500";
      case "CANCELLED": return "bg-red-500";
      default: return "bg-muted";
    }
  };

  const { data: branchReportData, isLoading: isLoadingReport } = useBranchReport();
  const currentBranchMetrics = branchReportData?.find((b: any) => b.branchId === activeBranchId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border bg-surface shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-inter flex items-center gap-2">
              <Store className="text-primary" />
              POS Sales Dashboard
            </h1>
            <p className="text-muted mt-1 font-inter text-sm">View POS transactions and returns across all branches</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-surface transition-colors text-sm font-semibold text-foreground">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Branch Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {isLoadingBranches ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-24 bg-stone-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <>
              {branches.map((branch: any) => (
                <button
                  key={branch.id}
                  onClick={() => setActiveBranchId(branch.id)}
                  className={`px-5 py-2.5 rounded-lg font-inter font-semibold text-sm whitespace-nowrap transition-colors border ${
                    activeBranchId === branch.id
                      ? "bg-primary-soft text-primary border-primary shadow-sm"
                      : "bg-background text-muted border-border hover:bg-surface"
                  }`}
                >
                  {branch.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">

        {/* Metrics Cards */}
        {activeBranchId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <p className="text-muted text-sm font-semibold font-inter mb-1">Total Revenue</p>
              {isLoadingReport ? (
                <div className="h-8 w-24 bg-stone-100 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-foreground font-inter">{formatPrice(currentBranchMetrics?.revenue || 0)}</p>
              )}
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <p className="text-muted text-sm font-semibold font-inter mb-1">Total Orders</p>
              {isLoadingReport ? (
                <div className="h-8 w-16 bg-stone-100 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-foreground font-inter">{currentBranchMetrics?.orders || 0}</p>
              )}
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <p className="text-muted text-sm font-semibold font-inter mb-1">POS Returns</p>
              <p className="text-2xl font-bold text-amber-600 font-inter">{posReturnsTotal}</p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit mb-6">
          <button
            onClick={() => setActiveTab("sales")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-inter font-semibold text-sm transition-all ${
              activeTab === "sales" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Store size={16} />
            Sales Transactions
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-inter font-semibold text-sm transition-all ${
              activeTab === "returns" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <ArrowLeftRight size={16} />
            POS Returns
            {posReturnsTotal > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{posReturnsTotal}</span>
            )}
          </button>
        </div>

        {/* SALES TAB */}
        {activeTab === "sales" && (
          <>
            <div className="mb-6 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer..."
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-inter"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-auto min-w-[700px]">
                  <thead>
                    <tr className="bg-surface-hover/70 border-b border-border">
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Items</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoadingOrders ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-muted">
                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                            <p className="font-inter">Loading sales data...</p>
                          </div>
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-muted">
                            <FileText className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-inter text-lg font-medium">No sales found</p>
                            <p className="font-inter text-sm opacity-70">
                              {searchTerm ? "Try a different search term" : "No POS sales have been recorded for this branch yet."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-surface-hover/60 transition-colors">
                          <td className="px-6 py-4"><span className="font-mono text-sm font-semibold text-foreground">{order.orderNumber}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-muted font-inter">
                              <Calendar size={14} />
                              {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-inter text-sm">
                              <p className="font-semibold text-foreground">{order.customer?.name || order.customer?.firstName || "Walk-in Customer"}</p>
                              {(order.customer?.email || order.customer?.phone) && (
                                <p className="text-xs text-muted">{order.customer?.email || order.customer?.phone}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-inter text-sm text-foreground">{order.items?.length || 0} items</td>
                          <td className="px-6 py-4 font-inter text-sm font-semibold text-foreground">{formatPrice(order.total)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold font-inter ${getStatusTextColor(order.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(order.status)}`} />
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => openOrderDetails(order)} 
                              title="View Order Details"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary hover:bg-primary-soft transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {meta && meta.totalPages > 1 && (
                <div className="p-4 border-t border-border bg-stone-50 flex items-center justify-between">
                  <p className="text-sm text-muted font-inter">
                    Showing <span className="font-semibold text-foreground">{orders.length}</span> of <span className="font-semibold text-foreground">{meta.total}</span> results
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* RETURNS TAB */}
        {activeTab === "returns" && (
          <>
            <div className="mb-6 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by RMA, Order ID, Customer..."
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-inter"
                  value={returnSearchTerm}
                  onChange={(e) => { setReturnSearchTerm(e.target.value); setReturnPage(1); }}
                />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-stone-50 border-b border-border">
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">RMA</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Order</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-inter text-xs font-semibold text-muted uppercase tracking-wider text-right">Amount</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoadingReturns ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-muted">
                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                            <p className="font-inter">Loading POS returns...</p>
                          </div>
                        </td>
                      </tr>
                    ) : posReturns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-muted">
                            <RotateCcw className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-inter text-lg font-medium">No POS returns found</p>
                            <p className="font-inter text-sm opacity-70">POS returns will appear here when processed</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      posReturns.map((ret: any) => {
                        const statusInfo = RETURN_STATUS_CONFIG[ret.status] || { icon: RotateCcw, bg: "bg-stone-100", color: "text-stone-700", label: ret.status };
                        const StatusIcon = statusInfo.icon;
                        return (
                          <tr key={ret.id} className="hover:bg-surface-hover/60 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm font-semibold text-foreground">{ret.rmaId}</td>
                            <td className="px-6 py-4 font-inter text-sm text-blue-600 dark:text-blue-400">
                              {ret.orderId ? ret.orderId : <span className="text-muted text-xs uppercase">Manual</span>}
                            </td>
                            <td className="px-6 py-4 font-inter text-sm text-foreground">{ret.customer}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-semibold ${
                                ret.type === "EXCHANGE" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                              }`}>
                                {ret.type === "EXCHANGE" ? "Exchange" : "Refund"}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-inter text-sm text-muted">{ret.date}</td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${statusInfo.color}`}>
                                <StatusIcon size={13} />
                                {statusInfo.label}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-inter text-sm font-semibold text-foreground text-right">LKR {ret.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <Link 
                                href={`/admin/returns/${ret.id}`} 
                                title="Process Return"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-foreground hover:bg-surface-hover transition-colors"
                              >
                                <ArrowLeftRight size={16} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {posReturnsTotalPages > 1 && (
                <div className="p-4 border-t border-border bg-stone-50 flex items-center justify-between">
                  <span className="font-inter text-sm text-muted">
                    Page {returnPage} of {posReturnsTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <button disabled={returnPage <= 1} onClick={() => setReturnPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 disabled:text-stone-400 hover:bg-stone-50 font-inter text-sm rounded-md shadow-sm transition-colors disabled:cursor-not-allowed">Previous</button>
                    <button disabled={returnPage >= posReturnsTotalPages} onClick={() => setReturnPage(p => Math.min(posReturnsTotalPages, p + 1))} className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 disabled:text-stone-400 hover:bg-stone-50 font-inter text-sm rounded-md shadow-sm transition-colors disabled:cursor-not-allowed">Next</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Order Details Side Panel */}
      {isSidePanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSidePanelOpen(false)}>
          <div className="w-[450px] max-w-full bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stone-200 shrink-0">
              <h2 className="text-xl font-bold font-inter text-stone-900">Order Details</h2>
              <button onClick={() => setIsSidePanelOpen(false)} className="text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {selectedOrder && (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Order ID</p>
                      <p className="font-mono font-bold text-lg text-stone-900">{selectedOrder.orderNumber}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Date</p>
                      <p className="text-sm font-medium text-stone-900">{format(new Date(selectedOrder.createdAt), "MMM d, yyyy")}</p>
                      <p className="text-xs text-stone-500">{format(new Date(selectedOrder.createdAt), "h:mm a")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Customer</p>
                      <p className="text-sm font-medium text-stone-900">{selectedOrder.customer?.firstName ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName || ""}` : "Walk-in Customer"}</p>
                      {(selectedOrder.customer?.phone || selectedOrder.customer?.email) && (
                        <p className="text-xs text-stone-500 mt-0.5">{selectedOrder.customer?.phone || selectedOrder.customer?.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">Items ({selectedOrder.items?.length || 0})</p>
                    <div className="flex flex-col gap-4">
                      {selectedOrder.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center bg-stone-50 p-3 rounded-lg border border-stone-100">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-stone-900">{item.variant?.product?.name || "Unknown Product"}</span>
                            <span className="text-xs text-stone-500 mt-0.5">{item.variant?.name || "Variant"} • Qty: {item.quantity}</span>
                          </div>
                          <span className="font-semibold text-sm text-stone-900">{formatPrice(item.priceAtPurchase * item.quantity)}</span>
                        </div>
                      ))}
                      {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                        <div className="text-center p-4 bg-stone-50 rounded-lg border border-stone-100 border-dashed">
                          <p className="text-sm text-stone-500">No item details available.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-stone-600 font-medium">Subtotal</span>
                      <span className="text-sm font-semibold text-stone-900">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.tax > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-stone-600 font-medium">Tax</span>
                        <span className="text-sm font-semibold text-stone-900">{formatPrice(selectedOrder.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-stone-200">
                      <span className="text-base font-bold text-stone-900">Total</span>
                      <span className="text-lg font-bold text-primary">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-stone-200 bg-stone-50 shrink-0">
              <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 bg-white border border-stone-300 hover:bg-stone-100 text-stone-900 font-semibold py-2.5 rounded-lg transition-colors text-sm">
                <FileText size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
