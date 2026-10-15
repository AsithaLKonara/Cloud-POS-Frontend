"use client";

import { CheckCircle2, Printer, Plus, FileText, Building2 } from "lucide-react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Receipt from "./Receipt";
import WorkshopInvoiceA4 from "./WorkshopInvoiceA4";

export default function OrderSuccessModal({ 
  onClose, 
  orderData
}: { 
  onClose: () => void,
  orderData?: any
}) {
  const thermalRef = useRef<HTMLDivElement>(null);
  const a4InvoiceRef = useRef<HTMLDivElement>(null);

  const handlePrintThermal = useReactToPrint({
    contentRef: thermalRef,
    documentTitle: `Receipt-${orderData?.orderNumber || orderData?.orderId || "POS"}`,
    pageStyle: `@page { size: 80mm auto; margin: 0; } body { margin: 0; padding: 0; }`,
  });

  const handlePrintA4Invoice = useReactToPrint({
    contentRef: a4InvoiceRef,
    documentTitle: `Invoice-${orderData?.orderNumber || orderData?.orderId || "POS"}`,
    pageStyle: `@page { size: A4 portrait; margin: 10mm; } body { margin: 0; }`,
  });

  const receiptProps = {
    orderId: orderData?.orderNumber || orderData?.orderId || `POS-${Date.now()}`,
    cashierName: orderData?.cashierName || "Cashier",
    date: new Date(),
    items: orderData?.items || [],
    subtotal: orderData?.subtotal || 0,
    discount: orderData?.discount || 0,
    total: orderData?.total || 0,
    paymentMethod: orderData?.paymentMethod || "Cash",
    tendered: orderData?.tendered || undefined,
    change: orderData?.change || undefined,
    branchName: orderData?.branchName || "Oil Retail POS",
    branchAddress: orderData?.branchAddress || "Main Distribution Hub",
    branchPhone: orderData?.branchPhone || "+94 11 234 5678"
  };

  const isCredit = receiptProps.paymentMethod === 'CREDIT_ACCOUNT' || receiptProps.paymentMethod === 'GARAGE_CREDIT';
  const customer = orderData?.customer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-[460px] bg-background shadow-2xl rounded-2xl overflow-hidden flex flex-col items-center animate-in fade-in zoom-in duration-300 p-8">
        
        {/* Status Icon */}
        <div className={`w-18 h-18 rounded-2xl flex items-center justify-center mb-4 shadow-sm p-4 ${
          isCredit ? "bg-amber-500/10 text-amber-700" : "bg-emerald-500/10 text-emerald-700"
        }`}>
          {isCredit ? <Building2 size={40} /> : <CheckCircle2 size={40} />}
        </div>

        <h2 className="font-inter font-bold text-2xl text-foreground text-center mb-1">
          {isCredit ? "Credit Invoice Issued!" : "Sale Completed!"}
        </h2>
        <p className="font-inter text-muted text-xs text-center mb-6">
          Order #{receiptProps.orderId} recorded successfully.
        </p>

        {/* Invoice Summary Card */}
        <div className="w-full bg-surface border border-border rounded-xl p-4 flex flex-col gap-2.5 mb-6 text-xs font-inter">
          <div className="flex justify-between items-center">
            <span className="text-muted">Total Amount</span>
            <span className="font-mono font-black text-lg text-foreground">
              Rs. {receiptProps.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted">Payment Tender</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              isCredit ? "bg-amber-100 text-amber-900" : "bg-stone-100 text-stone-800"
            }`}>
              {isCredit ? "WORKSHOP ACCOUNT CREDIT" : receiptProps.paymentMethod}
            </span>
          </div>

          {customer && (
            <div className="flex justify-between items-center pt-2 border-t border-border text-muted">
              <span>Customer / Garage</span>
              <span className="font-semibold text-foreground">{customer.companyName || customer.name}</span>
            </div>
          )}

          {receiptProps.change !== undefined && receiptProps.change > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-bold text-emerald-700 uppercase tracking-wide">Cash Change Returned</span>
              <span className="font-mono font-black text-base text-emerald-700">
                Rs. {receiptProps.change.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Dual Format Print Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button 
              type="button"
              onClick={() => handlePrintThermal()}
              className="py-3 px-3 bg-surface border border-border hover:border-primary text-foreground rounded-xl font-inter font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-sm hover:bg-background"
            >
              <Printer size={15} className="text-primary" />
              Thermal (80mm)
            </button>

            <button 
              type="button"
              onClick={() => handlePrintA4Invoice()}
              className="py-3 px-3 bg-surface border border-border hover:border-primary text-foreground rounded-xl font-inter font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-sm hover:bg-background"
            >
              <FileText size={15} className="text-primary" />
              Workshop A4
            </button>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-inter font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-1"
          >
            <Plus size={18} /> Next POS Sale
          </button>
        </div>

        {/* Hidden Thermal Receipt & A4 Invoice (rendered for iframe printing) */}
        <div className="hidden">
          <div ref={thermalRef}>
            <Receipt {...receiptProps} />
          </div>
          <div ref={a4InvoiceRef}>
            <WorkshopInvoiceA4 
              {...receiptProps} 
              orderNumber={orderData?.orderNumber} 
              customer={customer} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}
