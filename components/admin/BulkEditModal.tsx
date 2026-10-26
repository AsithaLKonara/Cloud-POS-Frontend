"use client";

import React, { useState } from "react";
import { Edit, X } from "lucide-react";
import { useBulkEditProducts } from "@/hooks/useProducts";

interface BulkEditModalProps {
  selectedProducts: {
    id: string;
    sku: string;
    name: string;
  }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkEditModal({ selectedProducts, onClose, onSuccess }: BulkEditModalProps) {
  const bulkEditMutation = useBulkEditProducts();
  const [status, setStatus] = useState<string>("no_change");
  const [category, setCategory] = useState<string>("no_change");
  const [collection, setCollection] = useState<string>("no_change");

  const handleProcess = async () => {
    const productIds = selectedProducts.map(p => p.id);
    await bulkEditMutation.mutateAsync({
      productIds,
      data: {
        status: status !== "no_change" ? status : undefined,
        categoryId: category !== "no_change" ? category : undefined,
        collectionId: collection !== "no_change" ? collection : undefined
      }
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="font-inter font-bold text-xl text-foreground flex items-center gap-2">
              <Edit className="text-primary" size={24} /> Bulk Edit Products
            </h2>
            <p className="font-inter text-sm text-muted mt-1">Editing {selectedProducts.length} selected products.</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-background flex-1 flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-inter text-sm font-semibold text-foreground">Change Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-inter outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-elevated text-foreground"
              >
                <option value="no_change">No Change</option>
                <option value="Active">Set to Active</option>
                <option value="Draft">Set to Draft</option>
                <option value="Archived">Set to Archived</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-inter text-sm font-semibold text-foreground">Change Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-inter outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-elevated text-foreground"
              >
                <option value="no_change">No Change</option>
                <option value="T-Shirts">T-Shirts</option>
                <option value="Shirts">Shirts</option>
                <option value="Dresses">Dresses</option>
                <option value="Pants">Pants</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-inter text-sm font-semibold text-foreground">Add to Collection</label>
              <select 
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-inter outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-elevated text-foreground"
              >
                <option value="no_change">No Change</option>
                <option value="Summer 2026">Summer 2026</option>
                <option value="Best Sellers">Best Sellers</option>
                <option value="New Arrivals">New Arrivals</option>
                <option value="Clearance Sale">Clearance Sale</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={bulkEditMutation.isPending} className="px-5 py-2.5 bg-surface border border-border text-foreground font-inter font-medium text-sm rounded-lg hover:bg-surface-elevated transition-colors shadow-sm disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleProcess} disabled={bulkEditMutation.isPending} className="px-8 py-2.5 bg-primary text-white font-inter font-medium text-sm rounded-lg hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2 disabled:opacity-80">
            {bulkEditMutation.isPending ? "Saving..." : `Save Changes`}
          </button>
        </div>
      </div>
    </div>
  );
}
