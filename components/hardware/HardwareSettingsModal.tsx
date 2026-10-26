"use client";

import React, { useState } from "react";
import {
  Printer,
  Scale,
  Maximize2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  Tag,
  Monitor,
  ExternalLink,
} from "lucide-react";
import { useHardware } from "@/hooks/useHardware";

interface HardwareSettingsModalProps {
  onClose: () => void;
}

export default function HardwareSettingsModal({ onClose }: HardwareSettingsModalProps) {
  const {
    bridgeStatus,
    refreshBridge,
    printReceipt,
    openCashDrawer,
    scaleReading,
    isScaleConnected,
    connectScale,
    disconnectScale,
    launchCustomerDisplay,
    generateTsplLabel,
  } = useHardware();

  const [paperWidth, setPaperWidth] = useState<80 | 58>(80);
  const [testPrintLoading, setTestPrintLoading] = useState(false);
  const [drawerKickLoading, setDrawerKickLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleTestPrint = async () => {
    setTestPrintLoading(true);
    setFeedbackMsg(null);
    const success = await printReceipt(
      {
        companyName: "XONIT POS ENTERPRISE",
        companyAddress: "123 Galle Road, Colombo 03",
        phone: "+94 11 234 5678",
        taxNumber: "VAT-8923412-001",
        orderNumber: "TEST-001",
        cashierName: "Hardware Diagnostics",
        date: new Date().toLocaleString(),
        items: [
          { name: "Sample Item A (80mm Test)", quantity: 2, unitPriceLkr: 750, totalLkr: 1500 },
          { name: "Fresh Produce Weighed", quantity: 1.45, unitPriceLkr: 600, totalLkr: 870, isWeighed: true },
        ],
        subtotalLkr: 2370,
        discountLkr: 170,
        taxLkr: 0,
        totalLkr: 2200,
        paymentMethod: "CASH",
        amountPaidLkr: 5000,
        changeDueLkr: 2800,
        footerMessage: "Hardware Bridge Test Successful!",
      },
      paperWidth
    );

    setTestPrintLoading(false);
    if (success) {
      setFeedbackMsg("✅ Zero-click test receipt sent to thermal printer!");
    } else {
      setFeedbackMsg("⚠️ Local Bridge unreachable at 127.0.0.1:18181. Ensure `node-print start` is running.");
    }
  };

  const handleKickDrawer = async () => {
    setDrawerKickLoading(true);
    setFeedbackMsg(null);
    const success = await openCashDrawer(2);
    setDrawerKickLoading(false);
    if (success) {
      setFeedbackMsg("✅ Cash drawer kick pulse dispatched!");
    } else {
      setFeedbackMsg("⚠️ Could not trigger cash drawer. Verify printer RJ11 cable connection.");
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-foreground">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-soft border border-primary/30 flex items-center justify-center text-primary">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Hardware Integration Suite</h2>
              <p className="text-xs text-muted font-mono">
                Printers • Cash Drawers • Scales • Scanners • Dual Displays
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-background custom-scrollbar">
          {/* Bridge Status Card */}
          <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  bridgeStatus.online ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <div>
                <div className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <span>Thermal Print Bridge</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-foreground font-mono">
                    127.0.0.1:18181
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {bridgeStatus.online
                    ? `Connected (${bridgeStatus.latencyMs}ms) • ${bridgeStatus.printers.length} thermal device(s) ready`
                    : "Bridge offline. Native browser iframe fallback active."}
                </p>
              </div>
            </div>

            <button
              onClick={refreshBridge}
              disabled={bridgeStatus.checking}
              className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
              title="Refresh Bridge Status"
            >
              <RefreshCw size={16} className={bridgeStatus.checking ? "animate-spin" : ""} />
            </button>
          </div>

          {feedbackMsg && (
            <div className="p-3 rounded-xl bg-primary-soft border border-primary/30 text-primary text-xs font-mono">
              {feedbackMsg}
            </div>
          )}

          {/* Section 1: 80mm / 58mm Thermal Bill Printer */}
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <Printer size={18} className="text-primary" />
                <span className="font-semibold text-sm">ESC/POS Thermal Receipt Printer</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-elevated p-1 rounded-xl border border-border text-xs">
                <button
                  onClick={() => setPaperWidth(80)}
                  className={`px-3 py-1 rounded-lg font-mono font-bold transition-colors ${
                    paperWidth === 80 ? "bg-primary text-white shadow" : "text-muted hover:text-foreground"
                  }`}
                >
                  80mm
                </button>
                <button
                  onClick={() => setPaperWidth(58)}
                  className={`px-3 py-1 rounded-lg font-mono font-bold transition-colors ${
                    paperWidth === 58 ? "bg-primary text-white shadow" : "text-muted hover:text-foreground"
                  }`}
                >
                  58mm
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTestPrint}
                disabled={testPrintLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50"
              >
                <Printer size={16} />
                {testPrintLoading ? "Printing Test..." : `Print Test Receipt (${paperWidth}mm)`}
              </button>

              <button
                onClick={handleKickDrawer}
                disabled={drawerKickLoading}
                className="py-2.5 px-4 rounded-xl bg-surface hover:bg-surface-elevated text-foreground font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 border border-border shadow-sm"
              >
                <DollarSign size={16} className="text-emerald-500" />
                Kick Cash Drawer
              </button>
            </div>
          </div>

          {/* Section 2: Weighing Scale Integration (RS-232 / WebSerial) */}
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <Scale size={18} className="text-indigo-500 dark:text-indigo-400" />
                <span className="font-semibold text-sm">RS-232 / WebSerial Weighing Scale</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-muted font-mono">
                CAS • Toledo • ACOM
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-elevated border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted block font-mono">Live Scale Reading</span>
                <div className="text-2xl font-black font-mono text-primary">
                  {scaleReading.weight.toFixed(3)} {scaleReading.unit.toUpperCase()}
                  {scaleReading.isStable ? (
                    <span className="text-xs ml-2 text-emerald-600 dark:text-emerald-400 font-normal">STABLE</span>
                  ) : (
                    <span className="text-xs ml-2 text-amber-600 dark:text-amber-400 font-normal">UNSTABLE</span>
                  )}
                </div>
              </div>

              {isScaleConnected ? (
                <button
                  onClick={disconnectScale}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                >
                  Disconnect Scale
                </button>
              ) : (
                <button
                  onClick={connectScale}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Scale size={14} />
                  Connect COM Port
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Customer-Facing Secondary Screen */}
          <div className="p-5 rounded-2xl bg-surface border border-border flex items-center justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-foreground">
                <Monitor size={18} className="text-purple-500 dark:text-purple-400" />
                <span className="font-semibold text-sm">Customer-Facing Display</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Open live secondary monitor window (HDMI / VFD) showing cart, LankaQR & subtotal.
              </p>
            </div>

            <button
              onClick={launchCustomerDisplay}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-md shadow-purple-600/20"
            >
              <ExternalLink size={14} />
              Launch Screen
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between text-xs text-muted">
          <span className="font-mono">XONIT SPACE Hardware Engine v2.0</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface border border-border hover:bg-surface-elevated text-foreground font-medium transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
