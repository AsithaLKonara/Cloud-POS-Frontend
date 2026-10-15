"use client";

import { forwardRef } from "react";

export interface ZReportProps {
  session: {
    id: string;
    openedAt: string;
    closedAt?: string;
    openingFloat: number;
    terminal?: { name: string };
    branch?: { name: string; address?: string; phone?: string };
    user?: { name?: string; firstName?: string; lastName?: string };
    userId?: string;
    actualClosing?: number;
    expectedClosing?: number;
    variance?: number;
    closingNotes?: string;
    totalCashSales?: number;
    totalCardSales?: number;
    totalCreditSales?: number;
  };
  summary?: {
    totalSales: number;
    totalReturns: number;
    netTotal: number;
    paymentMethods: Record<string, number>;
  };
}

const ZReportSlip = forwardRef<HTMLDivElement, ZReportProps>((props, ref) => {
  const { session, summary } = props;

  const branchName = session.branch?.name || "OIL RETAIL STORE";
  const branchPhone = session.branch?.phone || "";
  const terminalName = session.terminal?.name || "Register Terminal";
  const cashierName = session.user?.name || `${session.user?.firstName || ''} ${session.user?.lastName || ''}`.trim() || session.userId || "Cashier";

  const openingFloat = session.openingFloat || 0;
  const actualClosing = session.actualClosing || 0;
  const expectedClosing = session.expectedClosing || (openingFloat + (session.totalCashSales || 0));
  const variance = session.variance !== undefined && session.variance !== null 
    ? session.variance 
    : (actualClosing - expectedClosing);

  const totalCash = session.totalCashSales ?? (summary?.paymentMethods?.['Cash'] || summary?.paymentMethods?.['CASH'] || 0);
  const totalCard = session.totalCardSales ?? (summary?.paymentMethods?.['Card'] || summary?.paymentMethods?.['CARD'] || 0);
  const totalCredit = session.totalCreditSales ?? (summary?.paymentMethods?.['CREDIT_ACCOUNT'] || summary?.paymentMethods?.['GARAGE_CREDIT'] || 0);
  const netSales = (summary?.netTotal) || (totalCash + totalCard + totalCredit);

  return (
    <div 
      ref={ref} 
      className="w-[80mm] bg-white text-black p-4 font-mono text-xs leading-tight mx-auto"
      style={{ fontFamily: 'Courier New, Courier, monospace', color: '#000000', backgroundColor: '#ffffff' }}
    >
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-1 mb-3">
        <h1 className="font-bold text-base uppercase tracking-wider">{branchName}</h1>
        {branchPhone && <span className="text-[10px]">Tel: {branchPhone}</span>}
        <div className="border-t border-b border-black py-1 my-1 w-full text-center">
          <span className="font-bold text-sm tracking-widest">DAY-END SHIFT Z-REPORT</span>
        </div>
        <span className="text-[10px]">Session Ref: {session.id.substring(0, 16)}</span>
      </div>

      {/* Register Info */}
      <div className="flex flex-col gap-1 text-[11px] mb-2 border-b border-dashed border-black pb-2">
        <div className="flex justify-between">
          <span>Terminal:</span>
          <span className="font-bold">{terminalName}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span className="font-bold">{cashierName}</span>
        </div>
        <div className="flex justify-between">
          <span>Shift Opened:</span>
          <span>{new Date(session.openedAt).toLocaleString()}</span>
        </div>
        {session.closedAt && (
          <div className="flex justify-between">
            <span>Shift Closed:</span>
            <span>{new Date(session.closedAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Sales Summary Breakdown */}
      <div className="text-center font-bold text-xs uppercase mb-1.5 tracking-wider">Tender Breakdown</div>
      <div className="flex flex-col gap-1 text-[11px] border-b border-dashed border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span>Cash Sales:</span>
          <span>Rs. {totalCash.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Card / Terminal:</span>
          <span>Rs. {totalCard.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Workshop Account Credit:</span>
          <span>Rs. {totalCredit.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-dotted border-black pt-1 mt-0.5 text-xs">
          <span>TOTAL GROSS SALES:</span>
          <span>Rs. {netSales.toFixed(2)}</span>
        </div>
      </div>

      {/* Cash Drawer Reconciliation */}
      <div className="text-center font-bold text-xs uppercase mb-1.5 tracking-wider">Cash Drawer Balancing</div>
      <div className="flex flex-col gap-1 text-[11px] border-b border-dashed border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span>(+) Opening Cash Float:</span>
          <span>Rs. {openingFloat.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>(+) Cash Sales Received:</span>
          <span>Rs. {totalCash.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-dotted border-black pt-1">
          <span>(=) Expected Cash In Drawer:</span>
          <span>Rs. {expectedClosing.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>(★) Actual Counted Cash:</span>
          <span>Rs. {actualClosing.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-xs border-t border-black pt-1 mt-0.5">
          <span>VARIANCE (OVER / SHORT):</span>
          <span>
            {variance === 0 
              ? "BALANCED (0.00)" 
              : variance > 0 
                ? `+ OVER Rs. ${variance.toFixed(2)}` 
                : `- SHORT Rs. ${Math.abs(variance).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Closing Notes */}
      {session.closingNotes && (
        <div className="text-[10px] mb-3 border-b border-dashed border-black pb-2">
          <span className="font-bold">Shift Notes:</span> {session.closingNotes}
        </div>
      )}

      {/* Signatures */}
      <div className="flex justify-between pt-6 text-[10px]">
        <div className="flex flex-col items-center">
          <span className="border-t border-black w-24 mb-1"></span>
          <span>Cashier Signature</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="border-t border-black w-24 mb-1"></span>
          <span>Manager Verified</span>
        </div>
      </div>

      <div className="text-center text-[9px] text-stone-600 mt-4">
        Printed on {new Date().toLocaleString()}
      </div>
    </div>
  );
});

ZReportSlip.displayName = "ZReportSlip";

export default ZReportSlip;
