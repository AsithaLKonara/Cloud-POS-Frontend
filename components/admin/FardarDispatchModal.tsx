"use client";

import React, { useState } from "react";
import { X, Truck, CheckCircle2, Info } from "lucide-react";
import { useUpdateOrderStatus } from "@/hooks/useOrders";

interface FardarDispatchModalProps {
  orderIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function FardarDispatchModal({ orderIds, onClose, onSuccess }: FardarDispatchModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const updateStatusMutation = useUpdateOrderStatus();

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(
        orderIds.map((id) =>
          updateStatusMutation.mutateAsync({ id, status: "DISPATCHED" })
        )
      );
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.error || e?.message || "Failed to dispatch orders. Please check API configuration.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="font-inter font-bold text-xl text-stone-900 mb-2">Dispatched Successfully</h2>
          <p className="font-inter text-sm text-stone-500 mb-6">
            {orderIds.length} order(s) have been assigned to Fardar. Tracking IDs generated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-stone-50 shrink-0">
          <div>
            <h2 className="font-inter font-bold text-xl text-stone-900 flex items-center gap-2">
              <Truck className="text-stone-700" size={24} /> Dispatch via Fardar
            </h2>
            <p className="font-inter text-sm text-stone-500 mt-1">Send dispatch request to Fardar API.</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-stone-100 flex-1 flex flex-col gap-6">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-inter">
              <strong>Dispatch Failed:</strong> {errorMessage}
            </div>
          )}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <p className="font-inter text-sm text-stone-700">
              You are about to generate Fardar tracking numbers and mark the following <span className="font-bold">{orderIds.length} order(s)</span> as <strong>Dispatched</strong>.
            </p>
            
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 max-h-40 overflow-y-auto flex flex-col gap-2">
              {orderIds.map(id => (
                <div key={id} className="flex items-center justify-between font-inter text-sm text-stone-700">
                  <span>{id}</span>
                  <span className="text-xs text-stone-400 font-mono">Pending Waybill</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl text-blue-900 text-sm font-inter">
              <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
              <p>Customers will automatically receive an email with their Fardar tracking link once dispatched.</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-stone-200 bg-white flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={isProcessing} className="px-5 py-2.5 bg-white border border-stone-200 text-stone-700 font-inter font-medium text-sm rounded-lg hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleProcess} disabled={isProcessing} className="px-8 py-2.5 bg-stone-900 text-white font-inter font-medium text-sm rounded-lg hover:bg-stone-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-80">
            {isProcessing ? "Connecting to Fardar..." : `Confirm Dispatch`}
          </button>
        </div>
      </div>
    </div>
  );
}
