"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";

export default function VariantSelectionModal({ product, onClose, onAdd, allowOutOfStock = false }: { product: any, onClose: () => void, onAdd?: (product: any, variant: any, qty: number) => void, allowOutOfStock?: boolean }) {
  const variants = product?.variants || [];
  
  // Extract unique colors and sizes
  const availableColors = useMemo(() => {
    const colors = variants.map((v: any) => v.color).filter(Boolean);
    return Array.from(new Set(colors)) as string[];
  }, [variants]);

  const [selectedColor, setSelectedColor] = useState(availableColors[0] || "");
  
  // Get sizes for selected color
  const availableSizes = useMemo(() => {
    return variants
      .filter((v: any) => !selectedColor || v.color === selectedColor)
      .map((v: any) => v.size)
      .filter(Boolean);
  }, [variants, selectedColor]);

  // Remove duplicate sizes
  const uniqueSizes = Array.from(new Set(availableSizes)) as string[];

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || "");
  
  // Automatically select the first size when color changes
  useEffect(() => {
    if (uniqueSizes.length > 0 && !uniqueSizes.includes(selectedSize)) {
      setSelectedSize(uniqueSizes[0]);
    }
  }, [selectedColor, uniqueSizes]);

  const [qty, setQty] = useState(1);

  if (!product) return null;

  const hasColors = availableColors.length > 0;
  const hasSizes = uniqueSizes.length > 0;
  const showDirectVariants = !hasColors && !hasSizes && variants.length > 1;

  const selectedVariant = useMemo(() => {
    if (showDirectVariants) {
      return variants.find((v: any) => v.id === selectedVariantId) || variants[0];
    }
    return variants.find((v: any) => 
      (!selectedColor || v.color === selectedColor) && 
      (!selectedSize || v.size === selectedSize)
    ) || variants[0];
  }, [variants, selectedColor, selectedSize, showDirectVariants, selectedVariantId]);

  const price = selectedVariant?.price || 0;
  const inStock = selectedVariant?.stockStatus === 'instock';

  // Gather image logic similar to storefront
  let imageUrl = "/placeholder.png";
  if (selectedVariant?.featuredImage) imageUrl = selectedVariant.featuredImage;
  else if (selectedVariant?.gallery && selectedVariant.gallery.length > 0) imageUrl = selectedVariant.gallery[0];
  else if (variants.length > 0) {
    const firstWithImg = variants.find((v: any) => v.featuredImage || (v.gallery && v.gallery.length > 0));
    if (firstWithImg) imageUrl = firstWithImg.featuredImage || firstWithImg.gallery[0];
  }

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleAdd = () => {
    if (onAdd && selectedVariant) {
      onAdd(product, selectedVariant, qty);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 overflow-hidden animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-[520px] max-h-[85vh] sm:max-h-[88vh] bg-surface-elevated border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-modal-title"
      >
        
        {/* Header - Fixed & Pinned */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <h3 id="variant-modal-title" className="font-inter font-bold text-lg text-foreground">
              Select Options
            </h3>
            {variants.length > 1 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {variants.length} Variants
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose} 
            aria-label="Close"
            className="p-1.5 text-muted hover:text-foreground hover:bg-background rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body - Responsive Height & Scrollable */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1 overscroll-contain custom-scrollbar">
          
          {/* Product Summary */}
          <div className="flex gap-4 items-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-background shrink-0 border border-border shadow-inner">
              <Image src={imageUrl} alt={product.name} fill sizes="100px" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h4 className="font-inter font-bold text-foreground text-base leading-snug line-clamp-2">
                {product.name}
              </h4>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="font-mono font-bold text-primary text-lg">
                  Rs. {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`font-inter text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
                  (inStock || allowOutOfStock) ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-rose-500 bg-rose-500/10 border-rose-500/20"
                }`}>
                  {inStock ? "In Stock" : (allowOutOfStock ? "Pre-Sold" : "Out of Stock")}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-[1px] bg-border shrink-0"></div>

          {/* Color Selection */}
          {hasColors && (
            <div className="flex flex-col gap-2.5">
              <label className="font-inter font-semibold text-xs tracking-wider uppercase text-muted">
                Color: <span className="text-foreground font-bold">{selectedColor}</span>
              </label>
              <div className="flex gap-2.5 flex-wrap">
                {availableColors.map(color => (
                  <button 
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-xl font-inter font-semibold text-sm transition-all border ${
                      selectedColor === color 
                        ? 'border-primary text-primary bg-primary/10 ring-1 ring-primary' 
                        : 'border-border text-foreground hover:border-muted bg-surface'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pack / Variant Selection */}
          {variants.length > 1 ? (
            <div className="flex flex-col gap-2.5">
              <label className="font-inter font-semibold text-xs tracking-wider uppercase text-muted">
                Select Pack / Volume Unit
              </label>
              <div className="flex flex-col gap-2">
                {variants.map((v: any) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const label = v.packUnit || v.name || v.size || v.sku || "Standard Unit";
                  const vStock = v.quantity ?? 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { 
                        setSelectedVariantId(v.id); 
                        if (v.size) setSelectedSize(v.size); 
                        if (v.color) setSelectedColor(v.color); 
                      }}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary" 
                          : "border-border bg-surface hover:bg-background"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="font-inter font-bold text-sm text-foreground truncate">{label}</span>
                        <span className="text-[11px] text-muted font-mono">{v.sku || v.barcode || ""}</span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-mono font-bold text-primary text-sm">
                          Rs. {(v.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-semibold ${vStock > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {vStock > 0 ? `${vStock} in stock` : "Out of stock"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : hasSizes && (
            <div className="flex flex-col gap-2.5">
              <label className="font-inter font-semibold text-xs tracking-wider uppercase text-muted">
                Size / Spec: <span className="text-foreground font-bold">{selectedSize}</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {uniqueSizes.map(size => (
                  <button 
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[50px] h-[40px] px-4 rounded-xl flex items-center justify-center font-inter font-semibold text-sm transition-all border ${
                      selectedSize === size 
                        ? 'border-primary text-primary bg-primary/10 ring-1 ring-primary' 
                        : 'border-border text-foreground hover:border-muted bg-surface'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex flex-col gap-2.5">
            <label className="font-inter font-semibold text-xs tracking-wider uppercase text-muted">
              Quantity
            </label>
            <div className={`flex items-center border border-border rounded-xl h-[44px] w-[140px] bg-surface overflow-hidden ${(!inStock && !allowOutOfStock) ? 'opacity-50 pointer-events-none' : ''}`}>
              <button 
                type="button"
                disabled={!inStock && !allowOutOfStock} 
                onClick={() => setQty(Math.max(1, qty - 1))} 
                className="flex-1 text-lg font-bold text-muted border-r border-border h-full hover:bg-background hover:text-foreground transition-colors"
              >
                -
              </button>
              <span className="flex-1 font-mono font-bold text-primary flex items-center justify-center h-full bg-background select-none">
                {qty}
              </span>
              <button 
                type="button"
                disabled={!inStock && !allowOutOfStock} 
                onClick={() => setQty(qty + 1)} 
                className="flex-1 text-lg font-bold text-muted border-l border-border h-full hover:bg-background hover:text-foreground transition-colors"
              >
                +
              </button>
            </div>
          </div>

        </div>

        {/* Footer - Fixed & Pinned */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="flex flex-col sm:hidden">
            <span className="text-[10px] text-muted uppercase font-medium">Total</span>
            <span className="font-mono font-bold text-primary text-sm">
              Rs. {(price * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl font-inter font-semibold text-sm text-foreground hover:bg-background border border-border transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              disabled={!inStock && !allowOutOfStock}
              onClick={handleAdd} 
              className={`px-7 py-2.5 rounded-xl font-inter font-bold text-sm text-white transition-all shadow-md active:scale-[0.98] ${
                (inStock || allowOutOfStock) 
                  ? 'bg-primary hover:bg-primary-hover' 
                  : 'bg-muted/40 text-muted cursor-not-allowed'
              }`}
            >
              Add to Order {qty > 1 ? `(${qty})` : ''}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
