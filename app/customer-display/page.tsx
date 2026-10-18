"use client";

import React, { useState, useEffect } from "react";
import { CustomerDisplayState } from "@/services/hardware.service";
import { ShoppingBag, QrCode, CheckCircle2, Store, Sparkles } from "lucide-react";

export default function CustomerDisplayPage() {
  const [state, setState] = useState<CustomerDisplayState>({
    storeName: "XONIT Flagship Store",
    cashier: "Cashier 01",
    itemCount: 0,
    subtotalLkr: 0,
    discountLkr: 0,
    totalLkr: 0,
    status: "IDLE",
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel("xonit_pos_customer_display");
    channel.onmessage = (event) => {
      if (event.data) {
        setState(event.data);
      }
    };

    return () => channel.close();
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-between p-8 select-none font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-cyan-500/20">
            X
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {state.storeName}
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono">
                Customer Terminal
              </span>
            </h1>
            <p className="text-sm text-stone-400">Cashier: {state.cashier}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-sm">
          <Store size={16} className="text-cyan-400" />
          <span>Active Session</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Last Scanned Item / Welcome */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {state.status === "IDLE" ? (
            <div className="p-12 rounded-3xl bg-stone-900/50 border border-stone-800 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-stone-800/80 flex items-center justify-center mb-6 text-stone-400">
                <ShoppingBag size={40} />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-2">Welcome!</h2>
              <p className="text-lg text-stone-400 max-w-md">
                Please place your items on the counter. Your checkout details will appear here.
              </p>
            </div>
          ) : state.status === "COMPLETED" ? (
            <div className="p-12 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 text-center flex flex-col items-center">
              <CheckCircle2 size={64} className="text-emerald-400 mb-4 animate-bounce" />
              <h2 className="text-4xl font-black text-white mb-2">Payment Completed!</h2>
              <p className="text-xl text-stone-300">Thank you for shopping with us.</p>
              {state.changeDueLkr !== undefined && state.changeDueLkr > 0 && (
                <div className="mt-6 px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-2xl font-bold">
                  Change Due: Rs. {state.changeDueLkr.toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-stone-900/60 border border-stone-800/80 backdrop-blur-sm">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold mb-2 block">
                  Last Scanned Item
                </span>
                <h3 className="text-3xl font-black text-white mb-4">
                  {state.lastScannedItem?.name || "Processing item..."}
                </h3>
                <div className="flex items-baseline justify-between pt-4 border-t border-stone-800">
                  <span className="text-stone-400 text-lg">Qty: {state.lastScannedItem?.qty || 1}</span>
                  <span className="text-3xl font-mono font-bold text-white">
                    Rs. {(state.lastScannedItem?.priceLkr || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 rounded-2xl bg-stone-900/40 border border-stone-800/50 flex items-center justify-between text-stone-400">
                <span>Total Items in Cart</span>
                <span className="font-mono font-bold text-white text-lg">{state.itemCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pricing Breakdown & Dynamic LankaQR */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-6">
            <h4 className="text-sm font-mono uppercase tracking-wider text-stone-400 font-bold">
              Bill Summary
            </h4>

            <div className="space-y-3 text-stone-300 text-lg">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">Rs. {state.subtotalLkr.toLocaleString()}</span>
              </div>
              {state.discountLkr > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount Savings</span>
                  <span className="font-mono">-Rs. {state.discountLkr.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-stone-800">
              <span className="text-sm uppercase tracking-wider text-stone-400 block mb-1">
                Total Payable
              </span>
              <div className="text-5xl font-black font-mono text-cyan-400 tracking-tight">
                Rs. {state.totalLkr.toLocaleString()}
              </div>
            </div>

            {/* Dynamic LankaQR Payment Box */}
            {state.status === "PAYMENT" && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-cyan-950/40 border border-cyan-500/30 flex flex-col items-center text-center">
                <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-lg flex items-center justify-center mb-4">
                  {/* EMVCo LankaQR Code Representation */}
                  <div className="w-full h-full border-4 border-black border-dashed flex flex-col items-center justify-center text-black font-mono text-xs">
                    <QrCode size={48} className="text-black mb-1" />
                    <span className="font-bold">LANKA QR</span>
                  </div>
                </div>
                <p className="text-sm text-stone-200 font-medium">Scan to Pay with any Sri Lankan Bank App</p>
                <span className="text-xs text-stone-400 mt-1 font-mono">BOC • Commercial • Sampath • FriMi • Genie</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-stone-800/80 pt-6 flex items-center justify-between text-stone-500 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-cyan-400" />
          <span>XONIT SPACE Cloud POS Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <span>80mm Thermal Sync Active</span>
          <span>•</span>
          <span>Weighing Scale Auto-Calibrated</span>
        </div>
      </div>
    </div>
  );
}
