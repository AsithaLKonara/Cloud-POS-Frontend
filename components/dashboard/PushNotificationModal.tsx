"use client";

import { useState } from "react";
import { X, Bell, ImagePlus, Link, AlertCircle, MessageSquare } from "lucide-react";
import { notificationsService } from "../../services/notifications.service";
import { useFlashSales } from "../../hooks/usePromotions";
import { useAuthStore } from "@/store/auth.store";

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PushNotificationModal({ isOpen, onClose }: PushNotificationModalProps) {
  const { user } = useAuthStore();
  const tenantName = user?.tenant?.name || "Store";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [selectedFlashSale, setSelectedFlashSale] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alsoSendSms, setAlsoSendSms] = useState(false);
  const [smsNumbers, setSmsNumbers] = useState("");

  const { data: flashSalesData } = useFlashSales({ status: 'ACTIVE' });
  const activeFlashSales = flashSalesData || [];
  
  if (!isOpen) return null;

  async function handleSend() {
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError("Please provide a title and body for the push notification.");
      return;
    }

    setIsSending(true);
    try {
      // 1. Broadcast web push to all subscribed devices
      await notificationsService.broadcastPush({
        title,
        body,
        url: link || undefined,
        flashSaleId: selectedFlashSale || undefined
      });

      // 2. Optionally also send SMS blast
      if (alsoSendSms && smsNumbers.trim()) {
        const numbers = smsNumbers.split(/[,\n]+/).map((n) => n.trim()).filter(Boolean);
        if (numbers.length > 0) {
          await notificationsService.sendBulkSms({
            numbers,
            message: `${title}\n${body}${link ? `\n${link}` : ""}`,
            flashSaleId: selectedFlashSale || undefined,
          });
        }
      }

      setTitle("");
      setBody("");
      setLink("");
      setSelectedFlashSale("");
      setSmsNumbers("");
      setAlsoSendSms(false);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to broadcast push notification");
    } finally {
      setIsSending(false);
    }
  }

  function handleFlashSaleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const fsId = e.target.value;
    setSelectedFlashSale(fsId);
    
    if (fsId) {
      const fs = activeFlashSales.find((s: any) => s.id === fsId);
      if (fs) {
        if (!title) setTitle(`Flash Sale: ${fs.name}!`);
        if (!link) setLink(`/sale`);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[800px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: Form */}
        <div className="flex-1 flex flex-col max-h-[50vh] md:max-h-none overflow-y-auto custom-scrollbar md:border-r border-border bg-background">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
            <div>
              <h2 className="font-inter font-bold text-lg text-foreground flex items-center gap-2">
                <Bell size={18} className="text-amber-500" /> 
                Push Notification
              </h2>
              <p className="font-inter text-xs text-muted mt-0.5">Send alerts to customers' devices.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-elevated rounded-lg text-muted hover:text-foreground transition-colors md:hidden">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground">Notification Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={40}
                placeholder="e.g. Flash Sale Live Now!"
                className="w-full border border-border bg-surface-elevated text-foreground placeholder:text-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground">Message Body <span className="text-red-500">*</span></label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={3}
                maxLength={150}
                placeholder="Tap here to claim your 50% off before time runs out..."
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

            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Link size={12} /> Target URL (Optional)
              </label>
              <input
                type="text"
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://example.com/sale"
                className="w-full border border-border bg-surface-elevated text-foreground placeholder:text-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ImagePlus size={12} /> Rich Image (Optional)
              </label>
              <label className="h-24 border-2 border-dashed border-border bg-surface-elevated rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary transition-all group">
                <span className="font-inter text-xs text-muted group-hover:text-primary transition-colors font-medium">Click to upload image</span>
                <span className="font-inter text-[10px] text-muted">JPG/PNG/WEBP under 1MB</span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>

            {/* SMS Also Send Toggle */}
            <div className="flex flex-col gap-3 border border-dashed border-border rounded-xl p-4 bg-surface-elevated">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="alsoSendSms"
                  type="checkbox"
                  checked={alsoSendSms}
                  onChange={e => setAlsoSendSms(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="font-inter text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare size={12} /> Also send SMS blast
                </span>
              </label>
              {alsoSendSms && (
                <div className="flex flex-col gap-2">
                  <label className="font-inter text-xs text-muted">Phone numbers (one per line or comma-separated)</label>
                  <textarea
                    value={smsNumbers}
                    onChange={e => setSmsNumbers(e.target.value)}
                    rows={3}
                    placeholder={"+94771234567\n+94711234567"}
                    className="w-full border border-border bg-surface text-foreground placeholder:text-muted rounded-lg px-3 py-2.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-inter resize-none font-mono"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

          </div>

          <div className="mt-auto border-t border-border px-6 py-4 bg-surface shrink-0 flex items-center justify-end gap-3">
            <button onClick={onClose} disabled={isSending} className="px-4 py-2 bg-surface border border-border rounded-lg font-inter font-medium text-sm text-foreground hover:bg-surface-elevated transition-colors shadow-sm hidden md:block">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !title.trim() || !body.trim()}
              className="px-5 py-2 bg-primary text-white rounded-lg font-inter font-medium text-sm hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Bell size={14} /> {isSending ? "Sending..." : "Send Now"}
            </button>
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className="w-[320px] bg-surface-elevated shrink-0 hidden md:flex flex-col items-center justify-center p-6 border-l border-border relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-surface rounded-lg text-muted hover:text-foreground transition-colors">
            <X size={20} />
          </button>
          
          <h3 className="font-inter text-xs font-bold text-muted uppercase tracking-wider mb-6">Device Preview</h3>
          
          {/* Fake Phone Lockscreen */}
          <div className="w-[280px] h-[550px] bg-black rounded-[2rem] p-3 shadow-2xl relative border-8 border-stone-800 dark:border-stone-950">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-800 dark:bg-stone-950 rounded-b-2xl"></div>
            
            {/* Screen Wallpaper */}
            <div className="w-full h-full rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden relative">
              <div className="absolute inset-x-0 top-16 flex flex-col items-center">
                <span className="text-white font-inter text-5xl font-light">12:34</span>
                <span className="text-white/70 font-inter text-sm mt-1">Friday, August 16</span>
              </div>

              {/* Notification Bubble */}
              <div className="absolute top-40 inset-x-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl p-3 shadow-lg flex gap-3 transform transition-all border border-stone-200/50 dark:border-stone-700/50">
                <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <span className="font-serif italic font-bold text-lg leading-none">L</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="font-inter text-xs font-bold text-stone-900 dark:text-stone-100 uppercase">{tenantName}</span>
                    <span className="font-inter text-[10px] text-stone-500 dark:text-stone-400">now</span>
                  </div>
                  <p className="font-inter text-sm font-semibold text-stone-900 dark:text-stone-100 mt-0.5 truncate">{title || "Notification Title"}</p>
                  <p className="font-inter text-xs text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-2 leading-relaxed">{body || "Your message body will appear right here."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
