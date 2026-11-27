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
  Plug,
  HelpCircle,
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
    webSerialPorts,
    refreshSerialPorts,
    addSerialPort,
    autoDetectPole,
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
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [autoDetectMsg, setAutoDetectMsg] = useState<string | null>(null);
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

            {/* 2x20 VFD Character Pole Settings & Single-Line Price Display */}
            {(poleConfig.mode === "VFD_2X20" || poleConfig.mode === "BOTH") && (
              <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-4 shadow-sm">
                
                {/* 1. Auto-detect Header Banner (1:1 with reference) */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-blue-600 dark:text-blue-400">
                      <Sparkles size={14} className="text-blue-500" />
                      <span>Don&apos;t know which port? Auto-detect</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Sends a test frame to every port at every speed. Watch the display when something appears, pick that line below.
                    </p>
                    {autoDetectMsg && (
                      <p className="text-[11px] font-mono text-blue-500 font-semibold animate-pulse">
                        {autoDetectMsg}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      setAutoDetecting(true);
                      setAutoDetectMsg("Running port scan across speeds (2400, 9600)...");
                      try {
                        await autoDetectPole((msg) => setAutoDetectMsg(msg));
                      } catch (err: any) {
                        setAutoDetectMsg(`Error: ${err.message}`);
                      } finally {
                        setAutoDetecting(false);
                      }
                    }}
                    disabled={autoDetecting}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0 disabled:opacity-50 shadow-sm"
                  >
                    {autoDetecting ? "Scanning..." : "Auto-detect"}
                  </button>
                </div>

                {/* 2. COM Port Dropdown with Refresh and Add Port (1:1 with reference) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-foreground">COM port</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={refreshSerialPorts}
                        className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                      >
                        <RefreshCw size={12} className={poleTestLoading ? "animate-spin" : ""} />
                        <span>Refresh</span>
                      </button>
                      <button
                        onClick={async () => {
                          const added = await addSerialPort();
                          if (added) {
                            setFeedbackMsg(`✅ Added new serial port: ${added}`);
                          }
                        }}
                        className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline transition-colors font-medium"
                      >
                        <Plug size={12} />
                        <span>Add port</span>
                      </button>
                    </div>
                  </div>
                  <select
                    value={poleConfig.port}
                    onChange={(e) => updatePoleConfig({ port: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-blue-500 shadow-sm"
                  >
                    {availablePorts.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Speed (baud) and Display Type (1:1 with reference) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Speed (baud) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Speed (baud)</label>
                    <select
                      value={poleConfig.baudRate}
                      onChange={(e) => updatePoleConfig({ baudRate: parseInt(e.target.value, 10) })}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-blue-500 shadow-sm"
                    >
                      {[2400, 4800, 9600, 19200, 38400, 115200].map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80 block mt-0.5">
                      Most common for single-line price displays
                    </span>
                  </div>

                  {/* Display Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Display type</label>
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
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-blue-500 shadow-sm"
                    >
                      <option value="PRICE_DISPLAY">Price display (ESC Q A)</option>
                      <option value="CD5220">CD5220 (Posiflex & Generic 2x20)</option>
                      <option value="ESCPOS">ESC/POS (Epson DM-D 2x20)</option>
                      <option value="UTC">UTC Standard / Enhanced</option>
                      <option value="AEDEX">AEDEX Standard</option>
                    </select>
                  </div>
                </div>

                {/* 4. Action Buttons: Connect, Send test, Disconnect (1:1 with reference) */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={async () => {
                      setPoleTestLoading(true);
                      setFeedbackMsg(null);
                      try {
                        const ok = await connectPoleSerial(poleConfig.port);
                        if (ok) {
                          setFeedbackMsg(`✅ Connected to ${poleConfig.port} @ ${poleConfig.baudRate} bps!`);
                        }
                      } finally {
                        setPoleTestLoading(false);
                      }
                    }}
                    disabled={poleTestLoading}
                    className={`px-6 py-2 rounded-xl font-semibold text-xs transition-colors shadow-sm ${
                      isPoleSerialConnected
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    } disabled:opacity-50`}
                  >
                    {isPoleSerialConnected ? "Connected" : "Connect"}
                  </button>

                  <button
                    onClick={async () => {
                      setPoleTestLoading(true);
                      setFeedbackMsg(null);
                      try {
                        let ok = false;
                        if (poleConfig.protocol === "PRICE_DISPLAY") {
                          ok = await sendPolePrice("8888.88", "PRICE");
                        } else {
                          ok = await sendDiagnosticTest();
                        }
                        setFeedbackMsg(ok ? "✅ Test frame sent! (Check display for 8888.88)" : "⚠️ Send failed. Connect port first.");
                      } finally {
                        setPoleTestLoading(false);
                      }
                    }}
                    disabled={poleTestLoading}
                    className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Send test
                  </button>

                  <button
                    onClick={async () => {
                      await disconnectPoleSerial();
                      setFeedbackMsg("Disconnected from serial port.");
                    }}
                    disabled={!isPoleSerialConnected}
                    className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-muted hover:text-foreground text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    Disconnect
                  </button>

                  <div className="ml-auto flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isPoleSerialConnected ? "bg-emerald-500 animate-pulse" : "bg-stone-500"
                      }`}
                    />
                    <span className="text-[11px] font-mono text-muted">
                      {isPoleSerialConnected ? `Port Open (${poleConfig.baudRate} bps)` : "Port Closed"}
                    </span>
                  </div>
                </div>

                {/* 5. Collapsible Accordion: 'Failed to open serial port' what to check (1:1 with reference) */}
                <div className="border border-border rounded-xl overflow-hidden bg-surface mt-2">
                  <button
                    onClick={() => setShowPortHelp(!showPortHelp)}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-muted hover:text-foreground flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span>▶ &ldquo;Failed to open serial port&rdquo; what to check</span>
                    </span>
                    <span className="text-[11px] text-blue-500">{showPortHelp ? "Collapse" : "Expand"}</span>
                  </button>
                  {showPortHelp && (
                    <div className="px-4 pb-3.5 pt-2 text-[11px] text-muted space-y-2 border-t border-border bg-surface-elevated">
                      <p>1. <strong>Close other POS software:</strong> Serial COM ports are exclusive in Windows. If another POS software, utility, or serial terminal is open, close it completely so XONIT POS can acquire the port handle.</p>
                      <p>2. <strong>Speed:</strong> Single-line LED price displays (ESC Q A) strictly communicate at <strong>2400 baud</strong>. 2x20 VFD screens use <strong>9600 baud</strong>.</p>
                      <p>3. <strong>Port Selection:</strong> If using a USB adapter, click <strong>&ldquo;Add port&rdquo;</strong> to authorize the device (e.g. CH340, Prolific). If using built-in motherboard serial, select <strong>&ldquo;Port 1 built-in / Bluetooth&rdquo;</strong>.</p>
                      <p>4. <strong>Browser:</strong> WebSerial runs natively in Google Chrome and Microsoft Edge on Windows 7 (Chrome 109) and Windows 10/11.</p>
                    </div>
                  )}
                </div>

                {/* Direct Numeric Test Controls (Price, Total, Change) */}
                <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2 pt-3">
                  <span className="text-[11px] font-semibold text-muted block">Direct Numeric Test (ESC Q A)</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={customTestAmount}
                      onChange={(e) => setCustomTestAmount(e.target.value)}
                      placeholder="e.g. 2750.00"
                      className="w-32 bg-surface-elevated border border-border rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={async () => {
                        setPoleTestLoading(true);
                        const ok = await sendPolePrice(customTestAmount, "PRICE");
                        setPoleTestLoading(false);
                        setFeedbackMsg(ok ? `✅ Price Rs.${customTestAmount} sent!` : "⚠️ Send failed.");
                      }}
                      disabled={poleTestLoading}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-[11px] font-medium text-foreground transition-colors disabled:opacity-50"
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
                      className="px-2.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-[11px] font-medium text-foreground transition-colors disabled:opacity-50"
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
                      className="px-2.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-[11px] font-medium text-foreground transition-colors disabled:opacity-50"
                    >
                      Change (ESC s 4)
                    </button>
                    <button
                      onClick={async () => {
                        setPoleTestLoading(true);
                        const ok = await clearPole();
                        setPoleTestLoading(false);
                        setFeedbackMsg(ok ? "✅ Pole display cleared!" : "⚠️ Failed to clear display.");
                      }}
                      disabled={poleTestLoading}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-[11px] text-rose-500 font-medium transition-colors disabled:opacity-50 ml-auto"
                    >
                      Clear Screen
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
