'use client';
import AdminStatCards from "@/components/admin/AdminStatCards";

import { ArrowDownToLine, ArrowUpFromLine, Truck, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { useBranches, useInventory, useTransfers, useAdjustStock, useCreateTransfer, useUpdateTransferStatus, useInventoryStats } from '@/hooks/useInventory';
import { Button } from '@/components/ui/Button';
import StatCard from '@/components/dashboard/StatCard';
import InventoryAdjustmentModal from '@/components/admin/InventoryAdjustmentModal';
import StockTransferModal from '@/components/admin/StockTransferModal';

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'TRANSFERS' | 'BRANCHES'>('STOCK');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [adjustingVariant, setAdjustingVariant] = useState<{ item: any, type: 'receive' | 'deduct' } | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: branchesData, isLoading: branchesLoading } = useBranches();
  const { data: statsData } = useInventoryStats(selectedBranchId || undefined);
  const { data: inventoryData, isLoading: invLoading } = useInventory(selectedBranchId || undefined, debouncedSearch, statusFilter, page);
  const { data: transfersData, isLoading: transfersLoading } = useTransfers();
  
  const adjustStockMutation = useAdjustStock();
  const updateTransferStatus = useUpdateTransferStatus();

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight font-poppins">Inventory & Stock Control</h1>
          <p className="text-xs text-muted mt-1">Multi-branch stock tracking, threshold monitoring, and warehouse transfers</p>
        </div>
        {activeTab === 'STOCK' && (
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search SKU or Name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-surface border border-border text-foreground placeholder:text-muted/60 px-3.5 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 flex-1 sm:w-56"
            />
            <select 
              value={statusFilter} 
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-surface border border-border text-foreground px-3.5 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="instock">In Stock</option>
              <option value="lowstock">Low Stock</option>
              <option value="outofstock">Out of Stock</option>
            </select>
            <select 
              value={selectedBranchId} 
              onChange={e => {
                setSelectedBranchId(e.target.value);
                setPage(1);
              }}
              className="bg-surface border border-border text-foreground px-3.5 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Branches</option>
              {branchesData?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-border pb-3">
        <button 
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'STOCK' 
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm' 
              : 'text-muted hover:text-foreground hover:bg-surface-hover'
          }`} 
          onClick={() => setActiveTab('STOCK')}
        >
          Stock Levels
        </button>
        <button 
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'TRANSFERS' 
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm' 
              : 'text-muted hover:text-foreground hover:bg-surface-hover'
          }`} 
          onClick={() => setActiveTab('TRANSFERS')}
        >
          Stock Transfers
        </button>
        <button 
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'BRANCHES' 
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm' 
              : 'text-muted hover:text-foreground hover:bg-surface-hover'
          }`} 
          onClick={() => setActiveTab('BRANCHES')}
        >
          Branches
        </button>
      </div>

      {activeTab === 'STOCK' && (
        <div>
          <AdminStatCards metrics={[
            { title: "Total Items", value: statsData?.totalSKUs?.toString() || '0', theme: "white-blue" },
            { title: "Total Qty", value: statsData?.totalItems?.toLocaleString() || '0', theme: "white-stone" },
            { title: "Low Stock Alerts", value: statsData?.lowStockCount?.toString() || '0', theme: "orange" },
            { title: "Out of Stock", value: statsData?.outOfStockCount?.toString() || '0', theme: "red" }
          ]} />
        </div>
      )}

      {activeTab === 'STOCK' && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          {invLoading ? (
            <div className="p-8 text-center text-muted animate-pulse">Loading inventory records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-inter text-xs table-auto">
                <thead className="bg-surface-hover/70 border-b border-border text-muted font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6 min-w-[200px]">Variant / Item</th>
                    <th className="py-3.5 px-4 min-w-[120px]">Branch</th>
                    <th className="py-3.5 px-4 text-center min-w-[90px]">Quantity</th>
                    <th className="py-3.5 px-4 min-w-[110px]">Status</th>
                    <th className="py-3.5 px-6 text-right min-w-[90px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inventoryData?.data?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-surface-hover/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-foreground text-sm">{item.name}</div>
                        <div className="text-[11px] text-muted">{item.productName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-foreground/80 font-medium">{item.branchName}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-foreground">{item.quantity}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          item.isOutOfStock 
                            ? 'text-red-600 dark:text-red-400' 
                            : item.isLowStock 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.isOutOfStock ? 'bg-red-500' : item.isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          {item.stockStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button 
                            title="Receive Stock" 
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors" 
                            onClick={() => setAdjustingVariant({ item, type: 'receive' })}
                          >
                            <ArrowDownToLine size={16} />
                          </button>
                          <button 
                            title="Deduct Stock" 
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors" 
                            onClick={() => setAdjustingVariant({ item, type: 'deduct' })}
                          >
                            <ArrowUpFromLine size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {inventoryData?.meta && (
            <div className="flex items-center justify-between p-4 border-t border-border bg-surface-hover/30">
              <span className="text-xs text-muted">
                Page {inventoryData.meta.page} of {inventoryData.meta.totalPages} (Total: {inventoryData.meta.total})
              </span>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl text-xs"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl text-xs"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= inventoryData.meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'TRANSFERS' && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center bg-surface-hover/60">
            <div>
              <h2 className="font-bold text-foreground text-sm font-inter">Inter-Branch Stock Movement</h2>
              <p className="text-xs text-muted mt-0.5">Track and dispatch stock transfers between stores</p>
            </div>
            <Button id="new-transfer-button" size="sm" className="rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold" onClick={() => setIsTransferModalOpen(true)}>
              + New Transfer Request
            </Button>
          </div>
          {transfersLoading ? (
            <div className="p-8 text-center text-muted animate-pulse">Loading transfers...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-inter text-xs table-auto">
                <thead className="bg-surface-hover/70 border-b border-border text-muted font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6 min-w-[100px]">Date</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Variant</th>
                    <th className="py-3.5 px-4 min-w-[160px]">From → To</th>
                    <th className="py-3.5 px-4 min-w-[60px]">Qty</th>
                    <th className="py-3.5 px-4 min-w-[110px]">Status</th>
                    <th className="py-3.5 px-6 text-right min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transfersData?.data?.map((t: any) => (
                    <tr key={t.id} className="hover:bg-surface-hover/60 transition-colors">
                      <td className="py-3.5 px-6 text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 font-bold text-foreground">{t.variant?.name || t.variant?.sku}</td>
                      <td className="py-3.5 px-4 text-foreground/80">{t.fromBranch?.name} → {t.toBranch?.name}</td>
                      <td className="py-3.5 px-4 font-bold text-foreground">{t.quantity}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          t.status === 'RECEIVED' 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : t.status === 'DISPATCHED' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            t.status === 'RECEIVED' ? 'bg-emerald-500' : t.status === 'DISPATCHED' ? 'bg-blue-500' : 'bg-amber-500'
                          }`} />
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {t.status === 'PENDING' && (
                            <button 
                              title="Dispatch Transfer" 
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors" 
                              onClick={() => updateTransferStatus.mutate({ id: t.id, status: 'DISPATCHED' })}
                            >
                              <Truck size={16} />
                            </button>
                          )}
                          {t.status === 'DISPATCHED' && (
                            <button 
                              title="Receive Transfer" 
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors" 
                              onClick={() => updateTransferStatus.mutate({ id: t.id, status: 'RECEIVED' })}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'BRANCHES' && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden p-6">
          <h2 className="font-bold text-foreground text-sm font-inter mb-4">Active Branches</h2>
          <ul className="space-y-3">
            {branchesData?.map((b: any) => (
              <li key={b.id} className="p-4 border border-border bg-surface-hover/40 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-foreground">{b.name} <span className="font-mono text-xs text-muted">({b.code})</span></div>
                  <div className="text-xs text-muted mt-0.5">{b.type}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {adjustingVariant && (
        <InventoryAdjustmentModal
          type={adjustingVariant.type}
          initialVariantId={adjustingVariant.item.variantId}
          initialSkuSearch={adjustingVariant.item.sku || adjustingVariant.item.name}
          initialVariantData={adjustingVariant.item}
          onClose={() => setAdjustingVariant(null)}
          onSuccess={() => setAdjustingVariant(null)}
        />
      )}

      {isTransferModalOpen && (
        <StockTransferModal
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => setIsTransferModalOpen(false)}
        />
      )}
    </div>
  );
}
