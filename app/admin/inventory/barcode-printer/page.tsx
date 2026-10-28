"use client";

import React, { useState, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Printer, Search, Plus, Minus, FileText } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/store/auth.store";

export default function BarcodePrinterClient() {
  const { user } = useAuthStore();
  const tenantName = user?.tenant?.name;
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: productsData, isLoading } = useProducts({
    search: debouncedSearchTerm,
    take: 10
  });

  const products = productsData?.data || [];

  const [printList, setPrintList] = useState<{sku: string, name: string, price: number, qty: number}[]>([]);

  const addToPrintList = (variant: any, product: any) => {
    setPrintList(prev => {
      const exists = prev.find(item => item.sku === variant.sku);
      if (exists) {
        return prev.map(item => item.sku === variant.sku ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { sku: variant.sku, name: `${product.name} - ${variant.color || ''} ${variant.size || ''}`, price: variant.price, qty: 1 }];
    });
  };

  const updateQty = (sku: string, delta: number) => {
    setPrintList(prev => prev.map(item => {
      if (item.sku === sku) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate flat array of labels to print
  const labelsToPrint = printList.flatMap(item => Array(item.qty).fill(item));

  return (
    <div className="flex flex-col h-full bg-background relative print:bg-white print:m-0 print:p-0">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .barcode-print-zone, .barcode-print-zone * {
            visibility: visible;
          }
          .barcode-print-zone {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            display: grid;
            grid-template-columns: repeat(auto-fill, 50mm);
            gap: 2mm;
            justify-content: start;
            align-content: start;
          }
          .barcode-label {
            width: 50mm;
            height: 30mm;
            padding: 2mm;
            border: 1px solid #000; /* Usually disabled for real thermal, keeping for preview */
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            page-break-inside: avoid;
            box-sizing: border-box;
            background: white;
          }
          @page {
            size: 50mm 30mm;
            margin: 0;
          }
        }
      `}} />

      {/* NO-PRINT UI */}
      <div className="print:hidden flex flex-col h-full max-w-6xl mx-auto w-full p-6 gap-6">
        <div className="flex justify-between items-center bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold font-inter text-foreground">Barcode Printer</h1>
            <p className="text-sm text-muted font-inter mt-1">Generate and print standard 50x30mm thermal barcodes</p>
          </div>
          <button 
            onClick={handlePrint}
            disabled={labelsToPrint.length === 0}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold font-inter hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            <Printer size={20} /> Print {labelsToPrint.length} Labels
          </button>
        </div>

        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left: Search & Select */}
          <div className="flex-1 bg-surface border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-surface-elevated">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search products..." 
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border text-foreground rounded-xl font-inter focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading && <div className="p-4 text-center text-muted font-inter">Searching...</div>}
              {products.map((product: any) => (
                <div key={product.id} className="mb-4">
                  <h3 className="font-bold text-sm text-foreground px-3 py-2 bg-surface-elevated rounded-lg">{product.name}</h3>
                  <div className="pl-4 pr-2 mt-2 flex flex-col gap-2">
                    {product.variants.map((v: any) => (
                      <div key={v.id} className="flex justify-between items-center p-3 border border-border rounded-xl bg-surface hover:border-primary transition-colors">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">{v.sku}</span>
                          <span className="text-xs text-muted">{v.color} - {v.size} - Rs. {v.price}</span>
                        </div>
                        <button 
                          onClick={() => addToPrintList(v, product)}
                          className="w-8 h-8 flex items-center justify-center bg-surface-elevated text-foreground hover:bg-primary hover:text-white rounded-lg transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Print List */}
          <div className="w-[400px] bg-surface border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-stone-50 font-bold font-inter text-foreground flex items-center gap-2">
              <FileText size={18} /> Print Queue
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {printList.length === 0 && (
                <div className="text-center text-muted text-sm font-inter mt-10">Queue is empty.</div>
              )}
              {printList.map(item => (
                <div key={item.sku} className="p-3 border border-border rounded-xl bg-white flex flex-col gap-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground truncate" title={item.name}>{item.name}</span>
                    <span className="text-xs text-muted">{item.sku}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-sm">Rs. {item.price}</span>
                    <div className="flex items-center border border-border rounded-lg bg-stone-50 overflow-hidden">
                      <button onClick={() => updateQty(item.sku, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-stone-200 text-muted"><Minus size={14}/></button>
                      <span className="w-10 text-center font-bold text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.sku, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-stone-200 text-muted"><Plus size={14}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PRINT ZONE */}
      <div className="barcode-print-zone hidden print:grid">
        {labelsToPrint.map((item, i) => (
          <div key={`${item.sku}-${i}`} className="barcode-label">
            <div className="text-[10px] font-bold text-black truncate w-full text-center leading-tight">{tenantName || 'Store'} - {item.name.substring(0, 20)}</div>
            
            {/* Pseudo-barcode */}
            <div className="flex-1 w-full flex flex-col items-center justify-center py-1">
              <div className="flex h-[15mm] w-[40mm] bg-black relative">
                {/* Visual lines pattern */}
                <div className="absolute inset-0 flex justify-between px-1">
                  <div className="w-1 h-full bg-white"></div>
                  <div className="w-2 h-full bg-white"></div>
                  <div className="w-[1.5px] h-full bg-white"></div>
                  <div className="w-3 h-full bg-white"></div>
                  <div className="w-1 h-full bg-white"></div>
                  <div className="w-2 h-full bg-white"></div>
                  <div className="w-1 h-full bg-white"></div>
                  <div className="w-1 h-full bg-white"></div>
                  <div className="w-3 h-full bg-white"></div>
                  <div className="w-[1.5px] h-full bg-white"></div>
                  <div className="w-2 h-full bg-white"></div>
                  <div className="w-1 h-full bg-white"></div>
                  <div className="w-2 h-full bg-white"></div>
                  <div className="w-1 h-full bg-white"></div>
                  <div className="w-1 h-full bg-white"></div>
                  <div className="w-[2.5px] h-full bg-white"></div>
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-widest mt-0.5">{item.sku}</div>
            </div>

            <div className="text-[11px] font-bold text-black w-full text-center">Rs. {item.price.toFixed(2)}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
