"use client";

import React, { useState } from "react";
import { SupportTicketService, TicketCategory, TicketPriority } from "@/services/support-ticket.service";
import { useHardware } from "@/hooks/useHardware";
import { toast } from "@/store/toast.store";
import {
  LifeBuoy,
  X,
  Send,
  AlertTriangle,
  Printer,
  Tv,
  Scale,
  RefreshCw,
  CheckCircle2,
  Terminal,
  Cpu,
  DollarSign,
  Barcode,
} from "lucide-react";

interface PosDiagnosticTicketModalProps {
  onClose: () => void;
  branchName?: string;
  cashierName?: string;
  cartCount: number;
  totalPayable: number;
}

export default function PosDiagnosticTicketModal({
  onClose,
  branchName = "Flagship Store",
  cashierName = "Cashier",
  cartCount,
  totalPayable,
}: PosDiagnosticTicketModalProps) {
  const { bridgeStatus, poleConfig, isPoleSerialConnected, scaleReading, isScaleConnected } = useHardware();

  const [selectedPreset, setSelectedPreset] = useState<string>("PRINTER_OFFLINE");
  const [subject, setSubject] = useState("Thermal printer not responding or bridge offline");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketCreatedNum, setTicketCreatedNum] = useState<number | null>(null);

  const presets = [
    {
      id: "PRINTER_OFFLINE",
      label: "Thermal Printer Offline",
      icon: Printer,
      subject: "Thermal printer not responding / bridge offline at 127.0.0.1:18181",
      category: "HARDWARE_PERIPHERAL" as TicketCategory,
      priority: "CRITICAL_URGENT" as TicketPriority,
      defaultNote: "Printer stopped printing receipts and drawer kick pulse is not triggered.",
    },
    {
      id: "POLE_DISPLAY",
      label: "Pole Display Blank / Garbled",
      icon: Tv,
      subject: "Customer Pole Display not showing prices (ESC Q A / 2400 baud)",
      category: "HARDWARE_PERIPHERAL" as TicketCategory,
      priority: "HIGH" as TicketPriority,
      defaultNote: "Customer facing 2x20 / LED price display remains blank or displays unreadable characters during item scan.",
    },
    {
      id: "DRAWER_JAMMED",
      label: "Cash Drawer Jammed",
      icon: DollarSign,
      subject: "Cash drawer RJ11 kick pulse failed",
      category: "HARDWARE_PERIPHERAL" as TicketCategory,
      priority: "HIGH" as TicketPriority,
      defaultNote: "Cash drawer does not open after cash settlement.",
    },
    {
      id: "SCANNER_ERROR",
      label: "Barcode Scanner Issue",
      icon: Barcode,
      subject: "Barcode scanner not reading product codes",
      category: "HARDWARE_PERIPHERAL" as TicketCategory,
      priority: "MEDIUM" as TicketPriority,
      defaultNote: "Laser / 2D scanner does not append enter key or fails to look up product SKUs.",
    },
    {
      id: "CHECKOUT_DEADLOCK",
      label: "Payment / Checkout Failure",
      icon: AlertTriangle,
      subject: "Checkout transaction error during payment settlement",
      category: "POS_REGISTER" as TicketCategory,
      priority: "CRITICAL_URGENT" as TicketPriority,
      defaultNote: "Checkout button throws error or transaction fails to commit order sequence.",
    },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedPreset(p.id);
    setSubject(p.subject);
    if (!description || presets.some((x) => x.defaultNote === description)) {
      setDescription(p.defaultNote);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setSubmitting(true);
    try {
      const activePreset = presets.find((p) => p.id === selectedPreset);

      // Package full live POS & peripheral telemetry
      const posMetadata = {
        route: "/pos",
        branchName,
        cashierName,
        cart: {
          itemCount: cartCount,
          totalAmount: totalPayable,
        },
        device: {
          userAgent: window.navigator.userAgent,
          screenResolution: `${window.innerWidth}x${window.innerHeight}`,
          online: window.navigator.onLine,
        },
        hardware: {
          thermalBridge: {
            status: bridgeStatus.online ? "ONLINE" : "OFFLINE",
            latencyMs: bridgeStatus.latencyMs,
            printersDetected: bridgeStatus.printers.length,
          },
          poleDisplay: {
            mode: poleConfig.mode,
            transport: poleConfig.transport,
            port: poleConfig.port,
            baudRate: poleConfig.baudRate,
            protocol: poleConfig.protocol,
            webSerialConnected: isPoleSerialConnected,
          },
          scale: {
            connected: isScaleConnected,
            currentReading: scaleReading,
          },
        },
      };

      const res = await SupportTicketService.createTenantTicket({
        subject: subject.trim(),
        description: description.trim() || activePreset?.defaultNote || "POS register issue reported by cashier.",
        category: activePreset?.category || "HARDWARE_PERIPHERAL",
        priority: activePreset?.priority || "CRITICAL_URGENT",
        sourceRoute: "/pos",
        posMetadata,
      });

      setTicketCreatedNum(res.data.ticketNumber);
      toast.success(`Priority support ticket #${res.data.ticketNumber} opened!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to open support ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-150 text-foreground">
      <div className="bg-surface border border-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface-elevated">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <LifeBuoy size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">POS Quick Diagnostic & Helpdesk</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase font-mono">
                  SLA 30M
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Directly alerts SaaS engineering with automatic hardware telemetry snapshot.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {ticketCreatedNum ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-foreground">Ticket #{ticketCreatedNum} Created!</h4>
              <p className="text-xs text-muted max-w-md mx-auto">
                SaaS Support Engineers have received your device snapshot and are triaging the issue under the 30-minute priority SLA.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-elevated border border-border font-mono text-xs text-muted max-w-sm mx-auto">
              Outlet: <strong className="text-foreground">{branchName}</strong> • Cashier: <strong className="text-foreground">{cashierName}</strong>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs transition-colors shadow-md shadow-primary/20"
            >
              Back to POS Register
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted block">Select Quick Issue Preset</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presets.map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1.5 ${
                        isSelected
                          ? "bg-primary-soft text-primary border-primary shadow-sm font-semibold"
                          : "bg-surface-elevated text-muted hover:text-foreground border-border"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-[11px] leading-tight block">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="font-semibold text-muted block">Issue Title</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border text-foreground font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* Note / Details */}
            <div className="space-y-1">
              <label className="font-semibold text-muted block">Additional Cashier Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any specific details (e.g. error code on screen, customer waiting)..."
                className="w-full p-3 rounded-xl bg-surface-elevated border border-border text-foreground placeholder-muted focus:outline-none focus:border-primary"
              />
            </div>

            {/* Live Telemetry Preview Banner */}
            <div className="p-3 rounded-xl bg-surface-elevated border border-border font-mono text-[11px] space-y-1 text-muted">
              <div className="flex items-center justify-between text-foreground font-bold">
                <span className="flex items-center gap-1.5">
                  <Terminal size={12} /> Live Device Diagnostics Bundled
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">● AUTO-CAPTURED</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                <div>Thermal Bridge: <strong className={bridgeStatus.online ? "text-emerald-500" : "text-rose-500"}>{bridgeStatus.online ? "ONLINE" : "OFFLINE"}</strong></div>
                <div>Pole Display: <strong className="text-foreground">{poleConfig.protocol} ({poleConfig.baudRate} bps)</strong></div>
                <div>Active Cart: <strong className="text-foreground">{cartCount} item(s) • Rs.{totalPayable.toLocaleString()}</strong></div>
                <div>Cashier: <strong className="text-foreground">{cashierName}</strong></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface text-foreground font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all flex items-center gap-2 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {submitting ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                Submit Urgent Ticket
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
