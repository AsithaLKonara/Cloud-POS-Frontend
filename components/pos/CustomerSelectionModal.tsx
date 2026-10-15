"use client";

import { X, Search, UserPlus, Phone, User, Loader2, Building2, Car, CreditCard, DollarSign, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import { useDebounce } from "@/hooks/useDebounce";
import { useSettleCustomerCredit } from "@/hooks/usePos";
import { toast } from "@/store/toast.store";

interface CustomerSelectionModalProps {
  onClose: () => void;
  onSelect?: (customer: any) => void;
  activeSessionId?: string;
}

export default function CustomerSelectionModal({ onClose, onSelect, activeSessionId }: CustomerSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isCreating, setIsCreating] = useState(false);
  const [settlingCustomer, setSettlingCustomer] = useState<any>(null);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementMethod, setSettlementMethod] = useState("CASH");

  const { data: customersResponse, isLoading, refetch } = useCustomers({ search: debouncedSearchQuery, limit: 15 });
  const customers = customersResponse?.data || [];

  const createCustomerMutation = useCreateCustomer();
  const settleCreditMutation = useSettleCustomerCredit();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<any>({
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      phone: "",
      email: "",
      customerType: "GARAGE_WORKSHOP",
      vehicleNumber: "",
      creditLimit: "50000",
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName || null,
        phone: data.phone,
        email: data.email || null,
        customerType: data.customerType || "RETAIL",
        vehicleNumber: data.vehicleNumber || null,
        creditLimit: parseFloat(data.creditLimit) || 0,
        isGuest: false,
      };

      const newCustomer = await createCustomerMutation.mutateAsync(payload);
      toast.success("Customer / Workshop account registered");
      if (onSelect) onSelect(newCustomer.data || newCustomer);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to create customer");
    }
  };

  const handleSettleDebt = async () => {
    if (!settlingCustomer) return;
    const amount = parseFloat(settlementAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid settlement amount");
      return;
    }

    try {
      await settleCreditMutation.mutateAsync({
        customerId: settlingCustomer.id,
        data: {
          amount,
          paymentMethod: settlementMethod,
          sessionId: activeSessionId,
          notes: `POS Debt settlement for ${settlingCustomer.companyName || settlingCustomer.name}`
        }
      });
      toast.success(`Settled Rs. ${amount.toLocaleString()} against customer balance`);
      setSettlingCustomer(null);
      setSettlementAmount("");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to process settlement");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-[560px] h-[640px] bg-background shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-surface shrink-0">
          <div>
            <h3 className="font-inter font-bold text-base text-foreground">
              {settlingCustomer ? 'Settle Outstanding Debt' : isCreating ? 'Register Workshop / Customer' : 'Select Workshop / Customer'}
            </h3>
            <p className="font-inter text-xs text-muted mt-0.5">
              {settlingCustomer 
                ? `${settlingCustomer.companyName || settlingCustomer.name} (Balance: Rs. ${(settlingCustomer.creditBalance || 0).toLocaleString()})`
                : 'Link sales to customer accounts for credit tracking & invoice history'}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-muted hover:text-foreground hover:bg-background rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. SETTLE DEBT VIEW */}
        {settlingCustomer ? (
          <div className="flex flex-col h-full overflow-hidden p-6 justify-between">
            <div className="flex flex-col gap-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Current Outstanding Debt</span>
                  <p className="font-inter text-xs text-muted mt-0.5">
                    {settlingCustomer.phone} {settlingCustomer.vehicleNumber ? `• Reg: ${settlingCustomer.vehicleNumber}` : ''}
                  </p>
                </div>
                <span className="font-mono font-black text-2xl text-amber-900">
                  Rs. {(settlingCustomer.creditBalance || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-bold text-xs text-foreground">Settlement Payment Amount (Rs.)</label>
                <div className="flex items-center border border-border rounded-xl px-4 py-3 bg-surface focus-within:border-primary">
                  <span className="font-mono text-muted text-base mr-2">Rs.</span>
                  <input
                    type="number"
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent font-mono font-bold text-xl text-foreground outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setSettlementAmount(settlingCustomer.creditBalance?.toString() || "0")}
                    className="px-2.5 py-1 text-xs bg-background border border-border rounded-lg font-semibold hover:border-primary text-foreground"
                  >
                    Full Balance
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-bold text-xs text-foreground">Payment Received As</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CASH', 'CARD', 'BANK_TRANSFER'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSettlementMethod(m)}
                      className={`py-2.5 rounded-xl border text-xs font-bold font-inter transition-all ${
                        settlementMethod === m 
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm' 
                          : 'border-border bg-surface text-foreground hover:bg-background'
                      }`}
                    >
                      {m === 'CASH' ? 'Cash in Drawer' : m === 'CARD' ? 'Card Slip' : 'Bank Deposit'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setSettlingCustomer(null)}
                className="flex-1 py-3 bg-surface border border-border hover:bg-background rounded-xl font-inter font-semibold text-sm text-foreground"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSettleDebt}
                disabled={settleCreditMutation.isPending}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-inter font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {settleCreditMutation.isPending ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </div>
        ) : !isCreating ? (
          /* 2. SEARCH & SELECT LIST VIEW */
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-border bg-surface shrink-0">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text" 
                  placeholder="Search workshop name, phone, plate #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 font-inter text-sm text-foreground focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {isLoading ? (
                <div className="flex justify-center items-center h-full text-muted">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted p-4 text-center">
                  <p className="font-inter text-sm">No customers or garages found.</p>
                  <p className="font-inter text-xs text-muted mt-1">Register a new customer using the button below.</p>
                </div>
              ) : (
                customers.map((c: any) => {
                  const hasDebt = (c.creditBalance || 0) > 0;
                  const isWorkshop = c.customerType === 'GARAGE_WORKSHOP' || c.customerType === 'COMMERCIAL_FLEET';

                  return (
                    <div 
                      key={c.id}
                      className="w-full flex items-center justify-between p-3.5 bg-surface hover:bg-background border border-border hover:border-primary/40 rounded-xl transition-all group"
                    >
                      <button 
                        type="button"
                        onClick={() => {
                          if (onSelect) onSelect(c);
                          onClose();
                        }}
                        className="flex-1 flex items-start gap-3 text-left"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                          isWorkshop ? 'bg-amber-500/10 text-amber-700' : 'bg-primary-soft text-primary'
                        }`}>
                          {isWorkshop ? <Building2 size={20} /> : <User size={20} />}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-inter font-bold text-sm text-foreground">
                              {c.companyName || c.name}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              c.customerType === 'GARAGE_WORKSHOP' ? 'bg-amber-100 text-amber-800' :
                              c.customerType === 'COMMERCIAL_FLEET' ? 'bg-blue-100 text-blue-800' :
                              'bg-stone-100 text-stone-700'
                            }`}>
                              {c.customerType || "RETAIL"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-inter text-xs text-muted mt-0.5">
                            <span>{c.phone}</span>
                            {c.vehicleNumber && <span>• Plate: {c.vehicleNumber}</span>}
                          </div>
                          {hasDebt && (
                            <span className="font-mono text-xs font-bold text-red-600 mt-1">
                              Owes: Rs. {c.creditBalance.toLocaleString()} {c.creditLimit > 0 ? `(Limit: Rs. ${c.creditLimit.toLocaleString()})` : ''}
                            </span>
                          )}
                        </div>
                      </button>

                      {hasDebt && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettlingCustomer(c);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-800 border border-amber-500/30 hover:bg-amber-500/20 transition-colors shrink-0 ml-2"
                        >
                          Settle Debt
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-border bg-surface shrink-0">
              <button 
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full py-2.5 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-inter font-bold text-sm transition-all shadow-sm"
              >
                <UserPlus size={16} />
                Register New Workshop / Customer
              </button>
            </div>
          </div>
        ) : (
          /* 3. CREATE NEW CUSTOMER FORM */
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-bold text-xs text-foreground">Account Classification</label>
                <select {...register("customerType")} className="input">
                  <option value="GARAGE_WORKSHOP">🔧 Garage / Auto Repair Workshop</option>
                  <option value="COMMERCIAL_FLEET">🚛 Commercial Vehicle Fleet</option>
                  <option value="RETAIL">🚗 Individual Retail Driver</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-bold text-xs text-foreground">Company / Workshop Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Pitstop Auto Care"
                    {...register("companyName")}
                    className="input" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-bold text-xs text-foreground">Vehicle Reg / Plate #</label>
                  <input 
                    type="text" 
                    placeholder="e.g. CAB-4821"
                    {...register("vehicleNumber")}
                    className="input uppercase font-mono" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-bold text-xs text-foreground">Contact Person First Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sunil"
                    {...register("firstName")}
                    className="input" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-bold text-xs text-foreground">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Perera"
                    {...register("lastName")}
                    className="input" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-bold text-xs text-foreground">Phone Number <span className="text-red-500">*</span></label>
                  <input 
                    type="tel"
                    placeholder="07XXXXXXXX"
                    {...register("phone", { required: "Phone number is required" })}
                    className="input font-mono"
                  />
                  {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message as string}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-bold text-xs text-foreground">Approved Credit Limit (Rs.)</label>
                  <input 
                    type="number" 
                    placeholder="50000"
                    {...register("creditLimit")}
                    className="input font-mono font-bold" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-bold text-xs text-foreground">Email Address (Optional)</label>
                <input 
                  type="email" 
                  placeholder="workshop@example.com"
                  {...register("email")}
                  className="input" 
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-border bg-surface shrink-0 flex gap-3">
              <button 
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  reset();
                }}
                className="flex-1 py-3 flex items-center justify-center bg-background border border-border hover:bg-surface text-foreground rounded-xl font-inter font-semibold text-sm transition-colors"
              >
                Back to Search
              </button>
              <button 
                type="submit"
                disabled={createCustomerMutation.isPending}
                className="flex-1 py-3 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-inter font-bold text-sm transition-colors shadow-md disabled:opacity-50"
              >
                {createCustomerMutation.isPending ? "Registering..." : "Save & Select"}
              </button>
            </div>
          </form>
        )}

      </div>

      <style jsx>{`
        .input {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0.65rem 0.85rem;
          font-family: var(--font-inter);
          font-size: 0.875rem;
          color: var(--foreground);
          outline: none;
          width: 100%;
        }
        .input:focus {
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
