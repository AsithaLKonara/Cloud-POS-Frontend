"use client";

import React, { useState, useEffect } from "react";
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
  Tv,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { useHardware } from "@/hooks/useHardware";
import { PoleDisplayConfig, PoleDisplayProtocol, PoleDisplayMode, PoleDisplayTransport } from "@/services/pole-display.service";

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
    poleConfig,
    updatePoleConfig,
    isPoleSerialConnected,
    connectPoleSerial,
    disconnectPoleSerial,
    availablePorts,
    refreshSerialPorts,
    testPoleScreen,
    sendPolePrice,
    sendDiagnosticTest,
    clearPole,
    isWebSerialSupported,
  } = useHardware();

  const [paperWidth, setPaperWidth] = useState<80 | 58>(80);
  const [testPrintLoading, setTestPrintLoading] = useState(false);
  const [drawerKickLoading, setDrawerKickLoading] = useState(false);
  const [poleTestLoading, setPoleTestLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [customTestAmount, setCustomTestAmount] = useState("2750.00");
  const [showPortHelp, setShowPortHelp] = useState(false);

  useEffect(() => {
    refreshSerialPorts();
  }, [refreshSerialPorts]);

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

          {/* Section 3: Universal Customer Pole Display & Dual-Screen Suite */}
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <Tv size={18} className="text-purple-500 dark:text-purple-400" />
                <span className="font-semibold text-sm">Customer Display & Pole Display Suite</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-muted font-mono">
                Windows 7 & 10 • VFD • LCD • USB
              </span>
            </div>

            {/* Hardware Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted">Display Output Mode</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "BOTH", label: "Both (Pole + Screen)" },
                  { id: "VFD_2X20", label: "2x20 VFD/LCD Pole" },
                  { id: "DUAL_SCREEN", label: "Dual Screen Only" },
                  { id: "DISABLED", label: "Disabled" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => updatePoleConfig({ mode: m.id as PoleDisplayMode })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                      poleConfig.mode === m.id
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-surface-elevated border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2x20 VFD Character Pole Settings */}
            {(poleConfig.mode === "VFD_2X20" || poleConfig.mode === "BOTH") && (
              <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal size={15} className="text-cyan-500" />
                    <span className="text-xs font-bold text-foreground">2x20 Character Pole Display (Serial / USB)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => updatePoleConfig({ transport: "BRIDGE" })}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors ${
                        poleConfig.transport === "BRIDGE"
                          ? "bg-cyan-600 text-white border-cyan-500 shadow-sm"
                          : "border-border text-muted hover:text-foreground"
                      }`}
                      title="Silent zero-click background bridge"
                    >
                      Local Bridge
                    </button>
                    <button
                      onClick={() => updatePoleConfig({ transport: "WEBSERIAL" })}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors ${
                        poleConfig.transport === "WEBSERIAL"
                          ? "bg-cyan-600 text-white border-cyan-500 shadow-sm"
                          : "border-border text-muted hover:text-foreground"
                      }`}
                      title="Direct browser WebSerial access (Chrome 89+ / Win 7 Chrome 109)"
                    >
                      WebSerial
                    </button>
                  </div>
                </div>

                {/* Configuration Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* COM Port */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-muted">
                      <span>COM Port</span>
                      <button
                        onClick={refreshSerialPorts}
                        className="hover:text-foreground"
                        title="Scan serial ports"
                      >
                        <RefreshCw size={11} />
                      </button>
                    </div>
                    <select
                      value={poleConfig.port}
                      onChange={(e) => updatePoleConfig({ port: e.target.value })}
                      className="w-full bg-surface border border-border rounded-xl px-2.5 py-1.5 text-foreground font-mono focus:outline-none focus:border-primary"
                    >
                      {availablePorts.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Baud Rate */}
                  <div className="space-y-1">
                    <span className="text-muted block">Baud Rate</span>
                    <select
                      value={poleConfig.baudRate}
                      onChange={(e) => updatePoleConfig({ baudRate: parseInt(e.target.value, 10) })}
                      className="w-full bg-surface border border-border rounded-xl px-2.5 py-1.5 text-foreground font-mono focus:outline-none focus:border-primary"
                    >
                      {[2400, 4800, 9600, 19200, 38400, 115200].map((b) => (
                        <option key={b} value={b}>
                          {b} bps
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Protocol */}
                  <div className="space-y-1">
                    <span className="text-muted block">Command Protocol</span>
                    <select
                      value={poleConfig.protocol}
                      onChange={(e) => {
                        const newProto = e.target.value as PoleDisplayProtocol;
                        const updates: Partial<PoleDisplayConfig> = { protocol: newProto };
                        if (newProto === "PRICE_DISPLAY" && poleConfig.baudRate !== 2400) {
                          updates.baudRate = 2400; // Auto-align with standard 2400 baud
                        }
                        updatePoleConfig(updates);
                      }}
                      className="w-full bg-surface border border-border rounded-xl px-2.5 py-1.5 text-foreground font-mono focus:outline-none focus:border-primary"
                    >
                      <option value="PRICE_DISPLAY">Price display (ESC Q A) - LED8 / Single-line</option>
                      <option value="CD5220">CD5220 (Posiflex & Generic 2x20)</option>
                      <option value="ESCPOS">ESC/POS (Epson DM-D 2x20)</option>
                      <option value="UTC">UTC Standard / Enhanced</option>
                      <option value="AEDEX">AEDEX Standard</option>
                    </select>
                  </div>
                </div>

                {/* Protocol Info / Quick Auto-Config */}
                {poleConfig.protocol === "PRICE_DISPLAY" && (
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-600 dark:text-cyan-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">⚡ Price Display (ESC Q A):</span>
                      <span>Single-line numeric LED/VFD. Recommended speed: 2400 baud.</span>
                    </div>
                    {poleConfig.baudRate !== 2400 && (
                      <button
                        onClick={() => updatePoleConfig({ baudRate: 2400 })}
                        className="px-2 py-0.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition-colors"
                      >
                        Set to 2400 baud
                      </button>
                    )}
                  </div>
                )}

                {/* Auto-Detect Helper Banner */}
                <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold flex items-center gap-1.5 text-foreground">
                      <span>⚡ Don't know which port? Auto-detect / Test Frame</span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">
                      Sends a test frame to the active port. Watch the display when something appears.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setPoleTestLoading(true);
                      const ok = await sendDiagnosticTest();
                      setPoleTestLoading(false);
                      setFeedbackMsg(ok ? "✅ Test frame sent! Check display screen." : "⚠️ Send failed. Connect port first.");
                    }}
                    disabled={poleTestLoading}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {poleTestLoading ? "Sending..." : "Send Test Frame"}
                  </button>
                </div>

                {/* WebSerial Connect Button (if WebSerial Transport) */}
                {poleConfig.transport === "WEBSERIAL" && (
                  <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          isPoleSerialConnected ? "bg-emerald-500 animate-pulse" : "bg-stone-500"
                        }`}
                      />
                      <span className="text-muted">
                        {isPoleSerialConnected
                          ? "WebSerial Port Active (Direct Connection)"
                          : "Port Not Open. Click to grant browser access."}
                      </span>
                    </div>

                    {isPoleSerialConnected ? (
                      <button
                        onClick={disconnectPoleSerial}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/30 font-medium hover:bg-rose-500/20 transition-colors"
                      >
                        Disconnect Port
                      </button>
                    ) : (
                      <button
                        onClick={connectPoleSerial}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors shadow-sm"
                      >
                        Connect COM Port
                      </button>
                    )}
                  </div>
                )}

                {/* Interactive Numeric Amount Test */}
                <div className="p-3 rounded-xl bg-surface border border-border space-y-2">
                  <span className="text-[11px] font-semibold text-muted block">Direct Numeric Test (ESC Q A)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customTestAmount}
                      onChange={(e) => setCustomTestAmount(e.target.value)}
                      placeholder="e.g. 2750.00"
                      className="w-36 bg-surface-elevated border border-border rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={async () => {
                        setPoleTestLoading(true);
                        const ok = await sendPolePrice(customTestAmount, "PRICE");
                        setPoleTestLoading(false);
                        setFeedbackMsg(ok ? `✅ Price Rs.${customTestAmount} sent!` : "⚠️ Send failed.");
                      }}
                      disabled={poleTestLoading}
                      className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] font-medium text-foreground transition-colors disabled:opacity-50"
                    >
                      Price (ESC s 1)
                    </button>
                    <button
                      onClick={async () => {
                        setPoleTestLoading(true);
                        const ok = await sendPolePrice(customTestAmount, "TOTAL");
                        setPoleTestLoading(false);
                        setFeedbackMsg(ok ? `✅ Total Rs.${customTestAmount} sent!` : "⚠️ Send failed.");
                      }}
                      disabled={poleTestLoading}
                      className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] font-medium text-foreground transition-colors disabled:opacity-50"
                    >
                      Total (ESC s 2)
                    </button>
                    <button
                      onClick={async () => {
                        setPoleTestLoading(true);
                        const ok = await sendPolePrice(customTestAmount, "CHANGE");
                        setPoleTestLoading(false);
                        setFeedbackMsg(ok ? `✅ Change Rs.${customTestAmount} sent!` : "⚠️ Send failed.");
                      }}
                      disabled={poleTestLoading}
                      className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] font-medium text-foreground transition-colors disabled:opacity-50"
                    >
                      Change (ESC s 4)
                    </button>
                  </div>
                </div>

                {/* Diagnostics Test Grid */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted block">Pole Display Preset Workflows</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <button
                      onClick={async () => {
                        setPoleTestLoading(true);
                        const ok = await testPoleScreen("welcome");
                        setPoleTestLoading(false);
                        setFeedbackMsg(ok ? "✅ Welcome text dispatched to pole display!" : "⚠️ Check COM port or bridge connection.");
                      }}
                      disabled={poleTestLoading}
                      className="py-1.5 px-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] text-foreground font-medium transition-colors disabled:opacity-50"
                    >
                      {poleConfig.protocol === "PRICE_DISPLAY" ? "Test 8888.88" : "Test Welcome"}
                    </button>
                    <button
                      onClick={async () => {
                        setPoleTestLoading(true);
                        const ok = await testPoleScreen("item");
                        setPoleTestLoading(false);
                        setFeedbackMsg(ok ? "✅ Item scan test sent to pole display!" : "⚠️ Check COM port or bridge connection.");
                      }}
                      disabled={poleTestLoading}
                      className="py-1.5 px-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] text-foreground font-medium transition-colors disabled:opacity-50"
                    >
                      Test Item Scan
                    </button>
                    <button
                      onClick={async () => {
                        setPoleTestLoading(true);
                        const ok = await testPoleScreen("payment");
                        setPoleTestLoading(false);
                        setFeedbackMsg(ok ? "✅ Payment total sent to pole display!" : "⚠️ Check COM port or bridge connection.");
                      }}
                      disabled={poleTestLoading}
                      className="py-1.5 px-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] text-foreground font-medium transition-colors disabled:opacity-50"
                    >
                      Test Total Due
                    </button>
                    <button
                      onClick={async () => {
                        setPoleTestLoading(true);
                        const ok = await testPoleScreen("completed");
                        setPoleTestLoading(false);
                        setFeedbackMsg(ok ? "✅ Change due screen sent to pole display!" : "⚠️ Check COM port or bridge connection.");
                      }}
                      disabled={poleTestLoading}
                      className="py-1.5 px-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] text-foreground font-medium transition-colors disabled:opacity-50"
                    >
                      Test Change
                    </button>
                    <button
                      onClick={async () => {
                        setPoleTestLoading(true);
                        const ok = await clearPole();
                        setPoleTestLoading(false);
                        setFeedbackMsg(ok ? "✅ Pole display cleared!" : "⚠️ Failed to clear display.");
                      }}
                      disabled={poleTestLoading}
                      className="py-1.5 px-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] text-rose-500 font-medium transition-colors disabled:opacity-50 col-span-2 sm:col-span-1"
                    >
                      Clear Screen
                    </button>
                  </div>
                </div>

                {/* Troubleshooting Accordion */}
                <div className="border border-border rounded-xl overflow-hidden bg-surface">
                  <button
                    onClick={() => setShowPortHelp(!showPortHelp)}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-muted hover:text-foreground flex items-center justify-between"
                  >
                    <span>▶ "Failed to open serial port" what to check</span>
                    <span className="text-[10px] text-primary">{showPortHelp ? "Hide" : "Show Help"}</span>
                  </button>
                  {showPortHelp && (
                    <div className="px-3 pb-3 pt-1 text-[11px] text-muted space-y-1.5 border-t border-border bg-surface-elevated">
                      <p>1. <strong>Close other POS software:</strong> Serial COM ports are exclusive — if another software or utility is open, Windows blocks XONIT POS from accessing it.</p>
                      <p>2. <strong>Baud Rate:</strong> Single-line price displays almost always run at <strong>2400 baud</strong>. 2x20 VFD displays typically use <strong>9600 baud</strong>.</p>
                      <p>3. <strong>Device Manager:</strong> Check Windows Device Manager under <em>Ports (COM & LPT)</em> to confirm your port number (e.g. COM1 or COM3).</p>
                      <p>4. <strong>Browser:</strong> WebSerial requires Google Chrome or Microsoft Edge running on HTTPS or localhost.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dual-Screen Customer Monitor Section */}
            {(poleConfig.mode === "DUAL_SCREEN" || poleConfig.mode === "BOTH") && (
              <div className="p-4 rounded-xl bg-surface-elevated border border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Monitor size={15} className="text-purple-500" />
                    <span className="text-xs font-bold">Secondary Customer LCD Monitor</span>
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">
                    Opens full-color customer view (HDMI/VGA Display 2) with real-time cart, promo banner & LankaQR.
                  </p>
                </div>

                <button
                  onClick={launchCustomerDisplay}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-purple-600/20"
                >
                  <ExternalLink size={14} />
                  Launch Secondary Screen
                </button>
              </div>
            )}
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
