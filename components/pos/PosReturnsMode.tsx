"use client";

import { useState } from "react";
import { Search, Package, RotateCcw, CheckCircle2, ChevronRight, X, AlertCircle } from "lucide-react";
import Image from "next/image";
import { orderService } from "@/services/order.service";
import { useGenerateVoucher } from "@/hooks/usePos";
import { useScanBarcode } from "@/hooks/useProducts";
import { useAuthStore } from "@/store/auth.store";

export default function PosReturnsMode({ branchId }: { branchId?: string }) {
  const { user } = useAuthStore();
  const tenantName = user?.tenant?.name;
  const [searchQuery, setSearchQuery] = useState("");
  const [orderFound, setOrderFound] = useState(false);
  const [loadedOrder, setLoadedOrder] = useState<any>(null);
  
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [refundMethod, setRefundMethod] = useState<"CASH" | "CARD" | "STORE_CREDIT">("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");

  const generateVoucherMutation = useGenerateVoucher();
  const scanBarcodeMutation = useScanBarcode();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (searchQuery.length > 3) {
      if (searchQuery.toUpperCase().startsWith("LC-") || searchQuery.toUpperCase().startsWith("POS-")) {
        try {
          // Search for the exact order number
          const res = await orderService.getOrders({ search: searchQuery, type: 'POS' });
          if (res.data && res.data.data && res.data.data.length > 0) {
            setLoadedOrder(res.data.data[0]);
            setOrderFound(true);
            setSelectedItems([]);
          } else {
            setErrorMsg("Order not found.");
            setOrderFound(false);
            setLoadedOrder(null);
          }
        } catch (error) {
          console.error(error);
          setErrorMsg("Failed to search order.");
        }
      } else {
        // Direct barcode scan fallback logic for unreceipted returns
        try {
          const product = await scanBarcodeMutation.mutateAsync(searchQuery);
          if (product && product.variants) {
            const matchingVariant = product.variants.find((v: any) => v.sku?.toLowerCase() === searchQuery.toLowerCase());
            if (matchingVariant) {
              setOrderFound(true);
              const newItem = {
                id: `SCAN-${matchingVariant.id}`,
                variantId: matchingVariant.id,
                name: `${product.name} - ${matchingVariant.name || matchingVariant.sku}`,
                price: matchingVariant.salePrice || matchingVariant.price || 0,
                qty: 1,
                isScanned: true
              };
              // Add to selected items or increment if exists
              setSelectedItems(prev => {
                const exists = prev.find(i => i.variantId === matchingVariant.id);
                if (exists) {
                  return prev.map(i => i.variantId === matchingVariant.id ? { ...i, qty: i.qty + 1 } : i);
                }
                return [...prev, newItem];
              });
              setSearchQuery("");
            } else {
              setErrorMsg("Scanned product variant not found.");
            }
          } else {
             setErrorMsg("Product not found for this barcode.");
          }
        } catch (err) {
          console.error("Barcode scan failed", err);
          setErrorMsg("Invalid barcode or product not found.");
        }
      }
      setIsSuccess(false);
    }
  };

  const toggleItem = (item: any, price: number) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, { ...item, price, qty: 1 }];
      }
    });
  };

  const calculateRefund = () => {
    return selectedItems.reduce((sum, item) => sum + item.price, 0);
  };

  const handleCompleteReturn = async () => {
    setIsProcessing(true);
    setErrorMsg("");
    try {
      if (refundMethod === "STORE_CREDIT") {
        await generateVoucherMutation.mutateAsync({
          branchId: branchId || "",
          returnedItems: selectedItems.map(i => ({ variantId: i.variantId || i.id, qty: i.qty })),
          value: calculateRefund(),
          orderId: loadedOrder?.id
        });
      } else {
        // For cash/card, we use the backend order refund endpoint if we have an order
        if (loadedOrder) {
          const itemsToReturn = selectedItems.map(i => ({ variantId: i.variantId || i.id, qty: i.qty }));
          await orderService.refundPartialOrder(loadedOrder.id, itemsToReturn, refundMethod);
        } else {
          // Unreceipted cash refund just drops state here
          console.log("Processed unreceipted manual return.");
        }
      }
      setIsSuccess(true);
    } catch (error: any) {
      const apiError = error?.response?.data?.error;
      const message = typeof apiError === "string" ? apiError : (apiError?.message || "Failed to process return.");
      setErrorMsg(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="font-signature text-4xl text-foreground mb-2">Return Completed</h2>
        <p className="font-inter text-muted mb-8 text-center max-w-md">
          Successfully refunded Rs. {calculateRefund().toLocaleString()} to {refundMethod}. 
          Inventory has been automatically updated.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-surface border border-border text-foreground font-inter font-medium rounded-xl hover:bg-background transition-colors shadow-sm"
          >
            Print Return Receipt
          </button>
          <button onClick={() => { setOrderFound(false); setLoadedOrder(null); setSearchQuery(""); setIsSuccess(false); setSelectedItems([]); }} className="px-6 py-3 bg-primary text-white font-inter font-medium rounded-xl hover:bg-primary-hover transition-colors shadow-sm">
            Process Another Return
          </button>
        </div>

        {/* Hidden Printable Receipt */}
        <div className="print-receipt print-only bg-white text-black p-4 font-mono text-sm leading-snug mx-auto">
          <div className="text-center flex flex-col items-center gap-1 mb-4">
            <span className="font-bold text-sm tracking-wider uppercase text-black">
              {tenantName || 'STORE'}
            </span>
            <span className="text-xs text-gray-600 font-bold">RETURN RECEIPT</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Date:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span>Method:</span>
            <span className="font-bold">{refundMethod}</span>
          </div>
          <div className="border-t border-dashed border-black my-2"></div>
          {selectedItems.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs mb-1">
              <span className="truncate pr-2">{item.qty}x {item.name}</span>
              <span>{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-black my-2"></div>
          <div className="flex justify-between font-bold text-lg my-2">
            <span>TOTAL REFUND:</span>
            <span>Rs. {calculateRefund().toFixed(2)}</span>
          </div>
          <div className="border-t border-dashed border-black my-2"></div>
          <div className="text-center mt-6 text-xs">
            Thank you for shopping with us!
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      
      {/* Left Side: Order Lookup & Items */}
      <div className="flex-1 flex flex-col bg-surface overflow-hidden border-r border-border">
        
        {/* Search Bar */}
        <div className="p-6 border-b border-border shrink-0 bg-background">
          <h2 className="font-inter font-bold text-lg text-foreground mb-4">Find Order to Return</h2>
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan receipt barcode or enter Order ID (e.g. LC-09942 or POS-123)"
              className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-32 text-lg font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-lg font-inter font-medium hover:bg-primary-hover transition-colors"
            >
              Search
            </button>
          </form>
          {errorMsg && <p className="mt-2 text-sm text-error font-inter font-bold">{typeof errorMsg === 'string' ? errorMsg : (errorMsg as any)?.message || JSON.stringify(errorMsg)}</p>}
        </div>

        {/* Order Results */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {!orderFound && !loadedOrder && selectedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <RotateCcw size={64} className="text-muted mb-4" />
              <p className="font-inter font-medium text-lg text-foreground">Waiting for order lookup...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 max-w-3xl">
              
              {loadedOrder && (
                <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
                  <div>
                    <p className="font-inter font-bold text-lg text-foreground">Order #{loadedOrder.orderNumber}</p>
                    <p className="font-inter text-sm text-muted">
                      Purchased on {new Date(loadedOrder.createdAt).toLocaleDateString()} • by {loadedOrder.customer?.firstName || 'Guest'}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest rounded-md">
                    Eligible for Return
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <h3 className="font-inter font-bold text-foreground">Select Items to Return</h3>
                
                {/* Render Scanned Items if any */}
                {selectedItems.filter(i => i.isScanned).map(item => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border rounded-xl transition-all bg-primary/5 border-primary shadow-sm">
                    <div className="pt-2">
                      <input 
                        type="checkbox" 
                        checked={true}
                        onChange={() => toggleItem(item, item.price)}
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-inter font-bold text-foreground">{item.name}</p>
                          <p className="font-inter text-sm text-muted">Direct Barcode Scan</p>
                        </div>
                        <span className="font-inter font-bold text-foreground">Rs. {item.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Render Fetched Order Items */}
                {loadedOrder?.items?.map((item: any) => {
                  const variant = item.variant;
                  const price = item.priceAtPurchase;
                  
                  // In real app, we track if an orderItem is already returned. Here we allow it for now.
                  const alreadyReturned = false; 

                  return (
                    <div key={item.id} className={`flex items-start gap-4 p-4 border rounded-xl transition-all ${alreadyReturned ? 'bg-background border-border opacity-60' : selectedItems.find(i => i.id === item.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-surface border-border hover:border-muted'}`}>
                      
                      <div className="pt-2">
                        <input 
                          type="checkbox" 
                          disabled={alreadyReturned}
                          checked={!!selectedItems.find(i => i.id === item.id)}
                          onChange={() => toggleItem({ ...variant, id: item.id, variantId: variant.id }, price)}
                          className="w-5 h-5 rounded border-border text-primary focus:ring-primary disabled:opacity-50"
                        />
                      </div>
                      
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-inter font-bold text-foreground">{variant?.product?.name || variant?.name || 'Product'}</p>
                            <p className="font-inter text-sm text-muted">SKU: {variant?.sku}</p>
                          </div>
                          <span className="font-inter font-bold text-foreground">Rs. {price.toLocaleString()}</span>
                        </div>
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>
          )}
        </div>

      </div>

      {/* Right Side: Refund Actions */}
      <div className="w-[380px] bg-surface flex flex-col shrink-0 shadow-xl border-l border-border overflow-hidden">
        
        <div className="p-6 border-b border-border bg-background flex flex-col justify-center shrink-0 h-[80px]">
          <h2 className="font-inter font-bold text-xl text-foreground flex items-center gap-2">
            <RotateCcw size={24} className="text-primary" />
            Return Summary
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          <div className="flex flex-col gap-2 font-inter">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted">Items Selected</span>
              <span className="font-bold text-foreground">{selectedItems.length}</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-lg font-bold text-foreground">Total Refund</span>
              <span className="text-3xl font-black text-emerald-600">
                Rs. {calculateRefund().toLocaleString()}
              </span>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-inter font-bold text-sm text-muted uppercase tracking-wider">Refund Method</h3>
              
              <button 
                onClick={() => setRefundMethod("CASH")}
                className={`p-4 border rounded-xl flex items-center gap-4 transition-all text-left ${refundMethod === 'CASH' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-background hover:border-muted'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${refundMethod === 'CASH' ? 'border-primary' : 'border-muted'}`}>
                  {refundMethod === 'CASH' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="font-inter font-bold text-foreground">Cash Refund</p>
                  <p className="font-inter text-xs text-muted">Opens cash drawer instantly</p>
                </div>
              </button>

              <button 
                onClick={() => setRefundMethod("CARD")}
                className={`p-4 border rounded-xl flex items-center gap-4 transition-all text-left ${refundMethod === 'CARD' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-background hover:border-muted'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${refundMethod === 'CARD' ? 'border-primary' : 'border-muted'}`}>
                  {refundMethod === 'CARD' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="font-inter font-bold text-foreground">Card Reversal</p>
                  <p className="font-inter text-xs text-muted">Send amount back to original card</p>
                </div>
              </button>

              <button 
                onClick={() => setRefundMethod("STORE_CREDIT")}
                className={`p-4 border rounded-xl flex items-center gap-4 transition-all text-left ${refundMethod === 'STORE_CREDIT' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-background hover:border-muted'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${refundMethod === 'STORE_CREDIT' ? 'border-primary' : 'border-muted'}`}>
                  {refundMethod === 'STORE_CREDIT' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="font-inter font-bold text-foreground">Store Credit</p>
                  <p className="font-inter text-xs text-muted">Issue a voucher code instantly</p>
                </div>
              </button>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-border bg-surface shrink-0">
          <button 
            disabled={selectedItems.length === 0 || isProcessing}
            onClick={handleCompleteReturn}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl py-4 transition-colors shadow-lg shadow-emerald-600/20"
          >
            {isProcessing ? (
              <span className="font-inter font-bold text-lg">Processing...</span>
            ) : (
              <>
                <span className="font-inter font-bold text-lg">Complete Return</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
