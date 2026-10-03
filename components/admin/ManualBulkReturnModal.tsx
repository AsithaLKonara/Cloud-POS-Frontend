"use client";

import React, { useState, useRef, useEffect } from "react";
import { CheckCircle2, X, AlertCircle, ScanBarcode, Trash2, PackagePlus } from "lucide-react";
import { useProcessBulkManualReturns } from "@/hooks/useReturns";
import { useBranches } from "@/hooks/useInventory";
import api from "@/services/api";
import { globalDialog } from "@/store/dialog.store";

interface ManualBulkReturnModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ScannedItem {
  sku: string;
  variantId: string;
  name: string;
  quantity: number;
  condition: "GOOD" | "DAMAGED";
}

export default function ManualBulkReturnModal({ onClose, onSuccess }: ManualBulkReturnModalProps) {
  const [skuInput, setSkuInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: branchesData } = useBranches();
  const processMutation = useProcessBulkManualReturns();

  useEffect(() => {
    // Auto-select warehouse branch if available
    if (branchesData && branchesData.length > 0 && !selectedBranchId) {
      const warehouse = branchesData.find((b: any) => b.type === "WAREHOUSE" || b.name.toLowerCase().includes("warehouse"));
      if (warehouse) {
        setSelectedBranchId(warehouse.id);
      } else {
        setSelectedBranchId(branchesData[0].id);
      }
    }
  }, [branchesData]);

  // Keep focus on input for fast scanning
  useEffect(() => {
    if (inputRef.current && !isScanning) {
      inputRef.current.focus();
    }
  }, [isScanning, items]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuInput.trim()) return;

    const currentSku = skuInput.trim();
    setSkuInput(""); // clear immediately for next scan
    setIsScanning(true);

    try {
      // Fetch product by SKU
      const res = await api.get(`/products/sku/${currentSku}`);
      if (!res.data) {
        globalDialog.alert(`SKU ${currentSku} not found in the system.`);
        setIsScanning(false);
        return;
      }

      const product = res.data;
      const lowerSku = currentSku.toLowerCase();
      const variant = product.variants?.find((v: any) => 
        v.sku?.toLowerCase() === lowerSku || 
        v.barcode?.toLowerCase() === lowerSku ||
        v.sku?.toLowerCase().startsWith(lowerSku) ||
        v.barcode?.toLowerCase().startsWith(lowerSku) ||
        v.id?.toLowerCase().startsWith(lowerSku) ||
        product.id?.toLowerCase().startsWith(lowerSku)
      );
      if (!variant) {
        globalDialog.alert(`Variant for SKU ${currentSku} not found.`);
        setIsScanning(false);
        return;
      }

      setItems(prev => {
        const existingIndex = prev.findIndex(item => item.sku === currentSku);
        if (existingIndex >= 0) {
          const newItems = [...prev];
          newItems[existingIndex].quantity += 1;
          return newItems;
        } else {
          return [
            ...prev,
            {
              sku: currentSku,
              variantId: variant.id,
              name: `${product.name} ${variant.size ? ` - ${variant.size}` : ''} ${variant.color ? `(${variant.color})` : ''}`,
              quantity: 1,
              condition: "GOOD"
            }
          ];
        }
      });
    } catch (error) {
      globalDialog.alert(`Failed to lookup SKU ${currentSku}. It may not exist.`);
    } finally {
      setIsScanning(false);
    }
  };

  const updateItem = (index: number, field: keyof ScannedItem, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (!selectedBranchId) {
      globalDialog.alert("Please select a destination branch.");
      return;
    }
    if (items.length === 0) {
      globalDialog.alert("No items scanned to process.");
      return;
    }

    try {
      await processMutation.mutateAsync({
        branchId: selectedBranchId,
        items: items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          condition: item.condition,
          notes: item.condition === 'DAMAGED' ? 'Manual Scan: Damaged' : 'Manual Scan: Restock'
        }))
      });
      globalDialog.alert("Items processed successfully.");
      onSuccess();
    } catch (error: any) {
      globalDialog.alert(`Error processing items: ${error.response?.data?.error || error.message}`);
    }
  };

  const isProcessing = processMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-stone-50 shrink-0">
          <div>
            <h2 className="font-inter font-bold text-xl text-stone-900 flex items-center gap-2">
              <PackagePlus className="text-stone-700" size={24} /> Manual / Offline Returns
            </h2>
            <p className="font-inter text-sm text-stone-500 mt-1">Scan items without an RMA to return them to stock or mark as damaged.</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-stone-100 flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <label className="font-inter font-semibold text-sm text-stone-700">Destination Branch</label>
              <select 
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                className="p-3 border border-stone-300 rounded-xl font-inter text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="">Select a branch...</option>
                {branchesData?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                ))}
              </select>
            </div>
            <div className="flex-[2] flex flex-col gap-2">
              <label className="font-inter font-semibold text-sm text-stone-700">Scan Barcode / SKU</label>
              <form onSubmit={handleScan} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={skuInput}
                  onChange={e => setSkuInput(e.target.value)}
                  disabled={isScanning}
                  placeholder={isScanning ? "Looking up..." : "Click here and scan barcode or type SKU and hit Enter..."}
                  className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl font-inter text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 disabled:bg-stone-100"
                />
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              </form>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="font-inter font-semibold text-xs text-stone-500 uppercase tracking-wider py-4 px-6">Item</th>
                  <th className="font-inter font-semibold text-xs text-stone-500 uppercase tracking-wider py-4 px-6 w-32">Qty</th>
                  <th className="font-inter font-semibold text-xs text-stone-500 uppercase tracking-wider py-4 px-6 w-48">Condition</th>
                  <th className="py-4 px-6 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-stone-500 font-inter text-sm">
                      No items scanned yet. Start scanning barcodes above.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-inter font-medium text-sm text-stone-900">{item.name}</span>
                          <span className="font-inter text-xs text-stone-500">SKU: {item.sku}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full p-2 border border-stone-300 rounded-md font-inter text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={item.condition}
                          onChange={e => updateItem(index, "condition", e.target.value)}
                          className={`w-full p-2 rounded-md font-inter text-sm border focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                            item.condition === 'DAMAGED' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-green-50 border-green-200 text-green-900'
                          }`}
                        >
                          <option value="GOOD">Good / Restock</option>
                          <option value="DAMAGED">Damaged / Write-off</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-stone-200 bg-white flex justify-between gap-3 shrink-0">
          <div className="text-stone-500 font-inter text-sm flex items-center gap-2">
            <span className="font-semibold text-stone-900">{items.reduce((sum, i) => sum + i.quantity, 0)}</span> Total Items
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isProcessing} className="px-5 py-2.5 bg-white border border-stone-200 text-stone-700 font-inter font-medium text-sm rounded-lg hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleProcess} disabled={isProcessing || items.length === 0} className="px-8 py-2.5 bg-stone-900 text-white font-inter font-medium text-sm rounded-lg hover:bg-stone-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-80">
              {isProcessing ? "Processing..." : "Process Returns"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
