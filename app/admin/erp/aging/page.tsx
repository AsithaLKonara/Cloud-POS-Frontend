"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Building2,
  Users,
  Search,
  RefreshCw,
  Plus,
  AlertCircle,
  Calendar,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  TrendingDown,
  X,
  Clock,
  AlertTriangle,
  MessageSquare
} from "lucide-react";
import { erpService, AgingBucket } from "@/services/erp.service";
import { globalDialog } from "@/store/dialog.store";
import { toast } from "@/store/toast.store";

export default function ApArAgingPage() {
  const [mode, setMode] = useState<'AR' | 'AP'>('AR'); // AR = Customers, AP = Suppliers
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agingData, setAgingData] = useState<AgingBucket | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [bucketFilter, setBucketFilter] = useState("ALL");

  // Payment Settlement Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE'>('CASH');
  const [paymentRef, setPaymentRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Create Bill / Invoice Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [partyName, setPartyName] = useState("");
  const [docAmount, setDocAmount] = useState<number>(0);
  const [docDueDate, setDocDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [submittingDoc, setSubmittingDoc] = useState(false);

  // WhatsApp Dunning Reminders
  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const [sentWaIds, setSentWaIds] = useState<string[]>([]);

  const handleSendWhatsAppReminder = async (item: any) => {
    try {
      setSendingWaId(item.id);
      const res = await erpService.sendWhatsAppArReminder(item.id);
      setSentWaIds(prev => [...prev, item.id]);
      toast.success(res.message || `WhatsApp payment reminder sent for #${item.invoiceNumber}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message || "Failed to dispatch WhatsApp reminder");
    } finally {
      setSendingWaId(null);
    }
  };

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (mode === 'AR') {
        const ar = await erpService.getArAgingReport();
        setAgingData(ar);
      } else {
        const ap = await erpService.getApAgingReport();
        setAgingData(ap);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to load aging data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mode]);

  const rawRecords = useMemo(() => {
    if (!agingData) return [];
    return mode === 'AR' ? (agingData.invoices || []) : (agingData.bills || []);
  }, [agingData, mode]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return rawRecords.filter((rec: any) => {
      const q = searchQuery.toLowerCase();
      const numMatch = (rec.invoiceNumber || rec.billNumber || "").toLowerCase().includes(q);
      const nameMatch = (rec.customerName || rec.supplierName || "").toLowerCase().includes(q);
      const matchesSearch = numMatch || nameMatch;

      if (!matchesSearch) return false;

      if (bucketFilter === 'CURRENT') return rec.overdueDays <= 0;
      if (bucketFilter === '1_30') return rec.overdueDays > 0 && rec.overdueDays <= 30;
      if (bucketFilter === '31_60') return rec.overdueDays > 30 && rec.overdueDays <= 60;
      if (bucketFilter === '61_90') return rec.overdueDays > 60 && rec.overdueDays <= 90;
      if (bucketFilter === '90_PLUS') return rec.overdueDays > 90;

      return true;
    });
  }, [rawRecords, searchQuery, bucketFilter]);

  const openPaymentModal = (record: any) => {
    setSelectedRecord(record);
    setPaymentAmount(record.balanceDue || 0);
    setPaymentMethod('CASH');
    setPaymentRef("");
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || paymentAmount <= 0) return;

    try {
      setSubmittingPayment(true);
      if (mode === 'AR') {
        await erpService.recordCustomerPayment({
          invoiceId: selectedRecord.id,
          amount: Number(paymentAmount),
          paymentMethod: paymentMethod as any,
          reference: paymentRef || undefined
        });
      } else {
        await erpService.recordVendorPayment({
          billId: selectedRecord.id,
          amount: Number(paymentAmount),
          paymentMethod: paymentMethod as any,
          reference: paymentRef || undefined
        });
      }
      setPaymentModalOpen(false);
      toast.success("Payment recorded successfully!");
      await loadData(true);
    } catch (err: any) {
      globalDialog.alert("Payment recording failed: " + (err.response?.data?.error || err.message), "Payment Failed", { variant: "danger" });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || docAmount <= 0) return;

    try {
      setSubmittingDoc(true);
      if (mode === 'AR') {
        await erpService.createSalesInvoice({
          customerName: partyName,
          subtotal: Number(docAmount),
          dueDate: docDueDate,
          invoiceType: 'COMMERCIAL'
        });
      } else {
        await erpService.createVendorBill({
          vendorName: partyName,
          subtotal: Number(docAmount),
          dueDate: docDueDate
        });
      }
      setCreateModalOpen(false);
      setPartyName("");
      setDocAmount(0);
      toast.success("Record created successfully!");
      await loadData(true);
    } catch (err: any) {
      globalDialog.alert("Failed to create record: " + (err.response?.data?.error || err.message), "Creation Failed", { variant: "danger" });
    } finally {
      setSubmittingDoc(false);
    }
  };

  const totalOutstanding = agingData?.totalDue || 0;
  const currentAmt = agingData?.current || 0;
  const days1_30Amt = agingData?.days1_30 || 0;
  const days31_60Amt = agingData?.days31_60 || 0;
  const days61_90Amt = agingData?.days61_90 || 0;
  const days90PlusAmt = agingData?.days90_plus || 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {mode === 'AR' ? "Accounts Receivable (AR) Aging" : "Accounts Payable (AP) Aging"}
            </h1>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              {mode === 'AR' ? "Customer Debts" : "Supplier Liabilities"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time aging breakdown across Current, 30, 60, 90, and 90+ days arrears with double-entry settlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-surface border border-border p-1 rounded-xl flex items-center">
            <button
              onClick={() => setMode('AR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'AR'
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Users size={14} />
              <span>Receivables (AR)</span>
            </button>
            <button
              onClick={() => setMode('AP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'AP'
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Building2 size={14} />
              <span>Payables (AP)</span>
            </button>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-border text-foreground rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>{mode === 'AR' ? "New Invoice" : "New Vendor Bill"}</span>
          </button>
        </div>
      </div>

      {/* Aging KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-muted uppercase">Total Outstanding</div>
          <div className="text-base sm:text-lg font-bold text-foreground mt-1.5">
            Rs. {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-muted mt-1">{rawRecords.length} open documents</div>
        </div>

        <div className="bg-surface border border-emerald-500/20 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Current (Not Due)</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-foreground mt-1.5">
            Rs. {currentAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-muted mt-1">Within terms</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-500 uppercase flex items-center gap-1">
            <Clock size={12} />
            <span>1 - 30 Days</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-foreground mt-1.5">
            Rs. {days1_30Amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-muted mt-1">First reminder</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-orange-500 uppercase flex items-center gap-1">
            <Clock size={12} />
            <span>31 - 60 Days</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-foreground mt-1.5">
            Rs. {days31_60Amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-muted mt-1">Past due</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-500 uppercase flex items-center gap-1">
            <AlertTriangle size={12} />
            <span>61 - 90 Days</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-foreground mt-1.5">
            Rs. {days61_90Amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-muted mt-1">High arrears</div>
        </div>

        <div className="bg-surface border border-red-500/30 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-red-500 uppercase flex items-center gap-1">
            <AlertCircle size={12} />
            <span>90+ Days</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-red-500 mt-1.5">
            Rs. {days90PlusAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-red-400 mt-1">Critical default</div>
        </div>
      </div>

      {/* Visual Aging Distribution Bar */}
      {totalOutstanding > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>Portfolio Aging Distribution</span>
            <span>100% Total Debt</span>
          </div>
          <div className="h-3 w-full bg-background rounded-full overflow-hidden flex">
            {currentAmt > 0 && (
              <div
                style={{ width: `${(currentAmt / totalOutstanding) * 100}%` }}
                className="bg-emerald-500 transition-all"
                title={`Current: Rs. ${currentAmt.toLocaleString()}`}
              />
            )}
            {days1_30Amt > 0 && (
              <div
                style={{ width: `${(days1_30Amt / totalOutstanding) * 100}%` }}
                className="bg-amber-400 transition-all"
                title={`1-30 Days: Rs. ${days1_30Amt.toLocaleString()}`}
              />
            )}
            {days31_60Amt > 0 && (
              <div
                style={{ width: `${(days31_60Amt / totalOutstanding) * 100}%` }}
                className="bg-orange-500 transition-all"
                title={`31-60 Days: Rs. ${days31_60Amt.toLocaleString()}`}
              />
            )}
            {days61_90Amt > 0 && (
              <div
                style={{ width: `${(days61_90Amt / totalOutstanding) * 100}%` }}
                className="bg-rose-500 transition-all"
                title={`61-90 Days: Rs. ${days61_90Amt.toLocaleString()}`}
              />
            )}
            {days90PlusAmt > 0 && (
              <div
                style={{ width: `${(days90PlusAmt / totalOutstanding) * 100}%` }}
                className="bg-red-600 transition-all"
                title={`90+ Days: Rs. ${days90PlusAmt.toLocaleString()}`}
              />
            )}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted flex-wrap pt-1">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Current</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 1-30 Days</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> 31-60 Days</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 61-90 Days</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> 90+ Days</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={mode === 'AR' ? "Search invoice # or customer..." : "Search bill # or supplier..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Open' },
            { id: 'CURRENT', label: 'Current' },
            { id: '1_30', label: '1 - 30d' },
            { id: '31_60', label: '31 - 60d' },
            { id: '61_90', label: '61 - 90d' },
            { id: '90_PLUS', label: '90+d' }
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => setBucketFilter(b.id)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                bucketFilter === b.id
                  ? "bg-amber-500 text-white"
                  : "bg-surface border border-border text-muted hover:text-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aging Detail Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/80 border-b border-border text-muted font-semibold">
              <tr>
                <th className="py-3 px-4">{mode === 'AR' ? "Invoice #" : "Bill #"}</th>
                <th className="py-3 px-4">{mode === 'AR' ? "Customer" : "Supplier"}</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Overdue Days</th>
                <th className="py-3 px-4 text-right">Total (Rs.)</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.map((item: any) => {
                const docNum = item.invoiceNumber || item.billNumber;
                const party = item.customerName || item.supplierName || (mode === 'AR' ? "Customer" : "Supplier");
                const overdue = item.overdueDays || 0;

                return (
                  <tr key={item.id} className="hover:bg-background/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {docNum}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {party}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {overdue <= 0 ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Current
                        </span>
                      ) : overdue <= 30 ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {overdue}d overdue
                        </span>
                      ) : overdue <= 60 ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                          {overdue}d overdue
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                          {overdue}d overdue
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      Rs. {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted">
                      Rs. {item.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      Rs. {item.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {mode === 'AR' && (
                          <button
                            type="button"
                            data-testid={`send-wa-aging-${item.id}`}
                            onClick={() => handleSendWhatsAppReminder(item)}
                            disabled={sendingWaId === item.id}
                            title="Send WhatsApp Payment Reminder with LankaQR"
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <MessageSquare size={12} className={sendingWaId === item.id ? "animate-spin" : ""} />
                            <span>{sendingWaId === item.id ? "Sending..." : sentWaIds.includes(item.id) ? "Sent ✓" : "Remind"}</span>
                          </button>
                        )}
                        <button
                          onClick={() => openPaymentModal(item)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-sm"
                        >
                          {mode === 'AR' ? "Collect" : "Pay Bill"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted">
                    No open {mode === 'AR' ? "invoices" : "vendor bills"} matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Payment Settlement */}
      {paymentModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {mode === 'AR' ? "Record Customer Receipt" : "Record Vendor Settlement"}
                </h3>
                <p className="text-xs text-muted">
                  {selectedRecord.invoiceNumber || selectedRecord.billNumber} • Balance Due: Rs. {selectedRecord.balanceDue.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 text-muted hover:text-foreground rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Settlement Amount (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedRecord.balanceDue}
                  required
                  value={paymentAmount || ""}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Payment Tender / Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="CASH">Cash (Account 1010 POS Till)</option>
                  <option value="BANK_TRANSFER">Bank Transfer (Account 1020 Operating Bank)</option>
                  {mode === 'AR' ? (
                    <option value="CARD">Credit / Debit Card</option>
                  ) : (
                    <option value="CHEQUE">Cheque Issue</option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Reference / Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-998822 or CHQ-00124"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none"
                />
              </div>

              <div className="bg-background/80 border border-border p-3 rounded-xl text-xs text-muted space-y-1">
                <div className="flex justify-between">
                  <span>Current Balance Due:</span>
                  <span className="font-mono font-semibold text-foreground">Rs. {selectedRecord.balanceDue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Amount:</span>
                  <span className="font-mono font-semibold text-amber-500">Rs. {(paymentAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-bold">
                  <span>Remaining Balance:</span>
                  <span className="font-mono text-foreground">
                    Rs. {Math.max(0, selectedRecord.balanceDue - (paymentAmount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted hover:text-foreground text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || paymentAmount <= 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  {submittingPayment ? "Recording..." : "Confirm & Post GL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Document */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {mode === 'AR' ? "Create Commercial Sales Invoice" : "Create Vendor Bill"}
                </h3>
                <p className="text-xs text-muted">
                  {mode === 'AR' ? "Records customer credit liability" : "Records supplier debt liability"}
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-muted hover:text-foreground rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">
                  {mode === 'AR' ? "Customer / Debtor Name *" : "Vendor / Supplier Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={mode === 'AR' ? "e.g. Lanka Logistics Ltd" : "e.g. Apex Wholesale Distro"}
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Subtotal Amount (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={docAmount || ""}
                  onChange={(e) => setDocAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Due Date *</label>
                <input
                  type="date"
                  required
                  value={docDueDate}
                  onChange={(e) => setDocDueDate(e.target.value)}
                  className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted hover:text-foreground text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDoc || !partyName || docAmount <= 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  {submittingDoc ? "Creating..." : "Create Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

