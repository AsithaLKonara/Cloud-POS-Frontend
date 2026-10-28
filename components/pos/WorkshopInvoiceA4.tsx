"use client";

import { forwardRef } from "react";

export interface WorkshopInvoiceProps {
  orderId: string;
  orderNumber?: string;
  cashierName?: string;
  date: Date;
  items: any[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  tenantName?: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  customer?: {
    name?: string;
    companyName?: string;
    phone?: string;
    vehicleNumber?: string;
    customerType?: string;
  };
}

const WorkshopInvoiceA4 = forwardRef<HTMLDivElement, WorkshopInvoiceProps>((props, ref) => {
  const { 
    orderId, 
    orderNumber, 
    cashierName, 
    date, 
    items, 
    subtotal, 
    discount, 
    total, 
    paymentMethod, 
    tenantName,
    branchName, 
    branchAddress, 
    branchPhone,
    customer
  } = props;

  const invoiceNo = orderNumber || orderId;
  const isCredit = paymentMethod === 'CREDIT_ACCOUNT' || paymentMethod === 'GARAGE_CREDIT';
  const customerTitle = customer?.companyName || customer?.name || "Counter Customer";

  return (
    <div 
      ref={ref} 
      className="w-[210mm] min-h-[297mm] bg-white text-stone-900 p-12 font-sans text-xs leading-normal mx-auto box-border"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-stone-900 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 uppercase">
            {tenantName || branchName || "STORE"}
          </h1>
          {branchName && tenantName && branchName !== tenantName && (
            <p className="text-sm font-bold text-stone-800 mt-0.5">{branchName}</p>
          )}
          <p className="text-xs text-stone-600 mt-1">Enterprise Retail, Wholesale & Commercial Supplies</p>
          <p className="text-xs text-stone-500">{branchAddress || "Central Distribution Hub"}</p>
          <p className="text-xs text-stone-500">Hotline: {branchPhone || "+94 11 234 5678"}</p>
        </div>
        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-stone-900 text-white font-bold text-sm tracking-wider uppercase rounded mb-2">
            {isCredit ? "WORKSHOP CREDIT INVOICE" : "COMMERCIAL TAX INVOICE"}
          </div>
          <p className="text-xs font-mono font-bold text-stone-800">Invoice #: {invoiceNo}</p>
          <p className="text-xs text-stone-500">Date: {new Date(date).toLocaleDateString()}</p>
          <p className="text-xs text-stone-500">Issued by: {cashierName || "Store POS"}</p>
        </div>
      </div>

      {/* Bill To Info */}
      <div className="grid grid-cols-2 gap-8 bg-stone-50 border border-stone-200 rounded-xl p-5 mb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Billed To (Customer / Workshop)</span>
          <h3 className="font-bold text-base text-stone-900">{customerTitle}</h3>
          {customer?.customerType && (
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-800 mt-1">
              {customer.customerType}
            </span>
          )}
          <p className="text-xs text-stone-600 mt-1.5">Phone: {customer?.phone || "N/A"}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">Vehicle & Billing Terms</span>
          <p className="font-mono font-bold text-sm text-stone-800">
            Vehicle Plate #: {customer?.vehicleNumber || "Counter Direct Sale"}
          </p>
          <p className="text-xs text-stone-600 mt-1">
            Payment Terms: {isCredit ? "On Approved Credit (30 Days)" : paymentMethod}
          </p>
          <p className="text-xs font-semibold text-stone-800 mt-1">
            Status: {isCredit ? "CHARGED TO ACCOUNT LEDGER (UNPAID)" : "PAID IN FULL"}
          </p>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full text-left text-xs mb-6 border-collapse">
        <thead>
          <tr className="bg-stone-900 text-white font-bold uppercase tracking-wider text-[11px]">
            <th className="py-2.5 px-3 rounded-l">Item Description</th>
            <th className="py-2.5 px-3">Grade / Part #</th>
            <th className="py-2.5 px-3">Pack Unit</th>
            <th className="py-2.5 px-3 text-center">Qty / Liters</th>
            <th className="py-2.5 px-3 text-right">Unit Price</th>
            <th className="py-2.5 px-3 text-right rounded-r">Amount (Rs.)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {items.map((item, idx) => {
            const packOrVolume = item.packUnit || item.size || (item.dispensedVolumeLiters ? `${item.dispensedVolumeLiters}L Loose` : 'Standard');
            const spec = item.viscosity || item.partNumber || item.color || 'Standard';

            return (
              <tr key={idx} className="hover:bg-stone-50">
                <td className="py-3 px-3 font-semibold text-stone-900">
                  {item.name}
                  {item.brand && <span className="block text-[10px] text-stone-500 font-normal">Brand: {item.brand}</span>}
                </td>
                <td className="py-3 px-3 font-mono text-stone-700">{spec}</td>
                <td className="py-3 px-3 font-medium text-stone-600">{packOrVolume}</td>
                <td className="py-3 px-3 text-center font-bold text-stone-900">
                  {item.dispensedVolumeLiters ? `${item.dispensedVolumeLiters} L` : item.qty}
                </td>
                <td className="py-3 px-3 text-right font-mono text-stone-700">
                  Rs. {item.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                  Rs. {(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals Summary */}
      <div className="flex justify-end mb-12">
        <div className="w-72 bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between text-xs text-stone-600">
            <span>Subtotal:</span>
            <span className="font-mono">Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-700">
              <span>Discount / Promo:</span>
              <span className="font-mono">-Rs. {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="border-t border-stone-300 pt-2 flex justify-between font-bold text-sm text-stone-900">
            <span>Total Payable:</span>
            <span className="font-mono font-black text-base text-stone-950">
              Rs. {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          {isCredit && (
            <div className="mt-1 p-2 bg-amber-100 text-amber-900 rounded text-[10px] font-semibold text-center">
              Added to Workshop Account Balance
            </div>
          )}
        </div>
      </div>

      {/* Signatures & Declarations */}
      <div className="grid grid-cols-2 gap-16 pt-12 border-t border-stone-200 text-xs">
        <div>
          <p className="font-bold text-stone-800 mb-8">Goods Received In Good Condition By:</p>
          <div className="border-t border-dashed border-stone-400 pt-1 text-stone-500">
            Customer / Driver Signature & Vehicle Reg #
          </div>
        </div>
        <div>
          <p className="font-bold text-stone-800 mb-8">For {branchName || "XONIT POS"}:</p>
          <div className="border-t border-dashed border-stone-400 pt-1 text-stone-500">
            Authorized Store Officer Signature & Stamp
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-stone-400 mt-16 pt-4 border-t border-stone-100">
        Thank you for your business. Quality guaranteed. Powered by XONIT POS Enterprise.
      </div>
    </div>
  );
});

WorkshopInvoiceA4.displayName = "WorkshopInvoiceA4";

export default WorkshopInvoiceA4;
