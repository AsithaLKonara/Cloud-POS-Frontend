"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowRightLeft, Search, Building2, AlertCircle } from "lucide-react";
import { useCreateTransfer, useInventory, useBranches } from "@/hooks/useInventory";

interface StockTransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialFromBranchId?: string;
}

export default function StockTransferModal({ onClose, onSuccess, initialFromBranchId }: StockTransferModalProps) {
  const { data: branchesData } = useBranches();
  const branches: any[] = Array.isArray(branchesData) ? branchesData : (branchesData as any)?.data || [];

  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [skuSearch, setSkuSearch] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (branches.length >= 2) {
      if (initialFromBranchId && branches.some(b => b.id === initialFromBranchId)) {
        setFromBranchId(initialFromBranchId);
        const otherBranch = branches.find(b => b.id !== initialFromBranchId);
        if (otherBranch) setToBranchId(otherBranch.id);
      } else {
        setFromBranchId(branches[0].id);
        setToBranchId(branches[1].id);
      }
    }
  }, [branches, initialFromBranchId]);

  const createTransfer = useCreateTransfer();
  const { data: searchResults } = useInventory(fromBranchId || undefined, skuSearch, undefined, 1);
  const selectedVariant = searchResults?.data?.find((v: any) => v.variantId === variantId);

  const handleSelectVariant = (v: any) => {
    setVariantId(v.variantId);
    setSkuSearch(v.sku);
    setShowDropdown(false);
  };

  const handleProcess = async () => {
    if (!variantId || fromBranchId === toBranchId) return;
    setErrorMessage(null);

    try {
      await createTransfer.mutateAsync({
        variantId,
        fromBranchId,
        toBranchId,
        quantity: qty,
        notes,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || err.message || "Failed to create transfer");
    }
  };

  const isProcessing = createTransfer.isPending;
  const canSubmit = variantId && qty > 0 && fromBranchId && toBranchId && fromBranchId !== toBranchId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="font-inter font-bold text-xl text-foreground flex items-center gap-2">
              <ArrowRightLeft className="text-amber-500" size={24} /> Inter-Branch Stock Transfer
            </h2>
            <p className="font-inter text-sm text-muted mt-1">Move products and inventory between branches.</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-background flex-1 flex flex-col gap-5">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-5">

            {/* From / To Branch Selectors */}
            <div className="grid grid-cols-2 gap-4 relative">
              <div className="flex flex-col gap-2">
                <label className="font-inter text-xs font-bold uppercase tracking-wider text-muted">From Source Branch</label>
                <select
                  value={fromBranchId}
                  onChange={e => {
                    setFromBranchId(e.target.value);
                    setVariantId("");
                    setSkuSearch("");
                  }}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-inter outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-elevated text-foreground"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-inter text-xs font-bold uppercase tracking-wider text-muted">To Destination Branch</label>
                <select
                  value={toBranchId}
                  onChange={e => setToBranchId(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-inter outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-elevated text-foreground"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
              <div className="absolute top-9 left-1/2 -translate-x-1/2 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-muted z-10 shadow-sm">
                <ArrowRightLeft size={14} />
              </div>
            </div>

            {fromBranchId === toBranchId && (
              <p className="text-amber-600 dark:text-amber-400 text-xs font-inter flex items-center gap-1.5">
                <AlertCircle size={14} /> Source and Destination branches must be different.
              </p>
            )}

            {/* SKU Search */}
            <div className="flex flex-col gap-2 relative">
              <label className="font-inter text-xs font-bold uppercase tracking-wider text-muted">Select Product / Item</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={skuSearch}
                  onChange={e => { setSkuSearch(e.target.value); setVariantId(""); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search product name, variant, or SKU..."
                  className="w-full pl-9 border border-border rounded-lg px-3 py-2.5 text-sm font-inter outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-elevated text-foreground placeholder:text-muted"
                />
              </div>
              {showDropdown && skuSearch && (
                <div className="absolute top-full left-0 right-0 z-20 bg-surface border border-border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {(searchResults?.data ?? []).length === 0 ? (
                    <p className="p-3 text-sm text-muted text-center">No inventory found in source branch</p>
                  ) : (
                    (searchResults?.data ?? []).map((v: any) => (
                      <button
                        key={v.variantId}
                        onClick={() => handleSelectVariant(v)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-elevated transition-colors text-left border-b border-border last:border-b-0"
                      >
                        <div>
                          <p className="font-mono text-xs font-medium text-foreground">{v.sku}</p>
                          <p className="text-xs text-muted">{v.productName} — {v.name}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${v.quantity > 0 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'}`}>
                          {v.quantity} in stock
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedVariant && (
              <div className="flex items-center justify-between bg-surface-elevated border border-border rounded-lg px-4 py-3">
                <div>
                  <p className="font-inter text-sm font-bold text-foreground">{selectedVariant.productName}</p>
                  <p className="font-mono text-xs text-muted">{selectedVariant.sku} · {selectedVariant.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-foreground">{selectedVariant.quantity} available</span>
                  <p className="text-[11px] text-muted">at source branch</p>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-bold uppercase tracking-wider text-muted">Quantity (Units / Liters)</label>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                min="1"
                max={selectedVariant?.quantity ?? undefined}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-inter outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-elevated text-foreground"
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-bold uppercase tracking-wider text-muted">Transfer Reason / Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Urgent drum restock for commercial garage"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-inter outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-elevated text-foreground placeholder:text-muted"
              />
            </div>

            {errorMessage && (
              <p className="text-rose-600 dark:text-rose-400 text-xs font-inter bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">{errorMessage}</p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={isProcessing} className="px-5 py-2.5 bg-surface border border-border text-foreground font-inter font-medium text-sm rounded-lg hover:bg-surface-elevated transition-colors shadow-sm disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleProcess}
            disabled={isProcessing || !canSubmit}
            className="px-8 py-2.5 bg-primary text-white font-inter font-medium text-sm rounded-lg hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? "Submitting..." : "Initiate Transfer Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
