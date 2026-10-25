"use client";

import React, { useState, useRef } from "react";
import { X, Lock, Unlock, AlertCircle, Printer, CheckCircle2, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { useOpenSession, useCloseSession, useExpectedClosing, useSessionSummary } from "@/hooks/usePos";
import { useReactToPrint } from "react-to-print";
import ZReportSlip from "./ZReportSlip";

interface PosShiftModalProps {
  mode: "OPEN" | "CLOSE";
  activeSession: any;
  branchId: string;
  terminalId: string;
  userId: string;
  onClose: () => void;
  onSuccess: (float: number) => void;
}

export default function PosShiftModal({ mode, activeSession, branchId, terminalId, userId, onClose, onSuccess }: PosShiftModalProps) {
  const [floatAmount, setFloatAmount] = useState(mode === "OPEN" ? "5000" : "");
  const [closingNotes, setClosingNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [closedSessionData, setClosedSessionData] = useState<any>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Shift-Z-Report-${terminalId}`,
    pageStyle: `@page { size: 80mm auto; margin: 0; } body { margin: 0; padding: 0; }`,
  });

  const { data: expectedClosingData, isLoading: expectedClosingLoading } = useExpectedClosing(
    mode === "CLOSE" ? activeSession?.id : undefined
  );

  const { data: sessionSummaryData } = useSessionSummary(
    (mode === "CLOSE" && activeSession?.id) ? activeSession.id : undefined
  );

  const expectedCash = expectedClosingData?.expectedClosing || (activeSession?.openingFloat || 0);
  const actualCash = Number(floatAmount) || 0;
  const variance = actualCash - expectedCash;
  
  const openSessionMutation = useOpenSession();
  const closeSessionMutation = useCloseSession();

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      if (mode === "CLOSE") {
        if (!activeSession) throw new Error("No active session to close.");
        const sessionId = activeSession.id;
        const res = await closeSessionMutation.mutateAsync({
          sessionId,
          actualClosing: actualCash,
          closingNotes: closingNotes.trim() || undefined
        });
        setClosedSessionData(res);
        setIsSuccess(true);
      } else {
        await openSessionMutation.mutateAsync({
          branchId,
          terminalId,
          userId,
          openingFloat: actualCash
        });
        onSuccess(actualCash);
      }
    } catch (error: any) {
      console.error("Shift processing error:", error);
      const serverMsg = error?.response?.data?.error || error?.message || "";
      if (serverMsg.includes('already has an open session') || serverMsg.includes('already open')) {
        onSuccess(actualCash);
      } else {
        alert(serverMsg || "Failed to update shift.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // SUCCESS / REPORT SCREEN (POST CLOSE)
  if (isSuccess && mode === "CLOSE") {
    const sessionToPrint = closedSessionData || {
      ...activeSession,
      actualClosing: actualCash,
      expectedClosing: expectedCash,
      variance,
      closingNotes,
      closedAt: new Date().toISOString()
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-8 items-center text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="font-inter font-bold text-2xl text-stone-900 mb-1">Shift Successfully Closed</h2>
          <p className="text-stone-500 font-inter text-xs mb-6">
            Terminal drawer balanced and all tender totals logged to the system.
          </p>
          
          <div className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6 flex flex-col gap-2.5 text-xs text-left font-inter">
            <div className="flex justify-between text-stone-600">
              <span>Opening Cash Float</span>
              <span className="font-mono font-bold">Rs. {(activeSession?.openingFloat || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Expected In Drawer</span>
              <span className="font-mono font-bold">Rs. {expectedCash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-stone-800 font-bold border-t border-stone-200 pt-2">
              <span>Actual Counted Cash</span>
              <span className="font-mono font-black">Rs. {actualCash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-stone-200 pt-2">
              <span>Variance (Over / Short)</span>
              <span className={`font-mono font-black ${variance === 0 ? "text-emerald-700" : variance > 0 ? "text-blue-700" : "text-red-600"}`}>
                {variance === 0 ? "Rs. 0.00 (Balanced)" : `${variance > 0 ? '+' : ''}Rs. ${variance.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Hidden Thermal Slip for printing via iframe */}
          <div className="hidden">
            <div ref={printRef}>
              <ZReportSlip session={sessionToPrint} summary={sessionSummaryData?.summary} />
            </div>
          </div>

          <button 
            type="button"
            onClick={() => handlePrint()}
            className="w-full py-3.5 bg-stone-900 text-white font-inter font-bold text-sm rounded-xl hover:bg-stone-800 transition-colors mb-3 flex items-center justify-center gap-2 shadow-md shadow-stone-900/10"
          >
            <Printer size={16} /> Print Shift Z-Report (Thermal)
          </button>
          
          <button 
            type="button"
            onClick={() => onSuccess(actualCash)}
            className="w-full py-3 bg-stone-100 text-stone-700 font-inter font-semibold text-xs rounded-xl hover:bg-stone-200 transition-colors"
          >
            Complete & Exit Shift
          </button>
        </div>
      </div>
    );
  }

  // OPEN OR CLOSE INPUT FORM
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-stone-50 shrink-0">
          <div>
            <h2 className="font-inter font-bold text-lg text-stone-900 flex items-center gap-2">
              {mode === "OPEN" ? <Unlock className="text-emerald-600" size={20} /> : <Lock className="text-stone-700" size={20} />}
              {mode === "OPEN" ? "Open Register Shift" : "End Shift & Drawer Balancing"}
            </h2>
            <p className="font-inter text-xs text-stone-500 mt-1">
              {mode === "OPEN" 
                ? "Enter initial cash float before starting cashier sales" 
                : "Count physical cash in the drawer and reconcile totals"}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {mode === "CLOSE" && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col gap-2.5 text-xs font-inter">
              <div className="flex justify-between text-stone-600">
                <span>Shift Started</span>
                <span className="font-mono">{activeSession?.openedAt ? new Date(activeSession.openedAt).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Opening Cash Float</span>
                <span className="font-mono">Rs. {(activeSession?.openingFloat || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-bold border-t border-stone-200 pt-2">
                <span>System Expected Cash In Drawer</span>
                <span className="font-mono font-black text-sm">
                  {expectedClosingLoading ? "Calculating..." : `Rs. ${expectedCash.toLocaleString()}`}
                </span>
              </div>
            </div>
          )}

          {/* Quick presets for opening float */}
          {mode === "OPEN" && (
            <div className="flex flex-col gap-2">
              <label className="font-inter font-bold text-xs text-stone-700">Quick Cash Float Presets</label>
              <div className="grid grid-cols-3 gap-2">
                {['2,000', '5,000', '10,000'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFloatAmount(p.replace(/,/g, ''))}
                    className="py-2 rounded-lg border border-stone-200 text-xs font-bold hover:border-stone-900 hover:bg-stone-50 font-mono transition-all text-stone-700"
                  >
                    Rs. {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cash Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-inter font-bold text-xs text-stone-700">
              {mode === "OPEN" ? "Opening Cash Float (Rs.)" : "Actual Counted Cash In Drawer (Rs.)"}
            </label>
            <div className="flex items-center border border-stone-300 rounded-xl px-4 py-3 bg-white focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900">
              <span className="font-mono text-stone-400 font-bold mr-2 text-base">Rs.</span>
              <input
                type="number"
                value={floatAmount}
                onChange={(e) => setFloatAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent font-mono font-bold text-xl text-stone-900 outline-none"
                autoFocus
                min={0}
              />
            </div>
          </div>

          {/* Variance Live Feedback on Close */}
          {mode === "CLOSE" && floatAmount && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-inter ${
              variance === 0 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : variance > 0 
                  ? "bg-blue-50 border-blue-200 text-blue-800" 
                  : "bg-red-50 border-red-200 text-red-800"
            }`}>
              <div className="flex items-center gap-2">
                {variance >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="font-bold">
                  {variance === 0 ? "Perfect Drawer Balance!" : variance > 0 ? "Drawer Overage" : "Drawer Shortage"}
                </span>
              </div>
              <span className="font-mono font-black text-sm">
                {variance === 0 ? "0.00" : `${variance > 0 ? '+' : ''}Rs. ${variance.toLocaleString()}`}
              </span>
            </div>
          )}

          {/* Closing Notes */}
          {mode === "CLOSE" && (
            <div className="flex flex-col gap-1.5">
              <label className="font-inter font-bold text-xs text-stone-700">Closing Remarks / Discrepancy Reason</label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Optional shift notes, petty cash explanation, etc..."
                rows={2}
                className="w-full border border-stone-200 rounded-xl p-3 text-xs font-inter text-stone-800 outline-none focus:border-stone-900 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2.5 bg-white border border-stone-300 text-stone-700 font-inter font-semibold text-xs rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleProcess} 
            disabled={isProcessing || !floatAmount}
            className="px-6 py-2.5 bg-stone-900 text-white font-inter font-bold text-xs rounded-xl hover:bg-stone-800 transition-colors shadow-md disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : (mode === "OPEN" ? "Open Register Shift" : "Close Shift & Print Report")}
          </button>
        </div>
      </div>
    </div>
  );
}
