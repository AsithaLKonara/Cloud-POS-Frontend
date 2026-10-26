"use client";

import React, { useRef } from "react";
import { Printer, X } from "lucide-react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";

interface BarcodePrintModalProps {
  productSku: string;
  productName: string;
  onClose: () => void;
}

export default function BarcodePrintModal({ productSku, productName, onClose }: BarcodePrintModalProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Barcode-${productSku}`,
  });

  const displaySku = productSku.length > 10 ? productSku.substring(0, 10).toUpperCase() : productSku;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      {/* Modal Container */}
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h2 className="font-inter font-bold text-lg text-foreground">Print Barcode</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center gap-6 bg-background">
          
          {/* Barcode Preview */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-border flex flex-col items-center justify-center min-w-[280px]">
             {/* The printable area */}
             <div ref={componentRef} className="flex flex-col items-center bg-white p-2" style={{ width: '100%' }}>
                <span className="font-sans font-bold text-[14px] text-black text-center leading-tight mb-1">{productName}</span>
                <Barcode 
                  value={displaySku} 
                  format="CODE128" 
                  width={1.5} 
                  height={50} 
                  displayValue={true} 
                  fontSize={14}
                  margin={5}
                />
             </div>
          </div>

        </div>

        <div className="p-4 border-t border-border bg-surface flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-surface border border-border text-foreground font-inter font-medium text-sm rounded-lg hover:bg-surface-elevated transition-colors shadow-sm">
            Cancel
          </button>
          <button onClick={() => handlePrint()} className="px-6 py-2 bg-primary text-white font-inter font-medium text-sm rounded-lg hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2">
            <Printer size={16} /> Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
