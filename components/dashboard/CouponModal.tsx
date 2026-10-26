"use client";

import { useState, useEffect } from "react";
import { X, Tag, RefreshCcw, Loader2 } from "lucide-react";
import { useCreateCoupon, useUpdateCoupon } from "@/hooks/usePromotions";
import { globalDialog } from "@/store/dialog.store";

interface CouponData {
  id?: string;
  name: string;
  code: string;
  type: string;
  value: string;
  usageLimit: string;
  expiry: string;
  status: string;
}

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: CouponData | null;
}

export default function CouponModal({ isOpen, onClose, initialData }: CouponModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("Percentage");
  const [value, setValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiry, setExpiry] = useState("");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code);
      setType(initialData.type);
      setValue(initialData.value.replace(/[^0-9.]/g, ""));
      setUsageLimit(initialData.usageLimit === "Unlimited" ? "" : initialData.usageLimit);
      setExpiry(initialData.expiry === "No Expiry" ? "" : initialData.expiry);
      setStatus(initialData.status);
    } else {
      setName("");
      setCode("");
      setType("Percentage");
      setValue("");
      setUsageLimit("");
      setExpiry("");
      setStatus("Active");
    }
  }, [initialData, isOpen]);

  function generateRandomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let res = "";
    for(let i=0; i<8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    setCode(res);
  }

  const { mutateAsync: createCoupon, isPending: isCreating } = useCreateCoupon();
  const { mutateAsync: updateCoupon, isPending: isUpdating } = useUpdateCoupon();

  if (!isOpen) return null;

  async function handleSave() {
    try {
      const payload = {
        name,
        code,
        type,
        value: Number(value),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        expiryDate: expiry ? new Date(expiry).toISOString() : null,
        status
      };

      if (initialData?.id) {
        await updateCoupon({ id: initialData.id, payload });
      } else {
        await createCoupon(payload);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save coupon", error);
      globalDialog.alert("Failed to save coupon");
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[500px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="font-inter font-bold text-lg text-foreground flex items-center gap-2">
              <Tag size={18} className="text-primary" /> 
              {initialData ? "Edit Coupon" : "Create New Coupon"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-elevated rounded-lg text-muted hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-background custom-scrollbar">
          
          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs font-semibold text-foreground">Internal Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Summer Sale 2026"
              className="w-full border border-border bg-surface-elevated text-foreground placeholder:text-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs font-semibold text-foreground">Coupon Code <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER20"
                className="flex-1 border border-border bg-surface-elevated text-foreground placeholder:text-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono uppercase"
              />
              <button onClick={generateRandomCode} className="px-3 border border-border bg-surface-elevated rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors flex items-center justify-center shrink-0" title="Generate Random">
                <RefreshCcw size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground">Discount Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value)} 
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter bg-surface-elevated text-foreground"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed Amount">Fixed Amount (Rs.)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground">Value <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={type === "Percentage" ? "20" : "500"}
                  className="w-full border border-border rounded-lg pl-8 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter bg-surface-elevated text-foreground placeholder:text-muted"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">
                  {type === "Percentage" ? "%" : "Rs"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground">Total Usage Limit</label>
              <input
                type="number"
                value={usageLimit}
                onChange={e => setUsageLimit(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter bg-surface-elevated text-foreground placeholder:text-muted"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground">Expiry Date</label>
              <input
                type="date"
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter bg-surface-elevated text-foreground"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mt-2">
            <label className="font-inter text-xs font-semibold text-foreground">Status</label>
            <div className="flex items-center gap-4 bg-surface-elevated border border-border p-3 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="Active" checked={status === "Active"} onChange={() => setStatus("Active")} className="w-4 h-4 accent-primary" />
                <span className="text-sm font-inter text-foreground">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="Scheduled" checked={status === "Scheduled"} onChange={() => setStatus("Scheduled")} className="w-4 h-4 accent-primary" />
                <span className="text-sm font-inter text-foreground">Scheduled</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="Expired" checked={status === "Expired"} onChange={() => setStatus("Expired")} className="w-4 h-4 accent-primary" />
                <span className="text-sm font-inter text-muted">Disabled / Expired</span>
              </label>
            </div>
          </div>

        </div>

        <div className="border-t border-border px-6 py-4 bg-surface shrink-0 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-surface border border-border rounded-lg font-inter font-medium text-sm text-foreground hover:bg-surface-elevated transition-colors shadow-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !code.trim() || !value.trim() || isCreating || isUpdating}
            className="px-5 py-2 bg-primary text-white rounded-lg font-inter font-medium text-sm hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(isCreating || isUpdating) && <Loader2 size={16} className="animate-spin" />}
            {initialData ? "Save Changes" : "Create Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
}
