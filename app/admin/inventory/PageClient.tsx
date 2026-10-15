'use client';
import AdminStatCards from "@/components/admin/AdminStatCards";

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
  
  console.log("DEBUG statsData:", statsData);

  const adjustStockMutation = useAdjustStock();
  const updateTransferStatus = useUpdateTransferStatus();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Inventory Dashboard</h1>
        {activeTab === 'STOCK' && (
          <div className="flex space-x-3">
            <input 
              type="text" 
              placeholder="Search SKU or Name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border p-2 rounded"
            />
            <select 
              value={statusFilter} 
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border p-2 rounded"
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
              className="border p-2 rounded"
            >
              <option value="">All Branches</option>
              {branchesData?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-6 border-b pb-2">
        <button className={`pb-2 ${activeTab === 'STOCK' ? 'border-b-2 border-black font-semibold' : 'text-gray-500'}`} onClick={() => setActiveTab('STOCK')}>Stock Levels</button>
        <button className={`pb-2 ${activeTab === 'TRANSFERS' ? 'border-b-2 border-black font-semibold' : 'text-gray-500'}`} onClick={() => setActiveTab('TRANSFERS')}>Stock Transfers</button>
        <button className={`pb-2 ${activeTab === 'BRANCHES' ? 'border-b-2 border-black font-semibold' : 'text-gray-500'}`} onClick={() => setActiveTab('BRANCHES')}>Branches</button>
      </div>

      {activeTab === 'STOCK' && (
        <div className="mb-8">
          <AdminStatCards metrics={[
            { title: "Total Items", value: statsData?.totalSKUs?.toString() || '0', theme: "white-blue" },
            { title: "Total Qty", value: statsData?.totalItems?.toLocaleString() || '0', theme: "white-stone" },
            { title: "Low Stock Alerts", value: statsData?.lowStockCount?.toString() || '0', theme: "orange" },
            { title: "Out of Stock", value: statsData?.outOfStockCount?.toString() || '0', theme: "red" }
          ]} />
        </div>
      )}

      {activeTab === 'STOCK' && (
        <div className="bg-white rounded shadow overflow-hidden">
          {invLoading ? (
            <div className="p-4">Loading inventory...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4">Variant</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData?.data?.map((item: any) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-4">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.productName}</div>
                    </td>
                    <td className="p-4">{item.branchName}</td>
                    <td className="p-4 font-medium">{item.quantity}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${item.isOutOfStock ? 'bg-red-100 text-red-700' : item.isLowStock ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {item.stockStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setAdjustingVariant({ item, type: 'receive' })}>
                        Receive
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAdjustingVariant({ item, type: 'deduct' })}>
                        Deduct
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Pagination Controls */}
          {inventoryData?.meta && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-gray-500">
                Page {inventoryData.meta.page} of {inventoryData.meta.totalPages} (Total: {inventoryData.meta.total})
              </span>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
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
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <div>
              <h2 className="font-semibold text-gray-900">Inter-Branch Stock Movement</h2>
              <p className="text-xs text-gray-500">Track and dispatch stock transfers between stores</p>
            </div>
            <Button size="sm" onClick={() => setIsTransferModalOpen(true)}>
              + New Transfer Request
            </Button>
          </div>
           {transfersLoading ? (
            <div className="p-4">Loading transfers...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Variant</th>
                  <th className="p-4">From → To</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfersData?.data?.map((t: any) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">{t.variant?.name || t.variant?.sku}</td>
                    <td className="p-4">{t.fromBranch?.name} → {t.toBranch?.name}</td>
                    <td className="p-4 font-bold">{t.quantity}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-stone-100 text-stone-800">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {t.status === 'PENDING' && (
                        <Button size="sm" onClick={() => updateTransferStatus.mutate({ id: t.id, status: 'DISPATCHED' })}>Dispatch</Button>
                      )}
                      {t.status === 'DISPATCHED' && (
                        <Button size="sm" onClick={() => updateTransferStatus.mutate({ id: t.id, status: 'RECEIVED' })}>Receive</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'BRANCHES' && (
        <div className="bg-white rounded shadow overflow-hidden p-4">
          <h2 className="font-semibold mb-4">Active Branches</h2>
          <ul className="space-y-2">
            {branchesData?.map((b: any) => (
              <li key={b.id} className="p-3 border rounded flex justify-between">
                <div>
                  <div className="font-medium">{b.name} ({b.code})</div>
                  <div className="text-sm text-gray-500">{b.type}</div>
                </div>
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
