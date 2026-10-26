"use client";

import React, { useEffect, useState } from "react";
import { useGlobalDialog } from "@/store/dialog.store";
import { AlertCircle, HelpCircle, X } from "lucide-react";

export default function GlobalDialog() {
  const { isOpen, type, title, message, close } = useGlobalDialog();
  const [render, setRender] = useState(false);

  // Handle animation mounting/unmounting
  useEffect(() => {
    if (isOpen) setRender(true);
    else {
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} 
        onClick={() => close(false)}
      />

      {/* Dialog Box */}
      <div 
        className={`relative w-full max-w-sm bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col transition-all duration-300 transform ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 p-3 rounded-full ${type === 'alert' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
              {type === 'alert' ? <AlertCircle size={24} /> : <HelpCircle size={24} />}
            </div>
            
            <div className="flex-1 pt-1">
              <h3 className="font-poppins font-semibold text-foreground text-lg leading-none mb-2">
                {title}
              </h3>
              <p className="font-inter text-sm text-muted leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-surface-elevated px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          {type === 'confirm' && (
            <button
              onClick={() => close(false)}
              className="px-4 py-2 font-inter font-medium text-sm text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => close(true)}
            className="px-5 py-2 font-inter font-medium text-sm text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-md"
          >
            {type === 'confirm' ? 'Confirm' : 'Okay'}
          </button>
        </div>
      </div>
    </div>
  );
}
