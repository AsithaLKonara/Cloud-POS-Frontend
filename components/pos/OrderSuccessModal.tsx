"use client";

import { CheckCircle2, Printer, Plus, FileText, Building2, Sparkles } from "lucide-react";
import { useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import Receipt from "./Receipt";
import WorkshopInvoiceA4 from "./WorkshopInvoiceA4";
import { hardwareService } from "@/services/hardware.service";

export default function OrderSuccessModal({ 
  onClose, 
  orderData
}: { 
  onClose: () => void,
  orderData?: any
}) {
  const thermalRef = useRef<HTMLDivElement>(null);
  const a4InvoiceRef = useRef<HTMLDivElement>(null);

  const handleBrowserPrintThermal = useReactToPrint({
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
    branchName: orderData?.branchName || "XONIT Flagship Store",
    branchAddress: orderData?.branchAddress || "Universal Retail Hub, Colombo 03",
    branchPhone: orderData?.branchPhone || "+94 11 234 5678"
  };

  // Kick cash drawer automatically on cash transaction
  useEffect(() => {
    if (orderData?.paymentMethod?.toUpperCase() === "CASH") {
      hardwareService.kickCashDrawer(2);
    }
    // Update customer display to completed state
    hardwareService.updateCustomerDisplay({
      storeName: receiptProps.branchName,
      cashier: receiptProps.cashierName,
      itemCount: receiptProps.items.length,
      subtotalLkr: receiptProps.subtotal,
      discountLkr: receiptProps.discount,
      totalLkr: receiptProps.total,
      amountPaidLkr: receiptProps.tendered,
      changeDueLkr: receiptProps.change,
      status: "COMPLETED",
    });
  }, [orderData, receiptProps]);

  const handlePrintThermal = async () => {
    // Attempt zero-click silent hardware print via local bridge
    const silentSuccess = await hardwareService.printThermalReceipt({
      companyName: receiptProps.branchName,
      companyAddress: receiptProps.branchAddress,
      phone: receiptProps.branchPhone,
      orderNumber: receiptProps.orderId,
      cashierName: receiptProps.cashierName,
      date: new Date().toLocaleString(),
      items: receiptProps.items.map((i: any) => ({
        name: i.productName || i.name || "Item",
        quantity: i.quantity || 1,
        unitPriceLkr: i.unitPrice || i.price || 0,
        totalLkr: (i.quantity || 1) * (i.unitPrice || i.price || 0),
        variant: i.variantName,
      })),
      subtotalLkr: receiptProps.subtotal,
      discountLkr: receiptProps.discount,
      taxLkr: 0,
      totalLkr: receiptProps.total,
      paymentMethod: receiptProps.paymentMethod,
      amountPaidLkr: receiptProps.tendered,
      changeDueLkr: receiptProps.change,
    });

    // If bridge is offline or print failed, use iframe print
    if (!silentSuccess) {
      handleBrowserPrintThermal();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col items-center p-6 text-center animate-in zoom-in-95 duration-200">
        
        {/* Animated Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4 shadow-sm animate-bounce">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>

        <h3 className="font-inter font-bold text-xl text-foreground mb-1">
          Payment Completed
        </h3>
        <p className="font-inter text-xs text-muted mb-4">
          Invoice <span className="font-mono font-bold text-foreground">#{receiptProps.orderId}</span> processed successfully
        </p>

        {/* Change Return Highlight (Sri Lankan Cash Tendering) */}
        <div className="w-full bg-background border border-border rounded-xl p-3 mb-5 text-left text-xs space-y-1.5">
          <div className="flex justify-between items-center text-muted">
            <span>Payment Method</span>
            <span className="font-semibold text-foreground uppercase">{receiptProps.paymentMethod}</span>
          </div>

          <div className="flex justify-between items-center text-muted">
            <span>Total Payable</span>
            <span className="font-mono font-bold text-foreground">
              Rs. {receiptProps.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {receiptProps.tendered !== undefined && (
            <div className="flex justify-between items-center text-muted">
              <span>Cash Tendered</span>
              <span className="font-mono font-medium text-foreground">
                Rs. {receiptProps.tendered.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {receiptProps.change !== undefined && receiptProps.change > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-bold text-emerald-600 uppercase tracking-wide">Cash Change Returned</span>
              <span className="font-mono font-black text-base text-emerald-600">
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
              onClick={handlePrintThermal}
              className="py-3 px-3 bg-surface border border-border hover:border-cyan-500 text-foreground rounded-xl font-inter font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-sm hover:bg-background"
              title="Silent hardware ESC/POS print or browser print fallback"
            >
              <Printer size={15} className="text-cyan-500" />
              Thermal (80mm)
            </button>

            <button 
              type="button"
              onClick={() => handlePrintA4Invoice()}
              className="py-3 px-3 bg-surface border border-border hover:border-primary text-foreground rounded-xl font-inter font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-sm hover:bg-background"
            >
              <FileText size={15} className="text-primary" />
              Full A4 Invoice
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

        {/* Hidden Thermal Receipt & A4 Invoice (rendered for iframe printing fallback) */}
        <div className="hidden">
          <Receipt ref={thermalRef} {...receiptProps} />
          <WorkshopInvoiceA4 ref={a4InvoiceRef} {...receiptProps} customer={orderData?.customer} />
        </div>

      </div>
    </div>
  );
}
