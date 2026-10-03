"use client";

import React, { useState } from "react";
import { X, Phone, MapPin, Truck, CheckCircle2, Trash2, Link as LinkIcon, User, CreditCard, Banknote, ShoppingBag, Zap } from "lucide-react";
import { useCreateShipment } from "@/hooks/useShipping";
import { useProcessPosOrder, useCurrentSession } from "@/hooks/usePos";
import { globalDialog } from "@/store/dialog.store";
import slAddress from "sl-address";
import { allFardarCities } from "@/lib/fardarCities";

interface PosDispatchTicketProps {
  isMobileCartOpen: boolean;
  setIsMobileCartOpen: (open: boolean) => void;
  cart: any[];
  updateQty: (id: number, delta: number) => void;
  clearCart: () => void;
  branchId?: string;
}

export default function PosDispatchTicket({ isMobileCartOpen, setIsMobileCartOpen, cart, updateQty, clearCart, branchId }: PosDispatchTicketProps) {
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressLine3, setAddressLine3] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [nearestCity, setNearestCity] = useState("");
  const [customerFound, setCustomerFound] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "Transfer" | "Link">("COD");
  const [deliveryMethod, setDeliveryMethod] = useState<"Fardar" | "Pickup">("Fardar");
  
  const [isDispatching, setIsDispatching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingNum, setTrackingNum] = useState<string | null>(null);

  const isPhoneValid = /^0\d{9}$/.test(phone);

  const handlePhoneSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (val === "0771234567") {
      setCustomerFound(true);
      setCustomerName("Kasun Perera");
      setAddressLine1("123 Sample St");
      setAddressLine2("Apartment 4B");
      setAddressLine3("");
      setDistrict("Colombo");
      setCity("Colombo 03");
      setNearestCity("Kohuwala");
    } else {
      setCustomerFound(false);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const deliveryFee = deliveryMethod === "Fardar" ? 400 : 0;
  const total = subtotal + deliveryFee;

  const createShipmentMutation = useCreateShipment();
  const processPosOrderMutation = useProcessPosOrder();
  const { data: activeSession } = useCurrentSession("TERM-001");

  const handleDispatch = async () => {
    if (!isPhoneValid) {
      globalDialog.alert("Phone number must start with 0 and be 10 digits (e.g., 0712345678).");
      return;
    }
    setIsDispatching(true);
    try {
      if (!activeSession) throw new Error("No active shift session found. Please open a shift before dispatching.");

      const effectiveBranchId = branchId || activeSession?.branchId || activeSession?.branch?.id;
      if (!effectiveBranchId) {
        throw new Error("No branch assigned to your current session. Please select a valid branch.");
      }

      // 1. Create POS Order to deduct inventory and log sale
      const orderRes = await processPosOrderMutation.mutateAsync({
        branchId: effectiveBranchId,
        sessionId: activeSession.id,
        items: cart.map(i => ({ variantId: i.id, qty: i.qty })),
        paymentMethod: paymentMethod === "Transfer" ? "BANK_TRANSFER" : paymentMethod,
        appliedVouchers: [],
        subtotal,
        total,
        tax: 0,
        customerName: customerName || undefined,
        customerPhone: phone || undefined,
        shippingAddress: {
          firstName: customerName ? customerName.split(" ")[0] : "Guest",
          lastName: customerName ? customerName.split(" ").slice(1).join(" ") : "",
          phone: phone,
          addressLine1: addressLine1,
          addressLine2: addressLine2,
          addressLine3: addressLine3,
          city: city,
          district: district,
          nearestCity: nearestCity
        }
      });

      // 2. Forward to 3PL if applicable
      if (deliveryMethod === "Fardar") {
        const shipmentRes = await createShipmentMutation.mutateAsync({
          orderReference: orderRes.orderNumber || "POS-DISPATCH-" + Math.floor(Math.random() * 100000),
          customerName: customerName || "Guest",
          customerPhone: phone,
          customerAddress1: addressLine1 || "No address provided",
          customerAddress2: addressLine2 || "",
          customerAddress3: addressLine3 || "",
          district: district || "",
          city: city || "",
          nearestCity: nearestCity || city || "",
          amountToCollect: paymentMethod === "COD" ? total : 0,
          pieces: cart.length
        });
        setLabelUrl(shipmentRes.labelUrl);
        setTrackingNum(shipmentRes.trackingNumber);
      }
      setSuccess(true);
    } catch (error: any) {
      console.error("POS Dispatch Error:", error);

      let errorMessage = "Failed to process dispatch order. Please check customer details and try again.";
      if (error?.response?.data) {
        const data = error.response.data;
        if (typeof data.error === "string") {
          errorMessage = data.error;
        } else if (data.error?.message && typeof data.error.message === "string") {
          errorMessage = data.error.message;
        } else if (typeof data.message === "string") {
          errorMessage = data.message;
        }
      } else if (error?.message && !error.message.includes("status code")) {
        errorMessage = error.message;
      }

      globalDialog.alert(errorMessage, "Dispatch Failed");
    } finally {
      setIsDispatching(false);
    }
  };

  if (success) {
    return (
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[680px] xl:w-[750px] bg-surface flex flex-col shrink-0 shadow-2xl lg:shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-50 lg:z-0 lg:static transform transition-transform duration-300 lg:translate-x-0 ${isMobileCartOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="font-inter font-bold text-2xl text-foreground mb-2">Order Dispatched!</h2>
          <p className="font-inter text-muted mb-8 text-sm max-w-md">
            {paymentMethod === "Link" 
              ? `Payment link sent to ${phone}. Order will be dispatched via ${deliveryMethod} once paid.`
              : `Order has been routed to the warehouse for ${deliveryMethod} delivery.`}
          </p>
          {labelUrl && (
            <button 
              onClick={() => window.open(labelUrl, '_blank')}
              className="w-full max-w-sm py-3 mb-3 bg-foreground text-background rounded-xl font-inter font-bold hover:bg-stone-800 transition-colors shadow-lg"
            >
              Print Shipping Label
            </button>
          )}
          <button 
            onClick={() => { setSuccess(false); clearCart(); setPhone(""); setCustomerName(""); setAddressLine1(""); setAddressLine2(""); setAddressLine3(""); setDistrict(""); setCity(""); setNearestCity(""); setCustomerFound(false); setIsMobileCartOpen(false); setLabelUrl(null); setTrackingNum(null); }}
            className="w-full max-w-sm py-4 bg-primary text-white rounded-xl font-inter font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
          >
            New Phone Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[680px] xl:w-[750px] bg-surface flex flex-col shrink-0 shadow-2xl lg:shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-50 lg:z-0 lg:static transform transition-transform duration-300 lg:translate-x-0 ${isMobileCartOpen ? "translate-x-0" : "translate-x-full"}`}>
      
      {/* Header */}
      <div className="p-4 border-b border-border bg-background flex justify-between items-center shrink-0 h-[60px]">
        <h2 className="font-inter font-bold text-lg flex items-center gap-2 text-foreground">
          <button className="lg:hidden p-1 -ml-1 text-muted" onClick={() => setIsMobileCartOpen(false)}>
            <X size={20} />
          </button>
          <Zap size={18} className="text-primary" /> Dispatch Ticket
        </h2>
        {cart.length > 0 && (
          <button 
            onClick={clearCart}
            className="text-xs font-inter font-medium text-muted hover:text-error transition-colors flex items-center gap-1"
          >
            <Trash2 size={13} /> Clear Cart
          </button>
        )}
      </div>

      {/* 2 Column Body Layout */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-background">
        
        {/* COLUMN 1: Customer Details & Products */}
        <div className="flex flex-col gap-4">
          
          {/* Customer Details Card */}
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="font-inter text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} className="text-primary" /> Customer Details
              </span>
              {customerFound && (
                <span className="text-[10px] font-inter font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Customer Found
                </span>
              )}
            </div>

            {/* Phone Input with validation */}
            <div className="flex flex-col gap-1">
              <label className="font-inter text-[11px] font-semibold text-muted uppercase">Phone Number *</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={handlePhoneSearch}
                  placeholder="Customer Phone (e.g. 0771234567)"
                  className={`w-full bg-background border ${phone.length > 0 && !isPhoneValid ? 'border-red-500' : 'border-border'} rounded-lg pl-9 pr-3 py-2 text-sm font-inter text-foreground focus:outline-none focus:ring-1 focus:ring-accent`}
                />
              </div>
              {phone.length > 0 && !isPhoneValid ? (
                <span className="text-red-500 text-[11px] font-inter pl-1">
                  Phone number must start with 0 and be 10 digits (e.g., 0712345678)
                </span>
              ) : (
                <span className="text-stone-400 text-[10px] font-inter pl-1">Format: 0712345678 (10 digits starting with 0)</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Full Name *"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm font-inter text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Address Line 1 *"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm font-inter text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Address Line 2"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-inter text-foreground focus:outline-none focus:border-accent"
                />
                <input 
                  type="text"
                  value={addressLine3}
                  onChange={(e) => setAddressLine3(e.target.value)}
                  placeholder="Address Line 3"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-inter text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              {/* District & City */}
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={district} 
                  onChange={e => {
                    const d = e.target.value;
                    setDistrict(d);
                    setCity("");
                  }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-inter text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="">Select District *</option>
                  {slAddress.getDistricts().map((d: string) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select 
                  value={city} 
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-inter text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="">Select City *</option>
                  {(district ? slAddress.getCitiesByDistrict(district) : []).map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Nearest City (For Courier) */}
              <div className="flex flex-col gap-1">
                <label className="font-inter text-[11px] font-semibold text-muted uppercase">
                  Nearest City (For Courier) <span className="text-accent">*</span>
                </label>
                <select 
                  value={nearestCity} 
                  onChange={e => setNearestCity(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-inter text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="">Select nearest city</option>
                  {allFardarCities.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 flex-1 shadow-sm min-h-[220px]">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="font-inter text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-primary" /> Products ({cart.reduce((a, b) => a + b.qty, 0)})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 max-h-[260px] pr-1">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted gap-2 py-8 opacity-60">
                  <ShoppingBag size={28} className="stroke-1" />
                  <p className="font-inter text-xs">Select products to dispatch</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-background border border-border rounded-lg p-2.5 relative group hover:border-accent/40 transition-all">
                    <div className="flex flex-col flex-1 pr-2 min-w-0">
                      <span className="font-inter font-semibold text-xs text-foreground truncate">{item.name}</span>
                      <span className="font-inter text-[11px] font-medium text-muted mt-0.5">
                        Rs. {Number(typeof item.price === 'string' ? item.price.replace(/,/g, "") : item.price).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-surface border border-border rounded-md px-1.5 py-0.5">
                        <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 font-bold text-muted flex items-center justify-center hover:text-foreground text-xs">-</button>
                        <span className="font-inter font-bold text-xs w-4 text-center text-foreground">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 font-bold text-muted flex items-center justify-center hover:text-foreground text-xs">+</button>
                      </div>
                      <span className="font-inter font-bold text-xs text-foreground min-w-[65px] text-right">
                        Rs. {(Number(typeof item.price === 'string' ? item.price.replace(/,/g, "") : item.price) * item.qty).toLocaleString()}
                      </span>
                      <button onClick={() => updateQty(item.id, -item.qty)} className="text-muted hover:text-error transition-colors p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* COLUMN 2: Logistics, Payment & Confirm */}
        <div className="flex flex-col gap-4">
          
          {/* Logistics Card */}
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm">
            <label className="font-inter text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Truck size={14} className="text-primary" /> Logistics
            </label>
            <div className="grid grid-cols-2 gap-2 bg-background p-1 rounded-lg border border-border">
              <button 
                onClick={() => setDeliveryMethod("Fardar")}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-inter font-semibold rounded-md transition-all ${deliveryMethod === 'Fardar' ? 'bg-surface text-foreground shadow-sm border border-border font-bold' : 'text-muted hover:text-foreground'}`}
              >
                <Truck size={15}/> Fardar (3PL)
              </button>
              <button 
                onClick={() => setDeliveryMethod("Pickup")}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-inter font-semibold rounded-md transition-all ${deliveryMethod === 'Pickup' ? 'bg-surface text-foreground shadow-sm border border-border font-bold' : 'text-muted hover:text-foreground'}`}
              >
                <MapPin size={15}/> Store Pickup
              </button>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm">
            <label className="font-inter text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={14} className="text-primary" /> Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setPaymentMethod("COD")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 border rounded-xl text-xs font-inter font-semibold transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary-soft text-primary font-bold shadow-sm' : 'border-border bg-background text-muted hover:border-accent'}`}
              >
                <Banknote size={18}/> COD
              </button>
              <button 
                onClick={() => setPaymentMethod("Transfer")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 border rounded-xl text-xs font-inter font-semibold transition-all ${paymentMethod === 'Transfer' ? 'border-primary bg-primary-soft text-primary font-bold shadow-sm' : 'border-border bg-background text-muted hover:border-accent'}`}
              >
                <CreditCard size={18}/> Transfer
              </button>
              <button 
                onClick={() => setPaymentMethod("Link")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 border rounded-xl text-xs font-inter font-semibold transition-all ${paymentMethod === 'Link' ? 'border-primary bg-primary-soft text-primary font-bold shadow-sm' : 'border-border bg-background text-muted hover:border-accent'}`}
              >
                <LinkIcon size={18}/> Send Link
              </button>
            </div>
          </div>

          {/* Totals & Confirm Button Card */}
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-4 shadow-sm flex-1 justify-between">
            <div className="flex flex-col gap-2 font-inter text-sm">
              <div className="flex justify-between text-muted text-xs">
                <span>Subtotal</span>
                <span className="text-foreground font-semibold">Rs. {subtotal.toLocaleString()}</span>
              </div>
              {deliveryMethod === "Fardar" && (
                <div className="flex justify-between text-muted text-xs">
                  <span>Shipping (Fardar Express)</span>
                  <span className="text-foreground font-semibold">Rs. {deliveryFee.toLocaleString()}</span>
                </div>
              )}
              <div className="w-full h-px bg-border my-1"></div>
              <div className="flex justify-between items-end">
                <span className="text-base font-bold text-foreground">Total</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-muted">Rs.</span>
                  <span className="text-2xl font-bold text-foreground tracking-tight">{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleDispatch}
              disabled={isDispatching || cart.length === 0 || !isPhoneValid || !customerName || !addressLine1 || !city || (deliveryMethod === "Fardar" && !nearestCity)}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl py-3.5 transition-all font-inter font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
            >
              {isDispatching ? "Processing..." : paymentMethod === "Link" ? "Send Link & Hold Order" : "Confirm & Dispatch"}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
