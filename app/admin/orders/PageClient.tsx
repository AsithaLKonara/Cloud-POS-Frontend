"use client";
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import FilterBar from "@/components/dashboard/FilterBar";
import DataTable from "@/components/dashboard/DataTable";
import { OrderStatusBadge, BranchBadge, PaymentGatewayBadge } from "@/components/dashboard/Badges";
import ShippingLabelModal from "@/app/admin/shipping/components/ShippingLabelModal";
import FardarDispatchModal from "@/components/admin/FardarDispatchModal";
import { Printer, Truck, Plus, Eye } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import Link from "next/link";
import AdminStatCards from "@/components/admin/AdminStatCards";
import OrderSidePanel from "@/components/admin/OrderSidePanel";
import { useBranches } from "@/hooks/useInventory";

export default function OrdersPage() {
  const router = useRouter();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showFardarModal, setShowFardarModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [paymentGateway, setPaymentGateway] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    search: searchQuery || undefined,
    status: status || undefined,
    branchId: branchId || undefined,
    paymentGateway: paymentGateway || undefined,
    type: type || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: page
  });

  const orders = ordersData?.data || [];
  const meta = ordersData?.meta || { totalPages: 1, page: 1 };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((o: any) => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedOrders(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]);
  };

  const columns = [
    {
      header: <input type="checkbox" checked={selectedOrders.length === orders.length && orders.length > 0} onChange={handleSelectAll} className="rounded text-stone-900 focus:ring-stone-900 border-stone-300" />,
      accessor: (row: any) => <input type="checkbox" checked={selectedOrders.includes(row.id)} onChange={() => handleSelectOne(row.id)} onClick={e => e.stopPropagation()} className="rounded text-stone-900 focus:ring-stone-900 border-stone-300" />
    },
    { header: "Order", accessor: (row: any) => row.orderNumber || row.id.substring(0, 8) },
    { header: "Customer", accessor: (row: any) => row.customer ? `${row.customer.firstName} ${row.customer.lastName}` : "Guest" },
    { 
      header: "Branch", 
      accessor: (row: any) => <BranchBadge branch={row.branch?.name || "Online"} /> 
    },
    { header: "Total", accessor: (row: any) => `Rs. ${row.total?.toLocaleString()}` },
    { 
      header: "Payment", 
      accessor: (row: any) => <PaymentGatewayBadge gateway={row.paymentMethod || "Unknown"} status={row.paymentStatus?.toLowerCase() || 'pending'} /> 
    },
    { 
      header: "Status", 
      accessor: (row: any) => <OrderStatusBadge status={row.status} /> 
    },
    {
      header: "Action",
      className: "text-right",
      accessor: (row: any) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrderId(row.id);
            }}
            title="View Order Details"
            className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted hover:text-primary hover:border-primary transition-all inline-flex items-center justify-center shadow-sm"
          >
            <Eye size={15} />
          </button>
        </div>
      )
    }
  ];

  const { data: branchesData } = useBranches();
  const branches = branchesData?.data || [];

  const filters = (
    <>
      <select 
        value={branchId}
        onChange={e => { setBranchId(e.target.value); setPage(1); }}
        className="bg-surface border border-border rounded-xl py-2 px-3 text-sm font-inter text-foreground outline-none focus:ring-1 focus:ring-amber-500 max-w-[140px]"
      >
        <option value="">All Branches</option>
        {branches.map((b: any) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <select 
        value={status} 
        onChange={e => { setStatus(e.target.value); setPage(1); }}
        className="bg-surface border border-border rounded-xl py-2 px-3 text-sm font-inter text-foreground outline-none focus:ring-1 focus:ring-amber-500"
      >
        <option value="">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="PROCESSING">Processing</option>
        <option value="DISPATCHED">Dispatched</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      
      <select 
        value={paymentGateway}
        onChange={e => { setPaymentGateway(e.target.value); setPage(1); }}
        className="bg-surface border border-border rounded-xl py-2 px-3 text-sm font-inter text-foreground outline-none focus:ring-1 focus:ring-amber-500"
      >
        <option value="">All Gateways</option>
        <option value="Koko">Koko</option>
        <option value="Mintpay">Mintpay</option>
        <option value="OnePay">OnePay</option>
        <option value="Payzy">Payzy</option>
        <option value="COD">COD</option>
        <option value="BANK_TRANSFER">Bank Transfer</option>
      </select>

      <select 
        value={type}
        onChange={e => { setType(e.target.value); setPage(1); }}
        className="bg-surface border border-border rounded-xl py-2 px-3 text-sm font-inter text-foreground outline-none focus:ring-1 focus:ring-amber-500"
      >
        <option value="">All Types</option>
        <option value="ECOMMERCE">Online Store</option>
        <option value="POS">In-Store (POS)</option>
        <option value="MANUAL">Manual</option>
      </select>
    </>
  );

  const handleDateQuickSelect = (option: string) => {
    const today = new Date();
    let start = "";
    let end = today.toISOString().split("T")[0];

    switch (option) {
      case "today":
        start = end;
        break;
      case "7days":
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 7);
        start = last7.toISOString().split("T")[0];
        break;
      case "30days":
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        start = last30.toISOString().split("T")[0];
        break;
      case "90days":
        const last90 = new Date(today);
        last90.setDate(today.getDate() - 90);
        start = last90.toISOString().split("T")[0];
        break;
      case "all":
        start = "";
        end = "";
        break;
    }

    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const getQuickSelectVariant = (rangeStart: string, rangeEnd: string) => {
    return startDate === rangeStart && endDate === rangeEnd 
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold" 
      : "bg-surface-hover text-muted hover:text-foreground border border-border/50";
  };
  
  const todayStr = new Date().toISOString().split("T")[0];
  const last7Str = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0];
  const last30Str = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0];
  const last90Str = new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split("T")[0];

  const bottomRow = (
    <>
      <div className="flex items-center gap-2 flex-wrap flex-1">
        <button onClick={() => handleDateQuickSelect("all")} className={`px-3 py-1.5 rounded-xl text-xs font-inter font-medium transition-colors ${getQuickSelectVariant("", "")}`}>All Time</button>
        <button onClick={() => handleDateQuickSelect("today")} className={`px-3 py-1.5 rounded-xl text-xs font-inter font-medium transition-colors ${getQuickSelectVariant(todayStr, todayStr)}`}>Today</button>
        <button onClick={() => handleDateQuickSelect("7days")} className={`px-3 py-1.5 rounded-xl text-xs font-inter font-medium transition-colors ${getQuickSelectVariant(last7Str, todayStr)}`}>Last 7 Days</button>
        <button onClick={() => handleDateQuickSelect("30days")} className={`px-3 py-1.5 rounded-xl text-xs font-inter font-medium transition-colors ${getQuickSelectVariant(last30Str, todayStr)}`}>Last 30 Days</button>
        <button onClick={() => handleDateQuickSelect("90days")} className={`px-3 py-1.5 rounded-xl text-xs font-inter font-medium transition-colors ${getQuickSelectVariant(last90Str, todayStr)}`}>Last 90 Days</button>
      </div>

      <div className="flex items-center gap-3 bg-surface-hover/50 p-1.5 rounded-xl border border-border w-full md:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-inter text-muted font-medium whitespace-nowrap pl-2">Custom Range:</span>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs font-inter text-foreground outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <span className="text-muted/50">-</span>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={endDate} 
            onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs font-inter text-foreground outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col p-4 md:p-8 max-w-[1400px] mx-auto w-full gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <PageHeader 
          title="Orders & Invoices" 
          description="Manage and track all customer orders, garage invoices, and dispatches across channels."
        />
        <Link 
          href="/admin/orders/quick-dispatch"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-stone-950 px-4 py-2 rounded-xl font-inter font-bold text-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} /> Quick Dispatch
        </Link>
      </div>

      <AdminStatCards 
        metrics={[
          { title: "Total Revenue", value: `Rs. ${orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0).toLocaleString()}`, theme: "red", progress: 100 },
          { title: "Total Orders", value: meta.totalCount || orders.length, theme: "white-stone" },
          { title: "Completed", value: orders.filter((o: any) => o.status === 'DELIVERED').length, theme: "white-blue" },
          { title: "Pending", value: orders.filter((o: any) => o.status === 'PENDING').length, theme: "orange" }
        ]}
        statuses={[
          { label: "Pending", value: orders.filter((o: any) => o.status === 'PENDING').length, colorClass: "bg-orange-50 text-orange-700" },
          { label: "Processing", value: orders.filter((o: any) => o.status === 'PROCESSING').length, colorClass: "bg-blue-50 text-blue-700" },
          { label: "Dispatched", value: orders.filter((o: any) => o.status === 'DISPATCHED').length, colorClass: "bg-indigo-50 text-indigo-700" },
          { label: "Delivered", value: orders.filter((o: any) => o.status === 'DELIVERED').length, colorClass: "bg-emerald-50 text-emerald-700" },
          { label: "Cancelled", value: orders.filter((o: any) => o.status === 'CANCELLED').length, colorClass: "bg-stone-100 text-stone-700" }
        ]}
      />

      <FilterBar 
        placeholder="Search order, phone, customer, tracking..." 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        bottomRow={bottomRow}
      />

      <DataTable 
        data={orders}
        columns={columns}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => setSelectedOrderId(row.id)}
        pagination={{ 
          currentPage: meta.page, 
          totalPages: meta.totalPages || 1,
          onPageChange: (newPage) => setPage(newPage) 
        }}
      />

      {/* Floating Bulk Action Bar */}
      {selectedOrders.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-40">
          <span className="font-inter font-medium text-sm">{selectedOrders.length} selected</span>
          <div className="w-px h-6 bg-stone-700"></div>
          <button onClick={() => setShowLabelModal(true)} className="font-inter font-semibold text-sm bg-white text-stone-900 px-4 py-2 rounded-full hover:bg-stone-100 transition-colors flex items-center gap-2">
            <Printer size={14} /> Print Courier Labels
          </button>
          <button onClick={() => setShowFardarModal(true)} className="font-inter font-semibold text-sm bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-500 transition-colors flex items-center gap-2">
            <Truck size={14} /> Dispatch via Fardar
          </button>
        </div>
      )}

      {showLabelModal && (
        <ShippingLabelModal 
          orderIds={selectedOrders}
          isOpen={showLabelModal}
          onClose={() => setShowLabelModal(false)}
        />
      )}

      {showFardarModal && (
        <FardarDispatchModal 
          orderIds={orders.filter((o: any) => selectedOrders.includes(o.id)).map((o: any) => o.id)}
          onClose={() => setShowFardarModal(false)}
          onSuccess={() => {
            setShowFardarModal(false);
            setSelectedOrders([]);
          }}
        />
      )}

      <OrderSidePanel 
        orderId={selectedOrderId} 
        isOpen={!!selectedOrderId} 
        onClose={() => setSelectedOrderId(null)} 
      />
    </div>
  );
}
