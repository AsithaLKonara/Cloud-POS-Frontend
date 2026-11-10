"use client";

import React, { forwardRef } from "react";
import { WarrantyClaim } from "@/services/warranty.service";

interface PrintableJobSheetProps {
  claim: WarrantyClaim;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
}

export const PrintableJobSheet = forwardRef<HTMLDivElement, PrintableJobSheetProps>(
  ({ claim, storeName = "XONIT COMMERCIAL TECH", storePhone = "+94 11 234 5678", storeAddress = "Colombo, Sri Lanka" }, ref) => {
    return (
      <div
        ref={ref}
        className="p-8 max-w-[210mm] mx-auto bg-white text-slate-900 font-sans text-xs leading-relaxed"
        style={{ minHeight: "297mm", fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {/* Header Strip */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">{storeName}</h1>
            <p className="text-[11px] text-slate-600 mt-0.5">{storeAddress}</p>
            <p className="text-[11px] text-slate-600">Hotline: {storePhone} | service@xonitspace.com</p>
          </div>
          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white font-mono font-bold px-3 py-1 text-sm rounded">
              {claim.claimNumber}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              DATE: {new Date(claim.receivedAt).toLocaleDateString()}
            </p>
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-0.5">
              SERVICE JOB SHEET / RMA SLIP
            </p>
          </div>
        </div>

        {/* Status & Priority Badge */}
        <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-slate-700">CLAIM STATUS: </span>
            <span className="font-mono font-bold uppercase text-slate-900">{claim.status.replace(/_/g, " ")}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">WARRANTY STATUS: </span>
            <span className={`font-mono font-bold uppercase ${claim.isCovered ? "text-emerald-700" : "text-amber-700"}`}>
              {claim.isCovered ? "COVERED (UNDER WARRANTY)" : "CHARGEABLE (OUT OF WARRANTY)"}
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Customer & Device */}
        <div className="grid grid-cols-2 gap-6 my-4">
          {/* Customer Dossier */}
          <div className="border border-slate-200 rounded p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b pb-1 mb-2">
              Customer Information
            </h2>
            <div className="space-y-1">
              <p><strong className="text-slate-700">Name:</strong> {claim.customer?.name || "Walk-in Customer"}</p>
              <p><strong className="text-slate-700">Phone:</strong> {claim.customer?.phone || "N/A"}</p>
              <p><strong className="text-slate-700">Email:</strong> {claim.customer?.email || "N/A"}</p>
              <p><strong className="text-slate-700">Intake Branch:</strong> {claim.branch?.name || "Headquarters Workshop"}</p>
            </div>
          </div>

          {/* Device Dossier */}
          <div className="border border-slate-200 rounded p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b pb-1 mb-2">
              Device & Serial Information
            </h2>
            <div className="space-y-1">
              <p><strong className="text-slate-700">Product:</strong> {claim.productVariant?.product?.name || claim.productVariant?.name}</p>
              <p className="font-mono"><strong className="text-slate-700">Serial #:</strong> {claim.serialNumber || "N/A"}</p>
              {claim.imei && <p className="font-mono"><strong className="text-slate-700">IMEI:</strong> {claim.imei}</p>}
              <p><strong className="text-slate-700">Order Reference:</strong> {claim.order?.orderNumber || "Direct Intake"}</p>
              <p><strong className="text-slate-700">Physical Condition:</strong> {claim.physicalCondition || "Normal wear"}</p>
            </div>
          </div>
        </div>

        {/* Reported Defect & Symptoms */}
        <div className="my-4 border border-slate-200 rounded p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b pb-1 mb-2">
            Reported Defect & Customer Complaint
          </h2>
          {claim.reportedDefect && (
            <p className="font-bold text-slate-800 mb-1">
              Symptom: {claim.reportedDefect}
            </p>
          )}
          <p className="text-slate-700 bg-slate-50 p-2.5 rounded font-mono text-[11px] border border-slate-100">
            {claim.issueDescription}
          </p>
        </div>

        {/* Technician Diagnostic & Resolution */}
        <div className="my-4 border border-slate-200 rounded p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b pb-1 mb-2">
            Technician Diagnosis & Resolution Notes
          </h2>
          <div className="space-y-2 text-slate-700">
            <div>
              <span className="font-bold text-slate-800">Diagnostic Findings: </span>
              <span>{claim.diagnosticNotes || "Inspection in progress / pending bench testing."}</span>
            </div>
            {claim.resolutionNotes && (
              <div>
                <span className="font-bold text-slate-800">Resolution Applied: </span>
                <span>{claim.resolutionNotes}</span>
              </div>
            )}
            {claim.status === "REPLACED" && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-mono">
                ★ Unit Replaced under Manufacturer Policy. New Serial: {claim.replacementSerialId || "ASSIGNED"}
              </div>
            )}
          </div>
        </div>

        {/* Cost Summary if Applicable */}
        {((claim.repairCost || 0) > 0 || (claim.customerCharge || 0) > 0) && (
          <div className="my-4 border border-slate-200 rounded p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b pb-1 mb-2">
              Parts & Labor Breakdown
            </h2>
            <div className="flex justify-between items-center text-xs py-1">
              <span>Internal Repair & Parts Cost:</span>
              <span className="font-mono font-bold">Rs. {(claim.repairCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-100">
              <span>Customer Chargeable Amount:</span>
              <span className="font-mono text-base">Rs. {(claim.customerCharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Terms & Customer Acknowledgement Sign-off */}
        <div className="mt-8 pt-4 border-t border-slate-300 text-[10px] text-slate-500 space-y-3">
          <p>
            <strong>Terms of Service:</strong> 1. Goods collected must be accompanied by this original job sheet. 
            2. Customer data must be backed up prior to service; workshop is not liable for data loss. 
            3. Repaired items not claimed within 30 days of completion notice are subject to storage charges or disposal.
          </p>

          <div className="grid grid-cols-2 gap-12 pt-8">
            <div className="border-t border-slate-400 pt-1 text-center">
              <p className="font-bold text-slate-700">Customer Signature</p>
              <p className="text-[9px] text-slate-400">I confirm the physical condition & defect described above</p>
            </div>
            <div className="border-t border-slate-400 pt-1 text-center">
              <p className="font-bold text-slate-700">Authorized Technician / Store Officer</p>
              <p className="text-[9px] text-slate-400">Received for diagnosis & authorized service</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PrintableJobSheet.displayName = "PrintableJobSheet";
