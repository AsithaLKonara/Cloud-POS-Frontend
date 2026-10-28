"use client";

import { useState } from "react";
import { X, Send, Users, AlertCircle, Link } from "lucide-react";
import { notificationsService } from "../../services/notifications.service";
import { useFlashSales } from "../../hooks/usePromotions";
import { useAuthStore } from "@/store/auth.store";

interface BulkMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkMessageModal({ isOpen, onClose }: BulkMessageModalProps) {
  const { user } = useAuthStore();
  const tenantName = user?.tenant?.name || "our store";
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFlashSale, setSelectedFlashSale] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: flashSalesData } = useFlashSales({ status: 'ACTIVE' });
  const activeFlashSales = flashSalesData || [];
  
  if (!isOpen) return null;

  const numberCount = numbers.split(",").filter(n => n.trim().length > 0).length;
  const messageLength = message.length;
  const smsCount = Math.ceil(messageLength / 160) || 1;

  async function handleSend() {
    setError(null);
    if (!message.trim() || numberCount === 0) {
      setError("Please provide at least one number and a message.");
      return;
    }
    
    setIsSending(true);
    try {
      const numberArray = numbers.split(",").map(n => n.trim()).filter(n => n.length > 0);
      await notificationsService.sendBulkSms({
        numbers: numberArray,
        message,
        flashSaleId: selectedFlashSale || undefined
      });
      setNumbers("");
      setMessage("");
      setSelectedFlashSale("");
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to send SMS");
    } finally {
      setIsSending(false);
    }
  }

  function handleFlashSaleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const fsId = e.target.value;
    setSelectedFlashSale(fsId);
    
    if (fsId) {
      const fs = activeFlashSales.find((s: any) => s.id === fsId);
      if (fs && !message) {
        setMessage(`Flash Sale: ${fs.name}! Shop now at ${tenantName}`);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[600px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="font-inter font-bold text-lg text-foreground flex items-center gap-2">
              <Send size={18} className="text-primary" /> 
              Send Bulk SMS
            </h2>
            <p className="font-inter text-xs text-muted mt-0.5">Send a promotional text message to a list of numbers.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-elevated rounded-lg text-muted hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-background custom-scrollbar">
          
          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs font-semibold text-foreground flex justify-between">
              Target Phone Numbers
              <span className="text-muted font-normal">{numberCount} numbers detected</span>
            </label>
            <textarea
              value={numbers}
              onChange={e => setNumbers(e.target.value)}
              rows={3}
              placeholder="+94771234567, 0719876543, ..."
              className="w-full border border-border bg-surface-elevated text-foreground placeholder:text-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono resize-none"
            />
            <p className="text-xs text-muted font-inter">Separate numbers with commas or spaces.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs font-semibold text-foreground flex justify-between">
              Message Content
              <span className={`font-normal ${smsCount > 1 ? 'text-amber-600 dark:text-amber-400' : 'text-muted'}`}>
                {messageLength} chars ({smsCount} SMS)
              </span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Hi there! Get 20% off all oversized tees this weekend with code TEE20..."
              className="w-full border border-border bg-surface-elevated text-foreground placeholder:text-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Link size={12} /> Link to Flash Sale (Optional)
            </label>
            <select
              value={selectedFlashSale}
              onChange={handleFlashSaleSelect}
              className="w-full border border-border bg-surface-elevated text-foreground rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter appearance-none"
            >
              <option value="">-- None --</option>
              {activeFlashSales.map((fs: any) => (
                <option key={fs.id} value={fs.id}>{fs.name} ({fs.discount}% off)</option>
              ))}
            </select>
          </div>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {messageLength > 160 && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg mt-1">
              <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-inter leading-relaxed">
                Your message exceeds 160 characters and will be split into multiple SMS segments, which may increase billing costs.
              </p>
            </div>
          )}

          <div className="bg-surface-elevated border border-border rounded-xl p-4 flex flex-col gap-3">
            <h3 className="font-inter text-xs font-bold text-muted uppercase tracking-wider">Campaign Summary</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-foreground">
                <Users size={16} className="text-muted" />
                <span className="font-inter text-sm font-semibold">{numberCount} Recipients</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Send size={16} className="text-muted" />
                <span className="font-inter text-sm font-semibold">{numberCount * smsCount} Total SMS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-border bg-surface shrink-0 flex items-center justify-between">
          <p className="text-xs text-muted font-inter">
            Messages will be queued for delivery.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || numberCount === 0 || message.length === 0}
              className="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? "Sending..." : "Send SMS"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
