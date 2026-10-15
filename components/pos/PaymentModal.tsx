"use client";

import { X, CreditCard, Banknote, Landmark, Building2, AlertTriangle, CheckCircle2, UserPlus, AlertCircle } from "lucide-react";
import { useState } from "react";

interface PaymentModalProps {
  total: string;
  selectedCustomer?: any;
  onOpenCustomerModal?: () => void;
  onClose: () => void;
  onSuccess: (method: string) => void;
}

export default function PaymentModal({ total, selectedCustomer, onOpenCustomerModal, onClose, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState("Cash");
  const [tenderedAmount, setTenderedAmount] = useState("");

  const numTotal = parseFloat(total.replace(/,/g, '')) || 0;
  const numTendered = parseFloat(tenderedAmount.replace(/,/g, '')) || 0;
  const changeDue = Math.max(0, numTendered - numTotal);

  const customerCreditLimit = selectedCustomer?.creditLimit || 0;
  const customerCreditBalance = selectedCustomer?.creditBalance || 0;
  const remainingCredit = customerCreditLimit > 0 ? (customerCreditLimit - customerCreditBalance) : null;
  const isCreditExceeded = customerCreditLimit > 0 && (customerCreditBalance + numTotal > customerCreditLimit);

  const paymentMethods = [
    { id: "Cash", name: "Cash", desc: "Counter Cash Payment", icon: <Banknote size={22} /> },
    { id: "Card", name: "Card / Terminal", desc: "Visa, Mastercard, POS Terminal", icon: <CreditCard size={22} /> },
    { id: "CREDIT_ACCOUNT", name: "Garage / Account Credit", desc: "Charge to Workshop Pay Later", icon: <Building2 size={22} /> },
    { id: "Bank Transfer", name: "Bank Transfer / Deposit", desc: "Direct Bank Slip / Wire", icon: <Landmark size={22} /> },
  ];

  const handleConfirm = () => {
    if (selectedMethod === "CREDIT_ACCOUNT") {
      if (!selectedCustomer) {
        if (onOpenCustomerModal) onOpenCustomerModal();
        return;
      }
    }
    onSuccess(selectedMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-[840px] max-h-[90vh] md:h-[580px] bg-background shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-200">
        
        {/* Left Sidebar - Payment Methods */}
        <div className="w-full md:w-[300px] bg-surface border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-inter font-bold text-base text-foreground">Select Payment Method</h3>
            <p className="text-xs text-muted mt-0.5">Choose settlement tender type</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {paymentMethods.map(method => (
              <button 
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl transition-all border text-left ${
                  selectedMethod === method.id 
                    ? 'border-primary bg-primary-soft/80 shadow-sm ring-1 ring-primary' 
                    : 'border-border hover:border-primary/50 hover:bg-background'
                }`}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5 ${
                  selectedMethod === method.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-surface border border-border text-muted'
                }`}>
                  {method.icon}
                </div>
                <div>
                  <span className={`font-inter font-bold text-sm block ${
                    selectedMethod === method.id ? 'text-primary' : 'text-foreground'
                  }`}>
                    {method.name}
                  </span>
                  <span className="font-inter text-xs text-muted block mt-0.5">
                    {method.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col bg-background relative overflow-y-auto">
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-muted hover:text-foreground hover:bg-surface rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>
          
          <div className="flex-1 p-6 md:p-8 flex flex-col">
            {/* Header / Total Due */}
            <div className="flex flex-col items-center justify-center mb-6">
              <span className="font-inter text-muted text-xs uppercase tracking-widest font-bold mb-1">Total Bill Amount</span>
              <div className="flex items-baseline gap-2">
                <span className="font-inter font-bold text-2xl text-muted">Rs.</span>
                <span className="font-inter font-black text-5xl text-foreground tracking-tight">{total}</span>
              </div>
            </div>

            {/* 1. CASH CONTENT */}
            {selectedMethod === "Cash" && (
              <div className="flex flex-col gap-4 animate-in fade-in flex-1">
                <div className="grid grid-cols-4 gap-2">
                  {['2,000', '5,000', '10,000', 'Exact'].map(amt => (
                    <button 
                      key={amt} 
                      type="button"
                      onClick={() => {
                        if (amt === 'Exact') {
                          setTenderedAmount(numTotal.toString());
                        } else {
                          setTenderedAmount(amt.replace(/,/g, ''));
                        }
                      }}
                      className="py-2.5 bg-surface border border-border rounded-xl font-inter font-bold text-xs text-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      {amt === 'Exact' ? 'Exact Bill' : `Rs. ${amt}`}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-bold text-xs text-muted">Cash Tendered From Customer</label>
                  <div className="flex items-center border border-border rounded-xl px-4 py-3 bg-surface focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                    <span className="font-mono text-muted text-lg mr-2">Rs.</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={tenderedAmount}
                      onChange={(e) => setTenderedAmount(e.target.value)}
                      className="w-full bg-transparent font-mono font-bold text-2xl text-foreground outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                {tenderedAmount && numTendered >= numTotal && (
                  <div className="flex justify-between items-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mt-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <span className="font-inter font-bold text-emerald-800 text-xs uppercase tracking-wide">Change To Return</span>
                    </div>
                    <span className="font-mono font-black text-2xl text-emerald-700">
                      Rs. {changeDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 2. GARAGE & ACCOUNT CREDIT CONTENT */}
            {selectedMethod === "CREDIT_ACCOUNT" && (
              <div className="flex flex-col gap-4 animate-in fade-in flex-1">
                {selectedCustomer ? (
                  <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-inter font-bold text-base text-foreground">
                            {selectedCustomer.companyName || selectedCustomer.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 border border-amber-500/20">
                            {selectedCustomer.customerType || "GARAGE ACCOUNT"}
                          </span>
                        </div>
                        <p className="font-inter text-xs text-muted mt-0.5">
                          {selectedCustomer.phone} {selectedCustomer.vehicleNumber ? `• Reg: ${selectedCustomer.vehicleNumber}` : ''}
                        </p>
                      </div>
                      {onOpenCustomerModal && (
                        <button
                          type="button"
                          onClick={onOpenCustomerModal}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          Change
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-background border border-border rounded-lg">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">Credit Limit</span>
                        <span className="font-mono font-bold text-sm text-foreground">
                          {customerCreditLimit > 0 ? `Rs. ${customerCreditLimit.toLocaleString()}` : "Unlimited"}
                        </span>
                      </div>
                      <div className="p-3 bg-background border border-border rounded-lg">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Current Balance</span>
                        <span className="font-mono font-bold text-sm text-amber-800">
                          Rs. {customerCreditBalance.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 bg-background border border-border rounded-lg">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">Remaining Credit</span>
                        <span className={`font-mono font-bold text-sm ${remainingCredit !== null && remainingCredit < numTotal ? 'text-red-600' : 'text-emerald-700'}`}>
                          {remainingCredit !== null ? `Rs. ${Math.max(0, remainingCredit).toLocaleString()}` : "N/A"}
                        </span>
                      </div>
                    </div>

                    {isCreditExceeded ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2.5">
                        <AlertTriangle size={18} className="text-red-600 shrink-0" />
                        <p className="text-xs text-red-800 font-inter">
                          <strong>Credit Limit Exceeded:</strong> This transaction will exceed the workshop&apos;s approved limit by Rs. {(customerCreditBalance + numTotal - customerCreditLimit).toLocaleString()}.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <p className="text-xs text-emerald-800 font-inter">
                          Approved for credit billing. Total will be added to the customer&apos;s ledger.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
                    <AlertCircle size={32} className="text-amber-700" />
                    <div>
                      <h4 className="font-inter font-bold text-foreground text-sm">No Workshop / Customer Selected</h4>
                      <p className="font-inter text-xs text-muted max-w-sm mt-1">
                        To issue this sale on Credit / Pay Later, you must link it to a registered garage, workshop, or fleet account.
                      </p>
                    </div>
                    {onOpenCustomerModal && (
                      <button
                        type="button"
                        onClick={onOpenCustomerModal}
                        className="mt-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 flex items-center gap-2 shadow-sm"
                      >
                        <UserPlus size={15} /> Select Workshop Customer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. CARD / BANK TRANSFER CONTENT */}
            {(selectedMethod === "Card" || selectedMethod === "Bank Transfer") && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-in fade-in">
                <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center shadow-inner border border-border">
                  {paymentMethods.find(m => m.id === selectedMethod)?.icon}
                </div>
                <h4 className="font-inter font-bold text-lg text-foreground text-center">
                  Awaiting {selectedMethod} Confirmation
                </h4>
                <p className="font-inter text-xs text-muted text-center max-w-[280px] leading-relaxed">
                  {selectedMethod === "Card" 
                    ? "Swipe or tap customer card on the credit/debit card POS terminal."
                    : "Verify direct bank transfer deposit slip before confirming."}
                </p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-3 border border-border hover:bg-surface text-muted hover:text-foreground font-inter font-bold text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirm}
                disabled={selectedMethod === "Cash" && numTendered < numTotal && numTendered !== 0}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-inter font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {selectedMethod === "CREDIT_ACCOUNT" 
                  ? (selectedCustomer ? "Confirm Credit Charge" : "Select Customer First") 
                  : "Complete Transaction"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
