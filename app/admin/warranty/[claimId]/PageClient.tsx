"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Printer,
  User,
  Phone,
  Mail,
  Barcode,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Check,
  Send,
  FileText,
  DollarSign,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { warrantyService, WarrantyClaim } from "@/services/warranty.service";
import { PrintableJobSheet } from "@/components/warranty/PrintableJobSheet";
import { globalDialog } from "@/store/dialog.store";
import { useAuthStore } from "@/store/auth.store";

export default function ClaimJobSheetClient({ claimId }: { claimId: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state for updating claim
  const [status, setStatus] = useState<string>("");
  const [diagnosticNotes, setDiagnosticNotes] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [replacementSerial, setReplacementSerial] = useState<string>("");
  const [laborCost, setLaborCost] = useState<number>(0);
  const [partsCost, setPartsCost] = useState<number>(0);
  const [internalRemarks, setInternalRemarks] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Print ref
  const printComponentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `Job-Sheet-${claim?.claimNumber || claimId}`,
    pageStyle: `@page { size: A4; margin: 12mm; } body { margin: 0; padding: 0; }`,
  });

  const loadClaim = useCallback(async () => {
    try {
      setLoading(true);
      const data = await warrantyService.getClaimById(claimId);
      setClaim(data);
      setStatus(data.status);
      setDiagnosticNotes(data.diagnosticNotes || "");
      setResolutionNotes(data.resolutionNotes || "");
      setLaborCost((data as any).repairCost || (data as any).laborCost || 0);
      setPartsCost((data as any).customerCharge || (data as any).partsCost || 0);
    } catch (err: any) {
      console.error("Failed to load claim:", err);
      globalDialog.alert(err?.response?.data?.message || err?.message || "Failed to load claim", "Error", { variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    loadClaim();
  }, [loadClaim]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;

    setIsUpdating(true);
    try {
      const updated = await warrantyService.updateClaimStatus(claimId, {
        status,
        diagnosticNotes,
        resolutionNotes,
        replacementSerialNumber: status === "REPLACED" ? replacementSerial : undefined,
        laborCost: Number(laborCost) || 0,
        partsCost: Number(partsCost) || 0,
        notes: internalRemarks || undefined,
        performedBy: user?.name || user?.email || "Technician Staff",
      });

      setClaim(updated);
      setInternalRemarks("");
      globalDialog.alert(`Claim updated to ${status.replace(/_/g, " ")}!`, "Status Updated");
    } catch (err: any) {
      globalDialog.alert(err?.response?.data?.message || err?.message || "Failed to update claim", "Update Error", { variant: "danger" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-inter text-muted">Loading service job sheet dossier...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-8 max-w-6xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Claim Dossier Not Found</h2>
        <Link href="/admin/warranty" className="inline-flex items-center gap-2 text-primary font-bold text-sm">
          <ArrowLeft size={16} /> Back to Warranty Console
        </Link>
      </div>
    );
  }

  // Determine active step index for visual stepper
  const steps = [
    { key: "RECEIVED", label: "Intake & Inspection" },
    { key: "IN_DIAGNOSIS", label: "Diagnostic Testing" },
    { key: "SENT_TO_VENDOR", label: "Vendor RMA / Repair" },
    { key: "RESOLVED", label: "Repaired / Replaced" },
    { key: "CLOSED", label: "Closed & Handed Off" },
  ];

  const getStepIndex = (st: string) => {
    if (st === "RECEIVED") return 0;
    if (st === "IN_DIAGNOSIS") return 1;
    if (st === "SENT_TO_VENDOR") return 2;
    if (st === "REPAIRED" || st === "REPLACED") return 3;
    if (st === "CLOSED") return 4;
    return 1;
  };

  const currentStepIdx = getStepIndex(claim.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/warranty"
            className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl sm:text-2xl font-black text-foreground">
                {claim.claimNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                {claim.status.replace(/_/g, " ")}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                claim.isCovered ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              }`}>
                {claim.isCovered ? "🛡️ Warranty Covered" : "⚠️ Chargeable (Out of Warranty)"}
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Opened on {new Date(claim.receivedAt).toLocaleDateString()} at {claim.branch?.name || "Main Branch"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePrint()}
            data-testid="print-job-sheet-btn"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated font-inter font-bold text-xs sm:text-sm transition-all shadow-sm"
          >
            <Printer size={16} />
            <span>Print A4 Job Sheet</span>
          </button>
        </div>
      </div>

      {/* Visual Workflow Stepper */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
          Service Lifecycle & RMA Progress
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {steps.map((step, idx) => {
            const isCompleted = currentStepIdx > idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <div
                key={step.key}
                className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                  isCurrent
                    ? "bg-primary/10 border-primary text-primary"
                    : isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-surface-elevated/40 border-border text-muted"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span>Step {idx + 1}</span>
                  {isCompleted ? <Check size={14} /> : isCurrent ? <Clock size={14} /> : null}
                </div>
                <span className="font-semibold text-xs text-foreground mt-0.5">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Split: Dossier vs Technician Workshop Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dossier & History (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Customer & Device Information */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2 border-b border-border pb-3">
              <User size={16} />
              <span>Customer & Device Dossier</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted block">Customer Name</span>
                <span className="font-semibold text-foreground text-sm">
                  {claim.customer?.name || "Walk-in Guest"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-muted block">Phone Number</span>
                <span className="font-mono font-semibold text-foreground text-sm">
                  {claim.customer?.phone || "N/A"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-muted block">Product Name</span>
                <span className="font-semibold text-foreground text-sm">
                  {claim.productVariant?.product?.name || claim.productVariant?.name}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-muted block">Serial Number</span>
                <span className="font-mono font-bold text-foreground text-sm">
                  {claim.serialNumber || "No serial recorded"}
                </span>
              </div>

              {claim.imei && (
                <div className="space-y-1">
                  <span className="text-muted block">IMEI</span>
                  <span className="font-mono font-semibold text-foreground text-sm">
                    {claim.imei}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-muted block">Purchase Order</span>
                <span className="font-mono font-semibold text-primary">
                  {claim.order?.orderNumber || "Direct Intake / Legacy"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-muted block">Physical Condition on Intake</span>
                <span className="font-medium text-foreground">
                  {claim.physicalCondition || "Good - Minor normal wear"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-muted block">Warranty Policy</span>
                <span className="font-medium text-foreground">
                  {claim.productVariant?.product?.warrantyPolicy || `${claim.productVariant?.product?.warrantyPeriodMonths || 12} Months Standard`}
                </span>
              </div>
            </div>

            {/* Reported Defect Box */}
            <div className="pt-3 border-t border-border">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                Reported Defect & Customer Complaint
              </span>
              <div className="p-3 bg-surface-elevated rounded-xl border border-border text-xs text-foreground font-medium">
                {claim.reportedDefect && (
                  <p className="font-bold text-primary mb-1">Symptom: {claim.reportedDefect}</p>
                )}
                <p>{claim.issueDescription}</p>
              </div>
            </div>
          </div>

          {/* Audit Timeline Logs */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2 border-b border-border pb-3">
              <Clock size={16} />
              <span>Chronological Service History & Audit Log</span>
            </h3>

            {(!claim.logs || claim.logs.length === 0) ? (
              <p className="text-xs text-muted py-4 text-center">No logs recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {claim.logs.map((lg) => (
                  <div key={lg.id} className="p-3 bg-surface-elevated/40 border border-border rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-muted font-mono text-[11px]">
                      <span>{lg.createdAt ? new Date(lg.createdAt).toLocaleString() : "Just now"}</span>
                      <span className="font-semibold text-foreground">{lg.performedBy || "Staff"}</span>
                    </div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>{lg.action}</span>
                      <span className="text-muted">→</span>
                      <span className="font-mono text-primary font-bold">{lg.newStatus}</span>
                    </div>
                    {lg.notes && <p className="text-muted italic">{lg.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Technician Workshop Action Center (5 Cols) */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleUpdateStatus}
            data-testid="technician-actions-card"
            className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5 sticky top-6"
          >
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <Wrench size={18} className="text-primary" />
                <span>Technician Service Desk</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-muted">
                {user?.name || "Technician"}
              </span>
            </div>

            {/* Target Status Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Transition Status To *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                data-testid="claim-status-select"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="RECEIVED">RECEIVED (Intake Inspection)</option>
                <option value="IN_DIAGNOSIS">IN_DIAGNOSIS (Bench Testing)</option>
                <option value="SENT_TO_VENDOR">SENT_TO_VENDOR (Manufacturer RMA)</option>
                <option value="REPAIRED">REPAIRED (Hardware Repaired / Passed QA)</option>
                <option value="REPLACED">REPLACED (New Unit Issued to Customer)</option>
                <option value="REJECTED">REJECTED (Physical Damage / Void Warranty)</option>
                <option value="CLOSED">CLOSED (Collected by Customer)</option>
              </select>
            </div>

            {/* If REPLACED: Replacement Serial Input */}
            {status === "REPLACED" && (
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-teal-800 dark:text-teal-300">
                  New Replacement Serial Number *
                </label>
                <input
                  type="text"
                  required
                  data-testid="replacement-serial-input"
                  placeholder="Scan or enter new unit serial number"
                  value={replacementSerial}
                  onChange={(e) => setReplacementSerial(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-muted block">
                  Original serial will be archived as REPLACED.
                </span>
              </div>
            )}

            {/* Diagnostic Findings */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Technician Diagnostic Findings
              </label>
              <textarea
                rows={3}
                data-testid="diagnostic-notes-input"
                placeholder="Findings from bench testing (e.g. faulty capacitor on mainboard, defective display ribbon)..."
                value={diagnosticNotes}
                onChange={(e) => setDiagnosticNotes(e.target.value)}
                className="w-full p-3 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Resolution Applied */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Resolution Notes / Work Done
              </label>
              <textarea
                rows={2}
                data-testid="resolution-notes-input"
                placeholder="Details of action taken (e.g. replaced power inverter, flashed firmware v2.1)..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full p-3 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-foreground">Labor Charges (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={laborCost}
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-foreground">Parts Cost (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={partsCost}
                  onChange={(e) => setPartsCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Internal Audit Remark */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted">
                Status Change Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Bench tested with customer present; dispatched to courier"
                value={internalRemarks}
                onChange={(e) => setInternalRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                data-testid="update-claim-status-btn"
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-inter font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? <Clock size={16} className="animate-spin" /> : <Check size={16} />}
                <span>Save Job Sheet & Transition Status</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Hidden Container for react-to-print */}
      <div style={{ display: "none" }}>
        <PrintableJobSheet
          ref={printComponentRef}
          claim={claim}
          storeName={user?.tenant?.name || "XONIT COMMERCIAL TECH"}
          storePhone={(user?.branch as any)?.phone || "+94 11 234 5678"}
          storeAddress={(user?.branch as any)?.address || "Colombo, Sri Lanka"}
        />
      </div>

    </div>
  );
}
