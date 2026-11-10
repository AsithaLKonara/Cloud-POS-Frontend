"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  Barcode,
  Calendar,
  User,
  Phone,
  FileText,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Building2,
  RefreshCw,
  Check,
} from "lucide-react";
import { warrantyService } from "@/services/warranty.service";
import { globalDialog } from "@/store/dialog.store";

export default function CustomerWarrantyPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Claim Form State
  const [isClaimFormOpen, setIsClaimFormOpen] = useState(false);
  const [claimName, setClaimName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimIssue, setClaimIssue] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<any>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setResult(null);
    setIsClaimFormOpen(false);
    setSubmittedClaim(null);

    try {
      const q = searchQuery.trim();
      const data = await warrantyService.checkWarrantyStatus({
        serialNumber: q,
        imei: q,
        orderNumber: q,
      });

      if (data && (data.found || data.lookupType || data.product)) {
        setResult(data);
        if (data.customer?.name) setClaimName(data.customer.name);
        if (data.customer?.phone) setClaimPhone(data.customer.phone);
      } else {
        setResult({ notFound: true });
      }
    } catch (err: any) {
      console.error("Warranty search error:", err);
      setResult({ notFound: true, message: err?.message || "Search failed" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLodgeClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimName.trim() || !claimPhone.trim() || !claimIssue.trim()) {
      globalDialog.alert("Please provide your name, phone number, and description of the defect.", "Incomplete Information");
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const claim = await warrantyService.createClaim({
        serialNumber: result?.serialNumber || searchQuery.trim(),
        productVariantId: result?.product?.variantId || result?.productVariant?.id,
        customerName: claimName.trim(),
        customerPhone: claimPhone.trim(),
        issueDescription: claimIssue.trim(),
        isCovered: result?.isValidWarranty ?? true,
      });

      setSubmittedClaim(claim);
      setIsClaimFormOpen(false);
    } catch (err: any) {
      globalDialog.alert(err?.response?.data?.message || err?.message || "Failed to submit warranty claim", "Error", { variant: "danger" });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      
      {/* Hero Header Strip */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-wider text-foreground">XONIT CARE</span>
              <span className="text-[10px] text-muted block -mt-0.5">Warranty & Service Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-muted">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Merchant Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16 space-y-8">
        
        {/* Hero Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <Sparkles size={14} />
            <span>Digital Warranty Authentication & RMA Service</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Check Your Product Warranty
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-lg mx-auto">
            Verify official manufacturer coverage, check remaining protection days, or lodge an online repair claim in seconds.
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="bg-surface border border-border rounded-2xl p-3 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Barcode size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                data-testid="customer-warranty-search-input"
                placeholder="Enter Serial Number (e.g. SN-WARR-...), IMEI, or Order #"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-foreground font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
              />
            </div>
            <button
              type="submit"
              data-testid="customer-warranty-search-btn"
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-inter font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSearching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              <span>Verify Warranty</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted px-2 pt-1">
            <HelpCircle size={13} />
            <span>Where to find serial? Check product barcode label or bottom plate of your hardware device.</span>
          </div>
        </form>

        {/* Search Result Display */}
        {hasSearched && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {result?.notFound ? (
              /* Not Found Card */
              <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-base font-bold text-foreground">No Warranty Record Found</h3>
                <p className="text-xs text-muted max-w-md mx-auto">
                  We could not find an active registered serial matching "{searchQuery}". Please verify the characters on your physical label or receipt.
                </p>
              </div>
            ) : result && (
              /* Verified Certificate Card */
              <div className="bg-surface border-2 border-primary/40 rounded-2xl overflow-hidden shadow-2xl">
                
                {/* Certificate Top Banner */}
                <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400">
                        OFFICIAL VERIFIED CERTIFICATE
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-foreground">
                        {result.product?.name || result.productVariant?.product?.name || "Genuine Hardware"}
                      </h2>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between">
                    <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase ${
                      result.isValidWarranty
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "bg-amber-500 text-slate-950 font-bold"
                    }`}>
                      {result.isValidWarranty ? "Active Protection" : "Warranty Expired"}
                    </span>
                    <span className="text-[11px] font-mono text-muted mt-1">
                      {result.daysRemaining > 0 ? `${result.daysRemaining} Days Left` : "Coverage Ended"}
                    </span>
                  </div>
                </div>

                {/* Dossier Specs */}
                <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-inter border-b border-border bg-surface-elevated/20">
                  <div className="space-y-0.5">
                    <span className="text-muted block text-[11px]">Serial Number</span>
                    <span className="font-mono font-bold text-foreground">{result.serialNumber || searchQuery}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted block text-[11px]">Warranty Period</span>
                    <span className="font-bold text-foreground">{result.warrantyPeriodMonths || 12} Months</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted block text-[11px]">Expiry Date</span>
                    <span className="font-mono font-bold text-foreground">
                      {result.warrantyExpiresAt ? new Date(result.warrantyExpiresAt).toLocaleDateString() : "Active"}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted block text-[11px]">Policy Type</span>
                    <span className="font-medium text-foreground truncate block">
                      {result.warrantyPolicy || "Comprehensive Hardware"}
                    </span>
                  </div>
                </div>

                {/* Call to Action: Lodge Claim */}
                <div className="p-6 bg-surface flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Experiencing Hardware Defects or Issues?</h4>
                    <p className="text-xs text-muted">
                      Lodge an official repair request directly to our authorized workshop technicians.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsClaimFormOpen(true)}
                    data-testid="open-customer-claim-btn"
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center gap-2 shrink-0"
                  >
                    <Wrench size={16} />
                    <span>Lodge Repair Claim</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Claim Lodgment Form */}
        {isClaimFormOpen && (
          <form
            onSubmit={handleLodgeClaim}
            data-testid="customer-lodge-claim-form"
            className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xl space-y-5 animate-in fade-in duration-200"
          >
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Wrench size={20} className="text-primary" />
                  <span>Lodge Authorized Warranty Repair Request</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Device: {result?.product?.name || result?.productVariant?.product?.name} (S/N: {result?.serialNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimFormOpen(false)}
                className="text-xs font-bold text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-foreground">Your Full Name *</label>
                <input
                  type="text"
                  required
                  data-testid="customer-claim-name"
                  placeholder="e.g. Kasun Jayawardena"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-foreground">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  data-testid="customer-claim-phone"
                  placeholder="e.g. 0771234567"
                  value={claimPhone}
                  onChange={(e) => setClaimPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-foreground">
                Describe the Defect / Malfunction in Detail *
              </label>
              <textarea
                rows={3}
                required
                data-testid="customer-claim-issue"
                placeholder="Please describe what happens (e.g. will not power on, vertical colored line on screen, strange buzzing noise)..."
                value={claimIssue}
                onChange={(e) => setClaimIssue(e.target.value)}
                className="w-full p-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                data-testid="customer-submit-claim-btn"
                disabled={isSubmittingClaim}
                className="px-6 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-inter font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center gap-2"
              >
                {isSubmittingClaim ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>Submit Service Claim</span>
              </button>
            </div>
          </form>
        )}

        {/* Claim Submitted Success Dossier */}
        {submittedClaim && (
          <div
            data-testid="customer-claim-success"
            className="bg-surface border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  CLAIM TICKET OPENED
                </span>
                <h3 className="text-xl font-black text-foreground">
                  Service Request #{submittedClaim.claimNumber}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Your warranty repair request has been logged into our central workshop queue. A customer service representative has been notified and our technicians will begin intake diagnostics.
            </p>

            <div className="p-4 rounded-xl bg-surface-elevated border border-border text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-muted">Claim Reference:</span>
                <span className="font-bold text-primary">{submittedClaim.claimNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Serial Number:</span>
                <span className="text-foreground">{submittedClaim.serialNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Initial Status:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold uppercase">{submittedClaim.status}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted space-y-1">
              <strong className="text-foreground block">Next Steps:</strong>
              <p>• Drop off the item at any of our authorized branch outlets.</p>
              <p>• Provide ticket <strong>#{submittedClaim.claimNumber}</strong> to the counter cashier.</p>
              <p>• Track repair updates anytime by searching your ticket # or serial on this portal.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

