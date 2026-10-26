"use client";

import React, { useState } from "react";
import { X, RefreshCcw, DollarSign } from "lucide-react";

interface RefundModalProps {
  transactionId: string;
  totalAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RefundModal({ transactionId, totalAmount, onClose, onSuccess }: RefundModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState<number>(totalAmount);
  const [reason, setReason] = useState("");

  const handleProcess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="font-inter font-bold text-xl text-foreground flex items-center gap-2">
              <RefreshCcw className="text-primary" size={24} /> Process Refund
            </h2>
            <p className="font-inter text-sm text-muted mt-1">Transaction {transactionId}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-background flex-1 flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-6">
            
            {/* Refund Type Selection */}
            <div className="grid grid-cols-2 gap-4">
              <label className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${refundType === 'full' ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-border bg-surface-elevated hover:border-border/80'}`}>
                <input type="radio" name="refund_type" value="full" checked={refundType === 'full'} onChange={() => { setRefundType('full'); setRefundAmount(totalAmount); }} className="sr-only" />
                <span className="font-inter font-bold text-sm text-foreground mb-1">Full Refund</span>
                <span className="font-inter text-xs text-muted">Rs. {totalAmount.toLocaleString()}</span>
              </label>
              <label className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${refundType === 'partial' ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-border bg-surface-elevated hover:border-border/80'}`}>
                <input type="radio" name="refund_type" value="partial" checked={refundType === 'partial'} onChange={() => setRefundType('partial')} className="sr-only" />
                <span className="font-inter font-bold text-sm text-foreground mb-1">Partial Refund</span>
                <span className="font-inter text-xs text-muted">Custom amount</span>
              </label>
            </div>

            {/* Custom Amount (If Partial) */}
            {refundType === 'partial' && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                <label className="font-inter text-sm font-semibold text-foreground">Refund Amount (Rs.)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-muted" />
                  </div>
                  <input 
                    type="number" 
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    max={totalAmount}
                    className="w-full border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm font-inter outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-elevated text-foreground"
                  />
                </div>
                <p className="text-xs text-muted font-inter mt-1">Maximum allowed: Rs. {totalAmount.toLocaleString()}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="font-inter text-sm font-semibold text-foreground">Reason for Refund <span className="text-red-500">*</span></label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-inter outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-elevated text-foreground"
              >
                <option value="" disabled>Select a reason...</option>
                <option value="Customer Request">Customer Request</option>
                <option value="Damaged Item">Damaged Item</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Fraudulent Activity">Fraudulent Activity</option>
                <option value="Other">Other</option>
              </select>
            </div>

          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={isProcessing} className="px-5 py-2.5 bg-surface border border-border text-foreground font-inter font-medium text-sm rounded-lg hover:bg-surface-elevated transition-colors shadow-sm disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleProcess} disabled={isProcessing || !reason} className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-white font-inter font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
            {isProcessing ? "Processing..." : `Issue Rs. ${refundAmount.toLocaleString()} Refund`}
          </button>
        </div>
      </div>
    </div>
  );
}
