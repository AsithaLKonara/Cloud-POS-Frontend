"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGlobalDialog } from "@/store/dialog.store";
import { 
  AlertCircle, 
  AlertTriangle, 
  AlertOctagon, 
  HelpCircle, 
  CheckCircle2, 
  KeyRound, 
  X 
} from "lucide-react";

export default function GlobalDialog() {
  const { 
    isOpen, 
    type, 
    title, 
    message, 
    variant, 
    confirmText, 
    cancelText, 
    inputType, 
    placeholder, 
    inputValue, 
    setInputValue, 
    close 
  } = useGlobalDialog();

  const [mounted, setMounted] = useState(false);
  const [render, setRender] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle animation mounting/unmounting
  useEffect(() => {
    if (isOpen) {
      setRender(true);
      if (type === 'prompt') {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } else {
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, type]);

  const handleCancel = () => {
    if (type === 'prompt') {
      close(null);
    } else {
      close(false);
    }
  };

  const handleConfirm = () => {
    if (type === 'prompt') {
      close(inputValue);
    } else {
      close(true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if (e.key === "Enter" && !e.shiftKey) {
        // If inside an input or confirm/alert, enter confirms
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, type, inputValue]);

  if (!mounted || !render) return null;

  // Determine icon & theme based on variant / type
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  const getIcon = () => {
    if (type === 'prompt') {
      if (inputType === 'password') return <KeyRound size={22} />;
      return <HelpCircle size={22} />;
    }
    if (isDanger) return <AlertOctagon size={22} />;
    if (isWarning) return <AlertTriangle size={22} />;
    if (isSuccess) return <CheckCircle2 size={22} />;
    if (type === 'confirm') return <HelpCircle size={22} />;
    return <AlertCircle size={22} />;
  };

  const getIconWrapperClass = () => {
    if (isDanger) return "bg-red-500/10 text-red-600 dark:text-red-400";
    if (isWarning) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    if (isSuccess) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (type === 'prompt') return "bg-primary/10 text-primary";
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  };

  const getConfirmButtonClass = () => {
    if (isDanger) {
      return "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20";
    }
    if (isWarning) {
      return "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20";
    }
    return "bg-primary hover:bg-primary-hover text-white shadow-primary/20";
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-dialog-title"
      aria-describedby="global-dialog-description"
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} 
        onClick={handleCancel}
      />

      {/* Dialog Box */}
      <div 
        className={`relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col transition-all duration-300 transform ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 p-3 rounded-xl ${getIconWrapperClass()}`}>
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h3 id="global-dialog-title" className="font-poppins font-semibold text-foreground text-lg leading-snug">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-1 -mr-1 text-muted hover:text-foreground rounded-lg transition-colors"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <p id="global-dialog-description" className="font-inter text-sm text-muted leading-relaxed mt-2 whitespace-pre-line">
                {message}
              </p>

              {type === 'prompt' && (
                <div className="mt-4">
                  <input
                    ref={inputRef}
                    type={inputType}
                    value={inputValue}
                    placeholder={placeholder}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl font-inter text-sm text-foreground placeholder:text-muted/60 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-surface-elevated px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          {(type === 'confirm' || type === 'prompt') && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 font-inter font-medium text-sm text-muted hover:text-foreground hover:bg-surface rounded-xl transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 font-inter font-medium text-sm rounded-xl transition-all shadow-md active:scale-95 ${getConfirmButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
