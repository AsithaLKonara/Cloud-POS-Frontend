"use client";

import React, { useState } from "react";
import { CheckCircle2, X, RefreshCw, AlertCircle } from "lucide-react";

interface BulkReturnModalProps {
  selectedRMAs: {
    id: string;
    orderId: string;
    customer: string;
    amount: string;
  }[];
  onClose: () => void;
  onSuccess: () => void;
}

import { useBulkUpdateReturns } from "@/hooks/useReturns";

export default function BulkReturnModal({ selectedRMAs, onClose, onSuccess }: BulkReturnModalProps) {
  const [resolutions, setResolutions] = useState<Record<string, { condition: string, action: string }>>(
    selectedRMAs.reduce((acc, rma) => ({
      ...acc,
      [rma.id]: { condition: "RESTOCKABLE", action: "APPROVE_STORE_CREDIT" }
    }), {})
  );

  const bulkUpdateMutation = useBulkUpdateReturns();

  const updateResolution = (id: string, field: "condition" | "action", value: string) => {
    setResolutions(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleProcess = async () => {
    try {
      await bulkUpdateMutation.mutateAsync(resolutions);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to process bulk returns");
    }
  };

  const isProcessing = bulkUpdateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="font-inter font-bold text-xl text-foreground flex items-center gap-2">
              <RefreshCw className="text-primary" size={24} /> Process Bulk Returns
            </h2>
            <p className="font-inter text-sm text-muted mt-1">Reviewing {selectedRMAs.length} selected return requests.</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-background flex-1 flex flex-col gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-300 text-sm p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" size={18} />
            <p className="font-inter">
              <strong>Defaults applied:</strong> All items have been initially set to "Restockable" and "Approve (Store Credit)" to speed up your workflow. Please adjust any items that are damaged or require manual review.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {selectedRMAs.map((rma) => (
              <div key={rma.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between shadow-sm">
                
                <div className="flex flex-col gap-1 w-full md:w-1/3">
                  <span className="font-inter font-bold text-sm text-foreground">{rma.id}</span>
                  <span className="font-inter text-xs text-muted">Order {rma.orderId} • {rma.customer}</span>
                  <span className="font-inter font-medium text-sm text-emerald-600 dark:text-emerald-400 mt-1">{rma.amount}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-2/3">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Item Condition</label>
                    <select 
                      value={resolutions[rma.id].condition}
                      onChange={(e) => updateResolution(rma.id, "condition", e.target.value)}
                      className={`w-full font-inter text-sm p-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${resolutions[rma.id].condition === 'DAMAGED' ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300' : 'bg-surface-elevated border-border text-foreground'}`}
                    >
                      <option value="RESTOCKABLE">A-Grade / Restockable</option>
                      <option value="DAMAGED">Damaged / Write-off</option>
                    </select>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Resolution</label>
                    <select 
                      value={resolutions[rma.id].action}
                      onChange={(e) => updateResolution(rma.id, "action", e.target.value)}
                      className="w-full font-inter text-sm p-2.5 rounded-lg bg-surface-elevated border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                    >
                      <option value="APPROVE_STORE_CREDIT">Approve: Issue Store Credit</option>
                      <option value="APPROVE_ORIGINAL">Approve: Original Payment</option>
                      <option value="REJECT">Reject Request</option>
                    </select>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={isProcessing} className="px-5 py-2.5 bg-surface border border-border text-foreground font-inter font-medium text-sm rounded-lg hover:bg-surface-elevated transition-colors shadow-sm disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleProcess} disabled={isProcessing} className="px-8 py-2.5 bg-primary text-white font-inter font-medium text-sm rounded-lg hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2 disabled:opacity-80">
            {isProcessing ? "Processing..." : `Confirm & Process ${selectedRMAs.length} Returns`}
          </button>
        </div>
      </div>
    </div>
  );
}
