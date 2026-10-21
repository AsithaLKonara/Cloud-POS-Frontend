"use client";
import AdminStatCards from "@/components/admin/AdminStatCards";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/dashboard/PageHeader";
import FilterBar from "@/components/dashboard/FilterBar";
import DataTable from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/Badges";
import { Plus, ChevronDown, Send, Bell, Tag } from "lucide-react";
import BulkMessageModal from "@/components/dashboard/BulkMessageModal";
import PushNotificationModal from "@/components/dashboard/PushNotificationModal";
import CouponModal from "@/components/dashboard/CouponModal";
import FlashSaleModal from "@/components/dashboard/FlashSaleModal";
import { useCoupons, useDeleteCoupon, useFlashSales, useDeleteFlashSale } from "@/hooks/usePromotions";
import { Loader2, Zap } from "lucide-react";
import { globalDialog } from "@/store/dialog.store";

export default function PromotionsPage() {
  const router = useRouter();
  
  const [showCampaignMenu, setShowCampaignMenu] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  
  const [flashSaleModalOpen, setFlashSaleModalOpen] = useState(false);
  const [editingFlashSale, setEditingFlashSale] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<"coupons" | "flash-sales">("coupons");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: coupons = [], isLoading: isLoadingCoupons } = useCoupons(
    activeTab === "coupons" 
      ? { 
          search: searchQuery || undefined, 
          status: statusFilter === "All Statuses" ? undefined : (statusFilter || undefined), 
          type: typeFilter === "All Types" ? undefined : (typeFilter || undefined) 
        } 
      : undefined
  );
  const { mutateAsync: deleteCoupon } = useDeleteCoupon();

  const { data: flashSales = [], isLoading: isLoadingFlashSales } = useFlashSales(
    activeTab === "flash-sales" 
      ? { 
          search: searchQuery || undefined, 
          status: statusFilter === "All Statuses" ? undefined : (statusFilter || undefined) 
        } 
      : undefined
  );
  const { mutateAsync: deleteFlashSale } = useDeleteFlashSale();
  
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCampaignMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedCoupons = coupons.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    type: c.type,
    value: c.type === 'PERCENTAGE' ? `${c.value}%` : `Rs.${c.value}`,
    usage: c.usageLimit ? `${c.usedCount} / ${c.usageLimit}` : `${c.usedCount} / Unlimited`,
    status: c.status,
    expiry: c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "No Expiry",
    raw: c // keep raw data for editing
  }));

  const formattedFlashSales = flashSales.map((fs) => ({
    id: fs.id,
    name: fs.name,
    discount: `${fs.discount}%`,
    status: fs.status,
    dates: `${fs.startDate ? new Date(fs.startDate).toLocaleDateString() : 'N/A'} - ${fs.endDate ? new Date(fs.endDate).toLocaleDateString() : 'N/A'}`,
    itemsCount: fs.items?.length || 0,
    raw: fs
  }));

  const columns = [
    { header: "Promotion Name", accessor: "name" as const },
    { header: "Code", accessor: "code" as const },
    { header: "Discount Type", accessor: "type" as const },
    { header: "Value", accessor: "value" as const },
    { header: "Usage Limit", accessor: "usage" as const },
    { 
      header: "Status", 
      accessor: (row: any) => (
        <StatusBadge 
          label={row.status} 
          variant={row.status === "ACTIVE" || row.status === "Active" ? "success" : "neutral"} 
          dot 
        />
      ) 
    },
    { header: "Expiry Date", accessor: "expiry" as const },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <button 
            className="text-xs text-blue-600 hover:underline font-medium"
            onClick={(e) => { e.stopPropagation(); setEditingCoupon(row.raw); setCouponModalOpen(true); }}
          >
            Edit
          </button>
          <span className="text-stone-300">·</span>
          <button 
            className="text-xs text-red-500 hover:underline font-medium"
            onClick={async (e) => { 
              e.stopPropagation(); 
              if(await globalDialog.confirm('Delete this coupon?')) { 
                await deleteCoupon(row.id);
              } 
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const filters = (
    <>
      <select 
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value)}
        className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-inter text-stone-700 outline-none focus:ring-1 focus:ring-stone-400"
      >
        <option value="">All Statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="SCHEDULED">Scheduled</option>
        <option value="EXPIRED">Expired</option>
        <option value="DISABLED">Disabled</option>
      </select>
      {activeTab === "coupons" && (
        <select 
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-inter text-stone-700 outline-none focus:ring-1 focus:ring-stone-400"
        >
          <option value="">All Types</option>
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed Amount</option>
        </select>
      )}
    </>
  );

  const pageActions = (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setShowCampaignMenu(!showCampaignMenu)}
        className="bg-primary text-white hover:bg-primary-hover active:scale-95 px-5 py-2 rounded-lg font-inter text-sm font-semibold transition-all whitespace-nowrap shadow-md flex items-center gap-2"
      >
        <Plus size={16} /> Create Campaign <ChevronDown size={14} className={`transition-transform ${showCampaignMenu ? "rotate-180" : ""}`} />
      </button>

      {showCampaignMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl shadow-xl border border-border overflow-hidden z-[100] flex flex-col p-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <button 
            onClick={() => { setBulkModalOpen(true); setShowCampaignMenu(false); }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-inter text-foreground hover:bg-surface-elevated rounded-lg transition-colors text-left"
          >
            <Send size={16} className="text-blue-500" /> Bulk SMS Message
          </button>
          <button 
            onClick={() => { setPushModalOpen(true); setShowCampaignMenu(false); }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-inter text-foreground hover:bg-surface-elevated rounded-lg transition-colors text-left"
          >
            <Bell size={16} className="text-amber-500" /> Push Notification
          </button>
          <div className="h-px bg-border my-1 mx-2"></div>
          <button 
            onClick={() => { setEditingFlashSale(null); setFlashSaleModalOpen(true); setShowCampaignMenu(false); }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-inter text-foreground hover:bg-surface-elevated rounded-lg transition-colors text-left"
          >
            <Zap size={16} className="text-orange-500" /> Flash Sale
          </button>
          <button 
            onClick={() => { setEditingCoupon(null); setCouponModalOpen(true); setShowCampaignMenu(false); }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-inter text-foreground hover:bg-surface-elevated rounded-lg transition-colors text-left"
          >
            <Tag size={16} className="text-emerald-500" /> Discount Coupon
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full">
      <PageHeader 
        title="Promotions & Coupons" 
        description="Manage active marketing campaigns, coupon codes, and automated discounts."
        action={pageActions}
      />

      <div className="flex gap-4 border-b border-border mb-6">
        <button 
          onClick={() => setActiveTab("coupons")}
          className={`py-2 px-1 border-b-2 font-inter text-sm font-medium transition-colors ${activeTab === "coupons" ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
        >
          Discount Coupons
        </button>
        <button 
          onClick={() => setActiveTab("flash-sales")}
          className={`py-2 px-1 border-b-2 font-inter text-sm font-medium transition-colors ${activeTab === "flash-sales" ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
        >
          Flash Sales
        </button>
      </div>

      <div className="mb-6"><AdminStatCards metrics={[
  { title: "Total", value: "---", theme: "white-blue" },
  { title: "Active", value: "---", theme: "white-stone" },
  { title: "Pending", value: "---", theme: "orange" }
]} /></div>
      <FilterBar 
        placeholder={`Search by ${activeTab === 'coupons' ? 'coupon' : 'flash sale'} name or code...`} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters} 
      />

      {activeTab === "coupons" && (
        isLoadingCoupons ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-stone-400" /></div>
        ) : (
          <DataTable 
            data={formattedCoupons}
            columns={columns}
            keyExtractor={(row) => row.id}
            pagination={{ currentPage: 1, totalPages: 1 }}
          />
        )
      )}

      {activeTab === "flash-sales" && (
        isLoadingFlashSales ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-stone-400" /></div>
        ) : (
          <DataTable 
            data={formattedFlashSales}
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Discount", accessor: "discount" },
              { header: "Status", accessor: (row: any) => <StatusBadge label={row.status} variant={row.status === "ACTIVE" ? "success" : "neutral"} dot /> },
              { header: "Valid Dates", accessor: "dates" },
              { header: "Products", accessor: "itemsCount" },
              {
                header: "Actions",
                accessor: (row: any) => (
                  <div className="flex items-center gap-2">
                    <button 
                      className="text-xs text-blue-600 hover:underline font-medium"
                      onClick={(e) => { e.stopPropagation(); setEditingFlashSale(row.raw); setFlashSaleModalOpen(true); }}
                    >
                      Edit
                    </button>
                    <span className="text-stone-300">·</span>
                    <button 
                      className="text-xs text-red-500 hover:underline font-medium"
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        if(await globalDialog.confirm('Delete this flash sale?')) { 
                          await deleteFlashSale(row.id);
                        } 
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ),
              }
            ]}
            keyExtractor={(row) => row.id}
            pagination={{ currentPage: 1, totalPages: 1 }}
          />
        )
      )}
      
      <BulkMessageModal isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)} />
      <PushNotificationModal isOpen={pushModalOpen} onClose={() => setPushModalOpen(false)} />
      <CouponModal 
        isOpen={couponModalOpen} 
        onClose={() => { setCouponModalOpen(false); setEditingCoupon(null); }} 
        initialData={editingCoupon} 
      />
      <FlashSaleModal 
        isOpen={flashSaleModalOpen} 
        onClose={() => { setFlashSaleModalOpen(false); setEditingFlashSale(null); }} 
        initialData={editingFlashSale} 
      />
    </div>
  );
}
