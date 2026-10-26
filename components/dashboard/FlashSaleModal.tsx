"use client";

import { useState, useEffect } from "react";
import { X, Zap, Loader2, Plus, Trash2 } from "lucide-react";
import { useCreateFlashSale, useUpdateFlashSale } from "@/hooks/usePromotions";
import { useProducts } from "@/hooks/useProducts";
import { globalDialog } from "@/store/dialog.store";

interface FlashSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export default function FlashSaleModal({ isOpen, onClose, initialData }: FlashSaleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  
  // Selected items array: { variantId, salePrice, product: Product, variant: ProductVariant }
  const [items, setItems] = useState<any[]>([]);

  const { data: productsData } = useProducts({ take: 100 });
  const products = productsData?.data || [];

  const { mutateAsync: createFlashSale, isPending: isCreating } = useCreateFlashSale();
  const { mutateAsync: updateFlashSale, isPending: isUpdating } = useUpdateFlashSale();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setDiscount(initialData.discount?.toString() || "");
      setStartDate(initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : "");
      setEndDate(initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : "");
      setStatus(initialData.status || "ACTIVE");
      
      if (initialData.items) {
        setItems(initialData.items.map((i: any) => ({
          variantId: i.variantId,
          salePrice: i.salePrice?.toString() || "",
          product: i.variant?.product,
          variant: i.variant
        })));
      } else {
        setItems([]);
      }
    } else {
      setName("");
      setDescription("");
      setDiscount("");
      setStartDate("");
      setEndDate("");
      setStatus("ACTIVE");
      setItems([]);
    }
  }, [initialData, isOpen]);

  // Recalculate sale prices when global discount changes
  useEffect(() => {
    if (!discount) return;
    const discountVal = Number(discount);
    if (isNaN(discountVal)) return;

    setItems(prevItems => prevItems.map(item => {
      const currentPrice = item.variant?.price || 0;
      const computedSalePrice = currentPrice - (currentPrice * (discountVal / 100));
      return { ...item, salePrice: computedSalePrice.toString() };
    }));
  }, [discount]);

  if (!isOpen) return null;

  async function handleSave() {
    try {
      const payload = {
        name,
        description,
        discount: Number(discount),
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        status,
        items: items.map(i => ({
          variantId: i.variantId,
          salePrice: Number(i.salePrice)
        }))
      };

      if (initialData?.id) {
        await updateFlashSale({ id: initialData.id, payload });
      } else {
        await createFlashSale(payload);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save flash sale", error);
      globalDialog.alert("Failed to save flash sale");
    }
  }

  const addVariant = (variant: any, product: any) => {
    if (items.find(i => i.variantId === variant.id)) return;
    
    // Auto calculate sale price based on global discount
    const currentPrice = variant.price || 0;
    const computedSalePrice = discount ? currentPrice - (currentPrice * (Number(discount) / 100)) : currentPrice;

    setItems([...items, {
      variantId: variant.id,
      salePrice: computedSalePrice.toString(),
      product,
      variant
    }]);
  };

  const removeVariant = (variantId: string) => {
    setItems(items.filter(i => i.variantId !== variantId));
  };

  const updateItemSalePrice = (variantId: string, price: string) => {
    setItems(items.map(i => i.variantId === variantId ? { ...i, salePrice: price } : i));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[800px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="font-inter font-bold text-lg text-foreground flex items-center gap-2">
              <Zap size={18} className="text-orange-500" /> 
              {initialData ? "Edit Flash Sale" : "Create Flash Sale"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-elevated rounded-lg text-muted hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8 bg-background custom-scrollbar">
          
          <div className="flex-1 flex flex-col gap-5">
            <h3 className="font-inter font-semibold text-foreground border-b border-border pb-2">Campaign Details</h3>
            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground">Campaign Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. End of Season Flash Sale"
                className="w-full border border-border bg-surface-elevated text-foreground placeholder:text-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground">Global Discount (%) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="25"
                className="w-full border border-border bg-surface-elevated text-foreground placeholder:text-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-inter text-xs font-semibold text-foreground">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-border bg-surface-elevated text-foreground rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-inter text-xs font-semibold text-foreground">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full border border-border bg-surface-elevated text-foreground rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-2">
              <label className="font-inter text-xs font-semibold text-foreground">Status</label>
              <div className="flex items-center gap-4 bg-surface-elevated border border-border p-3 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="fs-status" value="ACTIVE" checked={status === "ACTIVE"} onChange={() => setStatus("ACTIVE")} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-inter text-foreground">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="fs-status" value="SCHEDULED" checked={status === "SCHEDULED"} onChange={() => setStatus("SCHEDULED")} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-inter text-foreground">Scheduled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="fs-status" value="EXPIRED" checked={status === "EXPIRED"} onChange={() => setStatus("EXPIRED")} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-inter text-foreground">Ended</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right side: Items */}
          <div className="flex-[1.5] flex flex-col gap-4 border-l border-border pl-8">
            <h3 className="font-inter font-semibold text-foreground border-b border-border pb-2">Included Products</h3>
            
            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground">Quick Add Variant</label>
              <select 
                onChange={(e) => {
                  if(!e.target.value) return;
                  const [pId, vId] = e.target.value.split('|');
                  const product = products.find((p: any) => p.id === pId);
                  const variant = product?.variants?.find((v: any) => v.id === vId);
                  if(product && variant) addVariant(variant, product);
                  e.target.value = ""; // reset
                }}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter bg-surface-elevated text-foreground"
              >
                <option value="">-- Select Product Variant --</option>
                {products.map((p: any) => (
                  <optgroup key={p.id} label={p.name}>
                    {p.variants?.map((v: any) => (
                      <option key={v.id} value={`${p.id}|${v.id}`}>{v.name || v.sku} - Rs.{v.price}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex-1 border border-border rounded-lg overflow-hidden flex flex-col bg-surface-elevated">
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar min-h-[250px]">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted gap-2">
                    <Zap size={32} className="opacity-20" />
                    <p className="text-sm font-inter">No products added yet.</p>
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="bg-surface border border-border rounded-lg p-3 flex items-center justify-between shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-sm font-inter font-semibold text-foreground">{item.product?.name}</span>
                        <span className="text-xs font-inter text-muted">{item.variant?.name || item.variant?.sku}</span>
                        <span className="text-xs font-inter text-muted line-through mt-1">Reg: Rs.{item.variant?.price}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <label className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Sale Price</label>
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-xs font-medium">Rs</span>
                            <input
                              type="number"
                              value={item.salePrice}
                              onChange={(e) => updateItemSalePrice(item.variantId, e.target.value)}
                              className="w-full border border-red-300 dark:border-red-800/60 rounded-md pl-7 pr-2 py-1.5 text-sm outline-none focus:border-red-500 font-inter font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                            />
                          </div>
                        </div>
                        <button onClick={() => removeVariant(item.variantId)} className="p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors mt-4">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        <div className="border-t border-border px-6 py-4 bg-surface shrink-0 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-surface border border-border rounded-lg font-inter font-medium text-sm text-foreground hover:bg-surface-elevated transition-colors shadow-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !discount.trim() || isCreating || isUpdating}
            className="px-5 py-2 bg-primary text-white rounded-lg font-inter font-medium text-sm hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(isCreating || isUpdating) && <Loader2 size={16} className="animate-spin" />}
            {initialData ? "Save Changes" : "Create Flash Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}
