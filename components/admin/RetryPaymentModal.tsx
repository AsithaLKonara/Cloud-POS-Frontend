"use client";

import React, { useState } from "react";
import { X, Send, CreditCard, AlertCircle } from "lucide-react";

interface RetryPaymentModalProps {
  transactionId: string;
  customerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RetryPaymentModal({ transactionId, customerName, onClose, onSuccess }: RetryPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryMethod, setRetryMethod] = useState<"link" | "manual">("link");
  const [sendMethod, setSendMethod] = useState<"email" | "sms">("email");

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
              <RefreshCcwIcon /> Retry Payment
            </h2>
            <p className="font-inter text-sm text-muted mt-1">Transaction {transactionId}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-background flex-1 flex flex-col gap-6">
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-300">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-col gap-1">
              <span className="font-inter text-sm font-bold">Failed Reason: Insufficient Funds</span>
              <span className="font-inter text-xs text-amber-700 dark:text-amber-400">The gateway (Payzy) rejected the previous attempt at 04:10 PM.</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-6">
            
            <div className="flex flex-col gap-3">
              <label className="font-inter text-sm font-semibold text-foreground">Retry Method</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${retryMethod === 'link' ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-border bg-surface-elevated hover:border-border/80'}`}>
                  <input type="radio" name="retry_method" value="link" checked={retryMethod === 'link'} onChange={() => setRetryMethod('link')} className="sr-only" />
                  <span className="font-inter font-bold text-sm text-foreground mb-1 flex items-center gap-2"><Send size={14} /> Send Link</span>
                  <span className="font-inter text-xs text-muted">Send customer a new secure checkout link to pay.</span>
                </label>
                <label className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${retryMethod === 'manual' ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-border bg-surface-elevated hover:border-border/80'}`}>
                  <input type="radio" name="retry_method" value="manual" checked={retryMethod === 'manual'} onChange={() => setRetryMethod('manual')} className="sr-only" />
                  <span className="font-inter font-bold text-sm text-foreground mb-1 flex items-center gap-2"><CreditCard size={14} /> Re-Auth Card</span>
                  <span className="font-inter text-xs text-muted">Attempt to charge the saved card in the background again.</span>
                </label>
              </div>
            </div>

            {retryMethod === 'link' && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                <label className="font-inter text-sm font-semibold text-foreground">Send Notification Via</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 font-inter text-sm text-foreground cursor-pointer">
                    <input type="radio" name="send_method" value="email" checked={sendMethod === 'email'} onChange={() => setSendMethod('email')} className="text-primary focus:ring-primary" />
                    Email ({customerName.toLowerCase()}@example.com)
                  </label>
                  <label className="flex items-center gap-2 font-inter text-sm text-foreground cursor-pointer">
                    <input type="radio" name="send_method" value="sms" checked={sendMethod === 'sms'} onChange={() => setSendMethod('sms')} className="text-primary focus:ring-primary" />
                    SMS (+94 77 XXX XXXX)
                  </label>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={isProcessing} className="px-5 py-2.5 bg-surface border border-border text-foreground font-inter font-medium text-sm rounded-lg hover:bg-surface-elevated transition-colors shadow-sm disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleProcess} disabled={isProcessing} className="px-8 py-2.5 bg-primary text-white font-inter font-medium text-sm rounded-lg hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2 disabled:opacity-80">
            {isProcessing ? "Processing..." : retryMethod === 'link' ? "Send Retry Link" : "Attempt Re-Auth"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RefreshCcwIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
      <path d="M16 21v-5h5"/>
    </svg>
  );
}
