"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileText,
  DollarSign,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Layers,
  ArrowUpDown,
  X,
  PlusCircle,
  Trash2
} from "lucide-react";
import { erpService, ChartOfAccount, JournalEntry, TrialBalance, BalanceSheet } from "@/services/erp.service";
import { globalDialog } from "@/store/dialog.store";
import { toast } from "@/store/toast.store";

export default function GeneralLedgerPage() {
  const [activeTab, setActiveTab] = useState<'journals' | 'trialBalance' | 'balanceSheet' | 'accounts'>('journals');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("ALL");
  const [journalPage, setJournalPage] = useState(1);
  const journalPageSize = 25;

  // Journal Entry Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jeDescription, setJeDescription] = useState("");
  const [jeReference, setJeReference] = useState("");
  const [jeDate, setJeDate] = useState(new Date().toISOString().split('T')[0]);
  const [jeLines, setJeLines] = useState<Array<{ accountCode: string; debit: number; credit: number; description: string }>>([
    { accountCode: "", debit: 0, credit: 0, description: "" },
    { accountCode: "", debit: 0, credit: 0, description: "" }
  ]);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [tbRes, bsRes, accountsRes, journalsRes] = await Promise.all([
        erpService.getTrialBalance().catch(() => null),
        erpService.getBalanceSheet().catch(() => null),
        erpService.getChartOfAccounts().catch(() => []),
        erpService.getJournalEntries({ limit: 50 }).catch(() => ({ entries: [] }))
      ]);

      setTrialBalance(tbRes);
      setBalanceSheet(bsRes);
      setAccounts(accountsRes || []);
      setJournalEntries(journalsRes?.entries || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to load General Ledger data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInitAccounts = async () => {
    try {
      setRefreshing(true);
      await erpService.initChartOfAccounts();
      toast.success("Chart of Accounts initialized successfully!");
      await loadData(true);
    } catch (err: any) {
      globalDialog.alert("Failed to initialize Chart of Accounts: " + err.message, "Initialization Error", { variant: "danger" });
      setRefreshing(false);
    }
  };

  const toggleExpandEntry = (id: string) => {
    setExpandedEntries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Real-time journal entry balance calculation
  const { totalDebit, totalCredit, isJournalBalanced } = useMemo(() => {
    const d = jeLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const c = jeLines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    const roundedD = Math.round(d * 100) / 100;
    const roundedC = Math.round(c * 100) / 100;
    return {
      totalDebit: roundedD,
      totalCredit: roundedC,
      isJournalBalanced: Math.abs(roundedD - roundedC) < 0.01 && roundedD > 0
    };
  }, [jeLines]);

  const handleAddJeLine = () => {
    setJeLines(prev => [...prev, { accountCode: "", debit: 0, credit: 0, description: "" }]);
  };

  const handleRemoveJeLine = (idx: number) => {
    if (jeLines.length <= 2) return;
    setJeLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateJeLine = (idx: number, field: string, val: any) => {
    setJeLines(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handlePostJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJournalBalanced) {
      globalDialog.alert(
        "Journal Entry is not balanced. Total Debits must equal Total Credits before posting.",
        "Unbalanced Journal Entry",
        { variant: "warning" }
      );
      return;
    }

    try {
      setSubmitting(true);
      await erpService.postJournalEntry({
        date: jeDate,
        reference: jeReference || undefined,
        description: jeDescription,
        lines: jeLines.map(l => ({
          accountCode: l.accountCode,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description || undefined
        }))
      });

      toast.success("Journal entry posted successfully!");
      setIsModalOpen(false);
      setJeDescription("");
      setJeReference("");
      setJeLines([
        { accountCode: "", debit: 0, credit: 0, description: "" },
        { accountCode: "", debit: 0, credit: 0, description: "" }
      ]);
      await loadData(true);
    } catch (err: any) {
      globalDialog.alert("Error posting journal entry: " + (err.response?.data?.error || err.message), "Posting Error", { variant: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered accounts for display
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch = acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = accountTypeFilter === "ALL" || acc.type === accountTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, accountTypeFilter]);

  // Filtered journals for display
  const filteredJournals = useMemo(() => {
    return journalEntries.filter(j => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        j.entryNumber.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        (j.reference && j.reference.toLowerCase().includes(q))
      );
    });
  }, [journalEntries, searchQuery]);

  useEffect(() => {
    setJournalPage(1);
  }, [searchQuery]);

  const totalJournalPages = Math.ceil(filteredJournals.length / journalPageSize) || 1;
  const paginatedJournals = useMemo(() => {
    const start = (journalPage - 1) * journalPageSize;
    return filteredJournals.slice(start, start + journalPageSize);
  }, [filteredJournals, journalPage]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              General Ledger & Financial Accounting
            </h1>
            {trialBalance && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                trialBalance.isBalanced
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
              }`}>
                {trialBalance.isBalanced ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                {trialBalance.isBalanced ? "GL Balanced" : "Variance Flagged"}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Canonical double-entry bookkeeping, trial balance verification, and formal balance sheet
          </p>
        </div>

        <div className="flex items-center gap-2">
          {accounts.length === 0 && (
            <button
              onClick={handleInitAccounts}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <Layers size={14} />
              <span>Init Default Accounts</span>
            </button>
          )}

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-border text-foreground rounded-xl text-xs font-medium transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>New Journal Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Total Assets</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground mt-2">
            Rs. {(balanceSheet?.assets?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-muted mt-1">Cash, Bank, AR & Stock Asset</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Total Liabilities</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Scale size={15} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground mt-2">
            Rs. {(balanceSheet?.liabilities?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-muted mt-1">Accounts Payable & Sales Tax</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Owner's Equity</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <BookOpen size={15} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground mt-2">
            Rs. {(balanceSheet?.equity?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-muted mt-1">Capital & Retained Earnings</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Net Operating Income</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className={`text-lg sm:text-xl font-bold mt-2 ${
            (balanceSheet?.equity?.netIncome || 0) >= 0 ? "text-emerald-500" : "text-red-500"
          }`}>
            Rs. {(balanceSheet?.equity?.netIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-muted mt-1">Revenues minus Expenses</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('journals')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'journals'
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <FileText size={15} />
          <span>Journal Entries ({journalEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trialBalance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'trialBalance'
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Scale size={15} />
          <span>Trial Balance</span>
        </button>

        <button
          onClick={() => setActiveTab('balanceSheet')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'balanceSheet'
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <BookOpen size={15} />
          <span>Balance Sheet</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'accounts'
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Layers size={15} />
          <span>Chart of Accounts ({accounts.length})</span>
        </button>
      </div>

      {/* Tab 1: Journal Entries */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search entry number, description, or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-background/80 border-b border-border text-muted font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-8"></th>
                    <th className="py-3 px-4">Entry Number</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Lines</th>
                    <th className="py-3 px-4 text-right">Debit / Credit</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedJournals.map((je) => {
                    const isExpanded = expandedEntries[je.id];
                    const entryTotal = (je.lines || []).reduce((s, l) => s + (l.debit || 0), 0);

                    return (
                      <React.Fragment key={je.id}>
                        <tr
                          onClick={() => toggleExpandEntry(je.id)}
                          className="hover:bg-background/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 text-muted">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-amber-600 dark:text-amber-400">
                            {je.entryNumber}
                          </td>
                          <td className="py-3 px-4 text-muted">
                            {new Date(je.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-muted">
                            {je.reference || "-"}
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground max-w-xs truncate">
                            {je.description}
                          </td>
                          <td className="py-3 px-4 text-center text-muted">
                            {je.lines?.length || 0}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                            Rs. {entryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              {je.status}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Lines */}
                        {isExpanded && (
                          <tr className="bg-background/30">
                            <td colSpan={8} className="p-3">
                              <div className="bg-surface border border-border rounded-xl p-3 shadow-inner">
                                <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                                  Journal Lines Breakdown
                                </h4>
                                <table className="w-full text-xs">
                                  <thead className="text-muted border-b border-border/50 text-[11px]">
                                    <tr>
                                      <th className="py-1.5 px-3 text-left">Account</th>
                                      <th className="py-1.5 px-3 text-left">Line Memo</th>
                                      <th className="py-1.5 px-3 text-right">Debit (Rs.)</th>
                                      <th className="py-1.5 px-3 text-right">Credit (Rs.)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/30">
                                    {je.lines?.map((line, lIdx) => (
                                      <tr key={lIdx}>
                                        <td className="py-2 px-3 font-medium">
                                          <span className="font-mono text-amber-500 mr-2">{line.account?.code || line.accountCode}</span>
                                          <span>{line.account?.name || "Account"}</span>
                                        </td>
                                        <td className="py-2 px-3 text-muted">{line.description || "-"}</td>
                                        <td className="py-2 px-3 text-right font-mono font-medium">
                                          {line.debit > 0 ? `Rs. ${line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono font-medium">
                                          {line.credit > 0 ? `Rs. ${line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {filteredJournals.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted">
                        No journal entries found. Click <strong>"New Journal Entry"</strong> to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredJournals.length > journalPageSize && (
              <div className="flex items-center justify-between p-3.5 border-t border-border bg-background/30 text-xs text-muted">
                <span>
                  Showing {(journalPage - 1) * journalPageSize + 1} - {Math.min(journalPage * journalPageSize, filteredJournals.length)} of {filteredJournals.length} entries
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setJournalPage(prev => Math.max(1, prev - 1))}
                    disabled={journalPage === 1}
                    className="px-2.5 py-1 bg-surface border border-border rounded-lg disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    ‹ Prev
                  </button>
                  <span className="px-2 font-semibold text-foreground">
                    Page {journalPage} of {totalJournalPages}
                  </span>
                  <button
                    onClick={() => setJournalPage(prev => Math.min(totalJournalPages, prev + 1))}
                    disabled={journalPage >= totalJournalPages}
                    className="px-2.5 py-1 bg-surface border border-border rounded-lg disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Trial Balance */}
      {activeTab === 'trialBalance' && trialBalance && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-background/50 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground">Trial Balance Sheet</h3>
              <p className="text-xs text-muted">As of {new Date(trialBalance.asOfDate).toLocaleString()}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              trialBalance.isBalanced
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}>
              {trialBalance.isBalanced ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              <span>{trialBalance.isBalanced ? "Equilibrium Verified (Debits = Credits)" : "Unbalanced"}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/80 border-b border-border text-muted font-semibold">
                <tr>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Total Debit (Rs.)</th>
                  <th className="py-3 px-4 text-right">Total Credit (Rs.)</th>
                  <th className="py-3 px-4 text-right">Net Balance (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trialBalance.accounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-background/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{acc.code}</td>
                    <td className="py-2.5 px-4 font-medium text-foreground">{acc.name}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {acc.debit > 0 ? `Rs. ${acc.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {acc.credit > 0 ? `Rs. ${acc.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                      Rs. {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-background font-bold border-t-2 border-border text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase text-muted tracking-wider">
                    Grand Totals:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-500">
                    Rs. {trialBalance.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-500">
                    Rs. {trialBalance.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {trialBalance.isBalanced ? "BALANCED" : "DISCREPANCY"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Balance Sheet */}
      {activeTab === 'balanceSheet' && balanceSheet && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assets Section */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-500" />
                <span>Assets</span>
              </h3>
              <span className="font-mono font-bold text-base text-emerald-500">
                Rs. {balanceSheet.assets.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2">
              {balanceSheet.assets.accounts.map(acc => (
                <div key={acc.code} className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
                  <div>
                    <span className="font-mono text-amber-500 mr-2">{acc.code}</span>
                    <span className="text-foreground font-medium">{acc.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    Rs. {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Liabilities & Equity Section */}
          <div className="space-y-6">
            {/* Liabilities */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Scale size={18} className="text-amber-500" />
                  <span>Liabilities</span>
                </h3>
                <span className="font-mono font-bold text-base text-amber-500">
                  Rs. {balanceSheet.liabilities.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-2">
                {balanceSheet.liabilities.accounts.map(acc => (
                  <div key={acc.code} className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
                    <div>
                      <span className="font-mono text-amber-500 mr-2">{acc.code}</span>
                      <span className="text-foreground font-medium">{acc.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-foreground">
                      Rs. {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equity */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-500" />
                  <span>Equity & Earnings</span>
                </h3>
                <span className="font-mono font-bold text-base text-blue-500">
                  Rs. {balanceSheet.equity.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-2">
                {balanceSheet.equity.accounts.map(acc => (
                  <div key={acc.code} className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
                    <div>
                      <span className="font-mono text-amber-500 mr-2">{acc.code}</span>
                      <span className="text-foreground font-medium">{acc.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-foreground">
                      Rs. {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between py-1.5 border-t border-border font-bold text-xs pt-2">
                  <span className="text-purple-500">Net Operating Income (P&L)</span>
                  <span className="font-mono text-purple-500">
                    Rs. {balanceSheet.equity.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Chart of Accounts */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search account by code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              {['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((t) => (
                <button
                  key={t}
                  onClick={() => setAccountTypeFilter(t)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    accountTypeFilter === t
                      ? "bg-amber-500 text-white"
                      : "bg-surface border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/80 border-b border-border text-muted font-semibold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4 text-center">System Account</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-background/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{acc.code}</td>
                    <td className="py-2.5 px-4 font-medium text-foreground">{acc.name}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-muted">{acc.currency}</td>
                    <td className="py-2.5 px-4 text-center">
                      {acc.isSystem && (
                        <span className="text-[10px] text-muted font-medium bg-surface border border-border px-2 py-0.5 rounded-full">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-[10px] font-semibold text-emerald-500">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Journal Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Post Manual Journal Entry</h3>
                <p className="text-xs text-muted">Standard double-entry balanced transaction</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-muted hover:text-foreground rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostJournalEntry} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-muted">Description / Memo *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monthly rent adjustment, Owner capital injection"
                    value={jeDescription}
                    onChange={(e) => setJeDescription(e.target.value)}
                    className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">Reference #</label>
                  <input
                    type="text"
                    placeholder="e.g. REF-2026-001"
                    value={jeReference}
                    onChange={(e) => setJeReference(e.target.value)}
                    className="w-full bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Lines Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted">Transaction Lines (Min. 2)</label>
                  <button
                    type="button"
                    onClick={handleAddJeLine}
                    className="flex items-center gap-1 text-[11px] text-amber-500 hover:text-amber-600 font-semibold"
                  >
                    <PlusCircle size={13} />
                    <span>Add Line</span>
                  </button>
                </div>

                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-background/80 text-muted font-semibold border-b border-border">
                      <tr>
                        <th className="py-2 px-3">Account *</th>
                        <th className="py-2 px-3">Line Memo</th>
                        <th className="py-2 px-3 w-28 text-right">Debit (Rs.)</th>
                        <th className="py-2 px-3 w-28 text-right">Credit (Rs.)</th>
                        <th className="py-2 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {jeLines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              required
                              value={line.accountCode}
                              onChange={(e) => handleUpdateJeLine(idx, 'accountCode', e.target.value)}
                              className="w-full bg-background border border-border focus:border-amber-500 rounded-lg p-1.5 text-xs text-foreground focus:outline-none"
                            >
                              <option value="">Select Account...</option>
                              {accounts.map(acc => (
                                <option key={acc.code} value={acc.code}>
                                  {acc.code} - {acc.name} ({acc.type})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Memo"
                              value={line.description}
                              onChange={(e) => handleUpdateJeLine(idx, 'description', e.target.value)}
                              className="w-full bg-background border border-border focus:border-amber-500 rounded-lg p-1.5 text-xs text-foreground focus:outline-none"
                            >
                            </input>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={line.debit || ""}
                              onChange={(e) => handleUpdateJeLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                              className="w-full bg-background border border-border focus:border-amber-500 rounded-lg p-1.5 text-xs text-foreground font-mono text-right focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={line.credit || ""}
                              onChange={(e) => handleUpdateJeLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                              className="w-full bg-background border border-border focus:border-amber-500 rounded-lg p-1.5 text-xs text-foreground font-mono text-right focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {jeLines.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveJeLine(idx)}
                                className="text-muted hover:text-red-500"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-background border-t border-border font-mono font-bold text-xs">
                      <tr>
                        <td colSpan={2} className="py-2 px-3 text-right text-muted font-sans font-semibold">
                          Totals:
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-500">
                          Rs. {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-500">
                          Rs. {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Equilibrium status banner */}
                <div className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold border ${
                  isJournalBalanced
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}>
                  <div className="flex items-center gap-1.5">
                    {isJournalBalanced ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    <span>{isJournalBalanced ? "Balanced: Debits equal Credits" : "Unbalanced Entry"}</span>
                  </div>
                  <span className="font-mono">
                    Diff: Rs. {Math.abs(totalDebit - totalCredit).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted hover:text-foreground text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isJournalBalanced || submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                >
                  {submitting ? "Posting..." : "Post to Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

