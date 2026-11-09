"use client";

import { CheckCircle2, Printer, Plus, FileText, Building2, Sparkles, MessageSquare, Send } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useReactToPrint } from "react-to-print";
import Receipt from "./Receipt";
import WorkshopInvoiceA4 from "./WorkshopInvoiceA4";
import { hardwareService } from "@/services/hardware.service";
import { orderService } from "@/services/order.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/store/toast.store";

export default function OrderSuccessModal({ 
  onClose, 
  orderData
}: { 
  onClose: () => void,
  orderData?: any
}) {
  const { user } = useAuthStore();
  const tenantName = orderData?.tenantName || user?.tenant?.name;
  const thermalRef = useRef<HTMLDivElement>(null);
  const a4InvoiceRef = useRef<HTMLDivElement>(null);

  const [waPhone, setWaPhone] = useState<string>(
    orderData?.customer?.phone || orderData?.phone || ""
  );
  const [showWaInput, setShowWaInput] = useState<boolean>(!orderData?.customer?.phone && !orderData?.phone);
  const [waSending, setWaSending] = useState<boolean>(false);
  const [waSent, setWaSent] = useState<boolean>(false);

  const handleSendWhatsAppReceipt = async () => {
    const orderId = orderData?.id || orderData?.orderId;
    if (!orderId) {
      toast.error("Order ID not found to send WhatsApp receipt.");
      return;
    }

    if (!waPhone.trim()) {
      setShowWaInput(true);
      toast.error("Please enter customer phone number.");
      return;
    }

    try {
      setWaSending(true);
      const res = await orderService.sendWhatsAppReceipt(orderId, waPhone.trim());
      setWaSent(true);
      toast.success(res.message || `WhatsApp receipt sent to ${waPhone}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message || "Failed to dispatch WhatsApp receipt");
    } finally {
      setWaSending(false);
    }
  };

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
    tenantName: tenantName,
    branchName: orderData?.branchName || tenantName || "Store",
    branchAddress: orderData?.branchAddress || "Colombo, Sri Lanka",
    branchPhone: orderData?.branchPhone || "+94 11 234 5678"
  };

  // Kick cash drawer automatically on cash transaction
  useEffect(() => {
    if (orderData?.paymentMethod?.toUpperCase() === "CASH") {
      hardwareService.kickCashDrawer(2);
    }
    // Update customer display to completed state
    hardwareService.updateCustomerDisplay({
      storeName: tenantName || receiptProps.branchName,
      cashier: receiptProps.cashierName,
      itemCount: receiptProps.items.length,
      subtotalLkr: receiptProps.subtotal,
      discountLkr: receiptProps.discount,
      totalLkr: receiptProps.total,
      amountPaidLkr: receiptProps.tendered,
      changeDueLkr: receiptProps.change,
      status: "COMPLETED",
    });
  }, [orderData, receiptProps, tenantName]);

  const handlePrintThermal = async () => {
    // Attempt zero-click silent hardware print via local bridge
    const silentSuccess = await hardwareService.printThermalReceipt({
      companyName: tenantName || receiptProps.branchName,
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
              <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Cash Change Returned</span>
              <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                Rs. {receiptProps.change.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* WhatsApp Digital e-Receipt Box */}
        <div className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 mb-4 flex flex-col gap-2 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-inter">
              <MessageSquare size={14} />
              <span>WhatsApp Digital e-Receipt</span>
            </div>
            {waSent ? (
              <span className="text-[11px] font-mono text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Sent
              </span>
            ) : (
              <button
                type="button"
                data-testid="toggle-wa-phone-btn"
                onClick={() => setShowWaInput(!showWaInput)}
                className="text-[10px] text-muted hover:text-foreground font-inter underline"
              >
                {showWaInput ? "Hide Phone" : "Edit Phone"}
              </button>
            )}
          </div>

          {showWaInput && !waSent && (
            <input
              type="text"
              data-testid="pos-wa-phone-input"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              placeholder="e.g. 0771234567"
              className="w-full h-8 px-2.5 rounded-lg bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          )}

          <button
            type="button"
            data-testid="send-pos-whatsapp-btn"
            onClick={handleSendWhatsAppReceipt}
            disabled={waSending || waSent}
            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-inter font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-60"
          >
            <Send size={13} className={waSending ? "animate-spin" : ""} />
            <span>
              {waSending
                ? "Dispatching..."
                : waSent
                ? `Receipt Sent to ${waPhone} ✓`
                : `Send to ${waPhone ? waPhone : "Customer"} WhatsApp`}
            </span>
          </button>
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

        {/* Offscreen Thermal Receipt & A4 Invoice (rendered for iframe printing fallback without display:none) */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-99999px",
            top: 0,
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <Receipt ref={thermalRef} {...receiptProps} />
          <WorkshopInvoiceA4 ref={a4InvoiceRef} {...receiptProps} customer={orderData?.customer} />
        </div>

      </div>
    </div>
  );
}
