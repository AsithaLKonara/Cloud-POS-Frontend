"use client";

import React, { useState, useRef } from "react";
import { X, CheckCircle2, Trash2, Search, MinusCircle } from "lucide-react";
import { useGenerateVoucher } from "@/hooks/usePos";
import { useScanBarcode } from "@/hooks/useProducts";
import { globalDialog } from "@/store/dialog.store";
import { orderService } from "@/services/order.service";
import { useReactToPrint } from "react-to-print";

interface PosExchangeTicketProps {
  isMobileCartOpen: boolean;
  setIsMobileCartOpen: (open: boolean) => void;
  cart: any[];
  updateQty: (id: number, delta: number) => void;
  clearCart: () => void;
  branchId?: string;
}

export default function PosExchangeTicket({ isMobileCartOpen, setIsMobileCartOpen, branchId }: PosExchangeTicketProps) {
  const [returnedItems, setReturnedItems] = useState<any[]>([]);
  const [scanQuery, setScanQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [loadedOrder, setLoadedOrder] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);

  const scanBarcodeMutation = useScanBarcode();
  const generateVoucherMutation = useGenerateVoucher();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Exchange Voucher - ${voucherCode || 'LAURAL'}`,
  });

  // Order lookup: search by order number (POS-xxx, LC-xxx) via the orders list search API
  const handleOrderLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = orderQuery.trim();
    if (!q) return;
    setIsSearching(true);
    try {
      const res = await orderService.getOrders({ search: q });
      const orders = res.data?.data || [];
      if (orders.length > 0) {
        setLoadedOrder(orders[0]);
        setReturnedItems([]);
      } else {
        globalDialog.alert("Order not found. Please enter a valid Order ID (e.g. POS-1790399409010).");
      }
    } catch (error) {
      console.error(error);
      globalDialog.alert("Error searching for order. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Scan a barcode and match to a loaded order item to be returned
  const handleReturnScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadedOrder) {
      globalDialog.alert("Please lookup an order first.");
      return;
    }
    const q = scanQuery.trim();
    if (!q) return;

    try {
      const product = await scanBarcodeMutation.mutateAsync(q);
      if (product && product.variants) {
        const matchingVariant = product.variants.find((v: any) => v.sku === q || v.barcode === q);
        if (matchingVariant) {
          const orderItem = loadedOrder.items?.find((i: any) => i.variantId === matchingVariant.id);
          if (!orderItem) {
            globalDialog.alert("Item not found in this order.");
            return;
          }
          const alreadyQueued = returnedItems.filter(i => i.variantId === matchingVariant.id).length;
          const maxReturnable = orderItem.quantity;
          if (alreadyQueued >= maxReturnable) {
            globalDialog.alert(`Cannot return more than ${maxReturnable} of this item.`);
            return;
          }
          setReturnedItems(prev => [...prev, {
            id: `${matchingVariant.id}-${Date.now()}`,
            variantId: matchingVariant.id,
            name: `${product.name}${matchingVariant.color ? ` - ${matchingVariant.color}` : ''}${matchingVariant.size ? ` ${matchingVariant.size}` : ''}`.trim(),
            price: orderItem.priceAtPurchase,
            qty: 1
          }]);
          setScanQuery("");
        } else {
          globalDialog.alert("Barcode matched a product but no matching variant SKU found.");
        }
      } else {
        globalDialog.alert("Product not found for this barcode.");
      }
    } catch (err) {
      console.error(err);
      globalDialog.alert("Product not found or invalid barcode.");
    }
  };

  const removeReturnedItem = (id: string) => {
    setReturnedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClickItemToReturn = (orderItem: any) => {
    const alreadyQueued = returnedItems.filter(i => i.variantId === orderItem.variantId).length;
    const maxReturnable = orderItem.quantity;
    
    if (alreadyQueued >= maxReturnable) {
      globalDialog.alert(`Cannot return more than ${maxReturnable} of this item.`);
      return;
    }
    
    const variantName = orderItem.variant?.product?.name || orderItem.variant?.name || 'Product';
    const color = orderItem.variant?.color ? ` - ${orderItem.variant.color}` : '';
    const size = orderItem.variant?.size ? ` ${orderItem.variant.size}` : '';

    setReturnedItems(prev => [...prev, {
      id: `${orderItem.variantId}-${Date.now()}`,
      variantId: orderItem.variantId,
      name: `${variantName}${color}${size}`.trim(),
      price: orderItem.priceAtPurchase,
      qty: 1
    }]);
  };

  const returnTotal = returnedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handleProcess = async () => {
    if (!loadedOrder) { globalDialog.alert("Please load an order first."); return; }
    if (returnedItems.length === 0) { globalDialog.alert("Please scan at least one item to return."); return; }
    if (!branchId) { globalDialog.alert("No branch found. Please ensure a shift is open."); return; }

    setIsProcessing(true);
    try {
      const result = await generateVoucherMutation.mutateAsync({
        branchId,
        returnedItems: returnedItems.map(i => ({ variantId: i.variantId, qty: i.qty })),
        value: returnTotal,
        orderId: loadedOrder.id
      });
      setVoucherCode(result.code);
      setSuccess(true);
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.error;
      globalDialog.alert(typeof msg === "string" ? msg : (msg?.message || "Failed to generate voucher."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSuccess(false); setReturnedItems([]); setVoucherCode(null);
    setOrderQuery(""); setLoadedOrder(null);
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background overflow-hidden p-8">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="font-inter font-bold text-2xl text-foreground mb-2">Exchange Voucher Issued!</h2>
          <p className="font-inter text-muted mb-6 text-sm">
            Exchange voucher for Rs. {returnTotal.toLocaleString()} has been generated. Inventory restocked.
          </p>
          <div className="bg-white border-2 border-dashed border-stone-300 p-6 rounded-xl flex flex-col items-center gap-2 mb-8 shadow-sm w-full">
            <p className="text-sm font-bold tracking-widest text-stone-500 uppercase">Voucher Code</p>
            <p className="font-mono text-2xl font-bold tracking-widest break-all text-foreground">{voucherCode}</p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={() => handlePrint()} className="flex-1 py-3 bg-surface border border-border text-foreground font-inter font-bold rounded-xl hover:bg-background transition-colors shadow-sm">
              Print Voucher
            </button>
            <button onClick={handleReset} className="flex-1 py-3 bg-primary text-white rounded-xl font-inter font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
              New Exchange
            </button>
          </div>
        </div>

        {/* Hidden printable receipt for react-to-print */}
        <div className="hidden print:block">
          <div ref={printRef} style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px', color: '#000', background: '#fff', width: '280px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <img src="/logo.png" alt="LAURAL" style={{ height: '24px', objectFit: 'contain', filter: 'grayscale(100%) brightness(0)', margin: '0 auto 4px auto' }} />
              <p style={{ fontSize: '12px', color: '#555' }}>EXCHANGE VOUCHER</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Date:</span><span>{new Date().toLocaleDateString()}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><span>Order:</span><span>{loadedOrder?.orderNumber || '-'}</span></div>
            <hr style={{ borderStyle: 'dashed', borderColor: '#000', margin: '8px 0' }} />
            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', color: '#555' }}>VOUCHER CODE</p>
              <p style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '4px', marginTop: '4px' }}>{voucherCode}</p>
            </div>
            <hr style={{ borderStyle: 'dashed', borderColor: '#000', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', margin: '8px 0' }}>
              <span>VOUCHER VALUE:</span><span>Rs. {returnTotal.toFixed(2)}</span>
            </div>
            <hr style={{ borderStyle: 'dashed', borderColor: '#000', margin: '8px 0' }} />
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#555' }}>
              <p>Scan this code at checkout to redeem.</p>
              <p>Valid at all LAURAL branches.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main 2-column layout ───────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">

      {/* 2-Column Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Find Order */}
        <div className="flex-1 flex flex-col bg-surface border-r border-border overflow-hidden">
          <div className="p-6 border-b border-border bg-background shrink-0">
            <h2 className="font-inter font-bold text-xl text-foreground mb-1">Find Order</h2>
            <p className="font-inter text-sm text-muted">Enter the original order number to look up items</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {/* Search form */}
            <form onSubmit={handleOrderLookup} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  placeholder="e.g. POS-1790399409010"
                  autoFocus
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-3 py-3 text-base font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-3 bg-primary text-white rounded-xl font-inter font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isSearching ? "..." : "Search"}
              </button>
            </form>

            {/* Loaded order card */}
            {loadedOrder ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-4">
                <div>
                  <p className="font-inter font-bold text-lg text-emerald-900">Order #{loadedOrder.orderNumber}</p>
                  <p className="font-inter text-sm text-emerald-700 mt-0.5">
                    {new Date(loadedOrder.createdAt).toLocaleDateString()} &bull; {loadedOrder.customer?.firstName || 'Guest'}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-inter text-xs font-bold text-emerald-800 uppercase tracking-wider">Items in this order:</p>
                  {loadedOrder.items?.map((item: any) => {
                    const queuedCount = returnedItems.filter(i => i.variantId === item.variantId).length;
                    const maxQty = item.quantity;
                    const isMaxed = queuedCount >= maxQty;

                    return (
                      <div 
                        key={item.id} 
                        onClick={() => !isMaxed && handleClickItemToReturn(item)}
                        className={`flex justify-between items-center p-3 bg-white border rounded-lg text-sm transition-colors ${isMaxed ? 'border-emerald-100 opacity-50 cursor-not-allowed' : 'border-emerald-200 hover:border-emerald-400 hover:shadow-sm cursor-pointer'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-inter font-semibold text-foreground truncate">{item.variant?.product?.name || item.variant?.name || 'Product'}</p>
                          <p className="font-inter text-xs text-muted mt-0.5">
                            SKU: {item.variant?.sku} &bull; Qty: {maxQty} 
                            {queuedCount > 0 && (
                              <span className="text-emerald-600 font-bold ml-2 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {queuedCount}/{maxQty} queued
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <span className="font-inter font-bold text-foreground block">Rs. {item.priceAtPurchase?.toLocaleString()}</span>
                          {!isMaxed && <span className="text-xs font-bold text-emerald-600 mt-1 inline-block">Click to Return +</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 pt-16">
                <Search size={56} className="text-muted mb-4" />
                <p className="font-inter text-muted font-medium text-center">Search for an order to begin the exchange</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Scan Items to Return */}
        <div className={`flex-1 flex flex-col bg-surface overflow-hidden transition-opacity ${!loadedOrder ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="p-6 border-b border-border bg-background shrink-0">
            <h2 className="font-inter font-bold text-xl text-foreground mb-1 flex items-center gap-2">
              <MinusCircle size={20} className="text-red-500" /> Scan Items to Return
            </h2>
            <p className="font-inter text-sm text-muted">Scan each item barcode or enter SKU to add it to the return list</p>
          </div>

          <div className="p-6 border-b border-border bg-background shrink-0">
            <form onSubmit={handleReturnScan} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={scanQuery}
                  onChange={(e) => setScanQuery(e.target.value)}
                  placeholder="Scan barcode or enter SKU..."
                  className="w-full bg-background border border-red-200 rounded-xl pl-10 pr-3 py-3 text-base font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <button type="submit" className="px-5 py-3 bg-red-600 text-white rounded-xl font-inter font-semibold hover:bg-red-700 transition-colors">
                Add
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
            {returnedItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 pt-12">
                <MinusCircle size={48} className="text-muted mb-4" />
                <p className="font-inter text-muted text-center">No items scanned yet</p>
              </div>
            ) : (
              returnedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-red-100 rounded-xl shadow-sm">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-inter font-bold text-foreground truncate">{item.name}</p>
                    <p className="font-inter text-sm text-red-600 font-semibold mt-0.5">Rs. {item.price.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => removeReturnedItem(item.id)}
                    className="p-2 text-muted hover:text-error hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR: Voucher Value + Generate Button */}
      <div className="shrink-0 border-t border-border bg-surface px-6 py-4 flex items-center gap-6">
        <div className="flex items-baseline gap-2">
          <span className="font-inter text-sm text-muted font-medium">Voucher Value</span>
          <span className="font-inter text-sm font-bold text-muted">Rs.</span>
          <span className="font-inter text-3xl font-bold tracking-tight text-primary">{returnTotal.toLocaleString()}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-sm text-muted font-inter">
          <span>{returnedItems.length} item{returnedItems.length !== 1 ? 's' : ''} selected</span>
        </div>
        <button
          onClick={handleProcess}
          disabled={isProcessing || returnedItems.length === 0 || !loadedOrder}
          className="px-8 py-3 text-white rounded-xl transition-all font-inter font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:bg-stone-300 bg-primary hover:bg-primary-hover hover:-translate-y-0.5 shadow-primary/20"
        >
          {isProcessing ? "Generating..." : "Generate Voucher →"}
        </button>
      </div>
    </div>
  );
}
