"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Wrench,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Barcode,
  AlertCircle,
  FileText,
  User,
  Phone,
  Calendar,
  X,
  Check,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react";
import { warrantyService, WarrantyKPIs, WarrantyClaim, ProductSerialItem } from "@/services/warranty.service";
import { globalDialog } from "@/store/dialog.store";
import { useAuthStore } from "@/store/auth.store";

export default function WarrantyConsoleClient() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"CLAIMS" | "SERIALS">("CLAIMS");
  const [kpis, setKpis] = useState<WarrantyKPIs | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(true);

  // Claims State
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [claimsSearch, setClaimsSearch] = useState("");
  const [claimsStatusFilter, setClaimsStatusFilter] = useState<string>("ALL");
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsTotal, setClaimsTotal] = useState(0);

  // Serials State
  const [serials, setSerials] = useState<ProductSerialItem[]>([]);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [serialsSearch, setSerialsSearch] = useState("");
  const [serialsStatusFilter, setSerialsStatusFilter] = useState<string>("ALL");
  const [serialsPage, setSerialsPage] = useState(1);
  const [serialsTotal, setSerialsTotal] = useState(0);

  // Modals
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);
  const [isRegisterSerialModalOpen, setIsRegisterSerialModalOpen] = useState(false);

  // New Claim Form State
  const [lookupQuery, setLookupQuery] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [claimFormData, setClaimFormData] = useState({
    productVariantId: "",
    serialNumber: "",
    imei: "",
    customerId: "",
    orderId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    issueDescription: "",
    reportedDefect: "",
    physicalCondition: "Good - Minor normal wear",
  });
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Register Serial Form State
  const [registerFormData, setRegisterFormData] = useState({
    variantId: "",
    serialNumber: "",
    imei: "",
    warrantyMonths: 12,
  });
  const [isRegisteringSerial, setIsRegisteringSerial] = useState(false);

  // Load KPIs
  const loadKPIs = useCallback(async () => {
    try {
      setLoadingKpis(true);
      const data = await warrantyService.getKPIs();
      setKpis(data);
    } catch (err) {
      console.error("Failed to load warranty KPIs:", err);
    } finally {
      setLoadingKpis(false);
    }
  }, []);

  // Load Claims
  const loadClaims = useCallback(async () => {
    try {
      setLoadingClaims(true);
      const res = await warrantyService.getClaims({
        page: claimsPage,
        limit: 15,
        search: claimsSearch || undefined,
        status: claimsStatusFilter === "ALL" ? undefined : claimsStatusFilter,
      });
      setClaims(res.claims || []);
      setClaimsTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoadingClaims(false);
    }
  }, [claimsPage, claimsSearch, claimsStatusFilter]);

  // Load Serials
  const loadSerials = useCallback(async () => {
    try {
      setLoadingSerials(true);
      const res = await warrantyService.getSerials({
        page: serialsPage,
        limit: 20,
        search: serialsSearch || undefined,
        status: serialsStatusFilter === "ALL" ? undefined : serialsStatusFilter,
      });
      setSerials(res.serials || []);
      setSerialsTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load serials:", err);
    } finally {
      setLoadingSerials(false);
    }
  }, [serialsPage, serialsSearch, serialsStatusFilter]);

  useEffect(() => {
    loadKPIs();
  }, [loadKPIs]);

  useEffect(() => {
    if (activeTab === "CLAIMS") {
      loadClaims();
    } else {
      loadSerials();
    }
  }, [activeTab, loadClaims, loadSerials]);

  // Handle Serial / Order Lookup for New Claim
  const handlePerformLookup = async () => {
    if (!lookupQuery.trim()) return;
    setIsLookingUp(true);
    setLookupResult(null);
    try {
      const q = lookupQuery.trim();
      const res = await warrantyService.checkWarrantyStatus({
        serialNumber: q,
        imei: q,
        orderNumber: q,
      });

      if (res && (res.found || res.lookupType || res.product)) {
        const variantId = res.product?.variantId || res.productVariant?.id || res.variantId;
        const productName = res.product?.name || res.productVariant?.product?.name;
        const isCovered = res.isValidWarranty ?? (res.status === 'ACTIVE' || res.isCovered);

        setLookupResult({
          ...res,
          isCovered,
          productVariant: {
            id: variantId,
            name: res.product?.variantName || res.productVariant?.name || 'Default',
            product: {
              name: productName,
              warrantyPeriodMonths: res.warrantyPeriodMonths,
              warrantyPolicy: res.warrantyPolicy,
            },
          },
        });

        setClaimFormData((prev) => ({
          ...prev,
          productVariantId: variantId || prev.productVariantId,
          serialNumber: res.serialNumber || q,
          imei: res.imei || prev.imei,
          customerId: res.customer?.id || prev.customerId,
          orderId: res.order?.id || prev.orderId,
          customerName: res.customer?.name || prev.customerName,
          customerPhone: res.customer?.phone || prev.customerPhone,
          customerEmail: res.customer?.email || prev.customerEmail,
        }));
      } else {
        setLookupResult({ notFound: true });
      }
    } catch (err: any) {
      console.error("Lookup error:", err);
      setLookupResult({ notFound: true, message: err?.message || "Item not found" });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Submit New Warranty Claim
  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimFormData.productVariantId && !claimFormData.serialNumber) {
      globalDialog.alert("Please provide a product or look up a registered serial number.", "Missing Product");
      return;
    }
    if (!claimFormData.issueDescription) {
      globalDialog.alert("Please describe the customer reported issue.", "Missing Issue Description");
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const created = await warrantyService.createClaim({
        ...claimFormData,
        isCovered: lookupResult?.isCovered ?? true,
      });

      setIsNewClaimModalOpen(false);
      router.push(`/admin/warranty/${created.id}`);
      setClaimFormData({
        productVariantId: "",
        serialNumber: "",
        imei: "",
        customerId: "",
        orderId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        issueDescription: "",
        reportedDefect: "",
        physicalCondition: "Good - Minor normal wear",
      });
      setLookupResult(null);
      setLookupQuery("");
      loadKPIs();
      loadClaims();
    } catch (err: any) {
      globalDialog.alert(err?.response?.data?.message || err?.message || "Failed to create claim", "Error", { variant: "danger" });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Received</span>;
      case "IN_DIAGNOSIS":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">In Diagnosis</span>;
      case "SENT_TO_VENDOR":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Sent to Vendor</span>;
      case "REPAIRED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Repaired</span>;
      case "REPLACED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">Unit Replaced</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Rejected (Out of Policy)</span>;
      case "CLOSED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">Closed & Handed Off</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-surface border border-border text-foreground">{status}</span>;
    }
  };

  const getSerialStatusBadge = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">In Stock</span>;
      case "SOLD":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Sold (Active Warranty)</span>;
      case "UNDER_WARRANTY":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Under RMA / Repair</span>;
      case "REPLACED":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Unit Replaced</span>;
      case "DEFECTIVE":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Defective / Scrapped</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-surface border border-border">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Warranty & RMA Service Console
              </h1>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Track serial numbers, manage customer warranty claims, diagnostic job sheets & RMA workflows
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            data-testid="open-new-claim-modal"
            onClick={() => setIsNewClaimModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-inter font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>New Warranty Claim</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Serials */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted">
            <span className="font-inter text-xs font-semibold uppercase tracking-wider">Active Warranties</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black font-mono text-foreground">
              {loadingKpis ? "..." : (kpis?.activeSerials || 0).toLocaleString()}
            </span>
            <span className="text-xs text-muted block mt-1">Serials activated & valid</span>
          </div>
        </div>

        {/* Open Claims */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted">
            <span className="font-inter text-xs font-semibold uppercase tracking-wider">Open RMA Claims</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wrench size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
              {loadingKpis ? "..." : (kpis?.openClaims || 0).toLocaleString()}
            </span>
            <span className="text-xs text-muted block mt-1">In diagnostics or repair</span>
          </div>
        </div>

        {/* Resolved This Month */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted">
            <span className="font-inter text-xs font-semibold uppercase tracking-wider">Resolved This Month</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black font-mono text-foreground">
              {loadingKpis ? "..." : (kpis?.resolvedMonth || 0).toLocaleString()}
            </span>
            <span className="text-xs text-muted block mt-1">Repaired or replaced</span>
          </div>
        </div>

        {/* Avg Turnaround Time */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted">
            <span className="font-inter text-xs font-semibold uppercase tracking-wider">Avg Turnaround Time</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black font-mono text-foreground">
              {loadingKpis ? "..." : `${kpis?.avgTatDays || 0}d`}
            </span>
            <span className="text-xs text-muted block mt-1">Receipt to customer return</span>
          </div>
        </div>
      </div>

      {/* Main Tabbed Console */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border px-6 pt-4 bg-surface-elevated/30">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab("CLAIMS")}
              className={`pb-4 font-inter text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "CLAIMS"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <Wrench size={16} />
              <span>Warranty & RMA Claims</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-primary/10 text-primary">
                {claimsTotal}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("SERIALS")}
              className={`pb-4 font-inter text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "SERIALS"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <Barcode size={16} />
              <span>Tracked Serials Directory</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-surface-elevated text-muted">
                {serialsTotal}
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              if (activeTab === "CLAIMS") loadClaims();
              else loadSerials();
              loadKPIs();
            }}
            title="Refresh Data"
            className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-xl transition-colors mb-3"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* CLAIMS TAB */}
        {activeTab === "CLAIMS" && (
          <div className="p-6 space-y-5">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  data-testid="warranty-search-input"
                  placeholder="Search Claim #, Serial #, Customer..."
                  value={claimsSearch}
                  onChange={(e) => setClaimsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Status Pill Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {["ALL", "RECEIVED", "IN_DIAGNOSIS", "SENT_TO_VENDOR", "REPAIRED", "REPLACED", "CLOSED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setClaimsStatusFilter(st);
                      setClaimsPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      claimsStatusFilter === st
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {st === "ALL" ? "All" : st.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Claims Table */}
            <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm font-inter">
                <thead>
                  <tr className="bg-surface-elevated/60 border-b border-border text-muted font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Claim #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Product & Serial</th>
                    <th className="py-3 px-4">Defect / Issue</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Received Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingClaims ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted">
                        <RefreshCw size={20} className="animate-spin inline mr-2 text-primary" />
                        Loading warranty claims...
                      </td>
                    </tr>
                  ) : claims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted">
                        No warranty claims found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    claims.map((cl) => (
                      <tr key={cl.id} className="hover:bg-surface-elevated/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                          <Link href={`/admin/warranty/${cl.id}`} className="hover:text-primary transition-colors flex items-center gap-1.5">
                            <span>{cl.claimNumber}</span>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{cl.customer?.name || "Walk-in Guest"}</span>
                            <span className="text-[11px] text-muted">{cl.customer?.phone || "No phone"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col max-w-[220px]">
                            <span className="font-semibold text-foreground truncate">{cl.productVariant?.product?.name || cl.productVariant?.name || "Product"}</span>
                            <span className="text-[11px] font-mono text-muted">
                              {cl.serialNumber ? `S/N: ${cl.serialNumber}` : "No S/N attached"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-xs text-muted line-clamp-1 max-w-[240px]">
                            {cl.issueDescription}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(cl.status)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted whitespace-nowrap">
                          {new Date(cl.receivedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/warranty/${cl.id}`}
                            data-testid={`view-claim-${cl.claimNumber}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground hover:border-primary hover:text-primary text-xs font-bold transition-all shadow-sm"
                          >
                            <span>Job Sheet</span>
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERIALS TAB */}
        {activeTab === "SERIALS" && (
          <div className="p-6 space-y-5">
            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search Serial Number, IMEI, SKU..."
                  value={serialsSearch}
                  onChange={(e) => setSerialsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {["ALL", "IN_STOCK", "SOLD", "UNDER_WARRANTY", "REPLACED", "DEFECTIVE"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setSerialsStatusFilter(st);
                      setSerialsPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      serialsStatusFilter === st
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {st === "ALL" ? "All" : st.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Serials Table */}
            <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm font-inter">
                <thead>
                  <tr className="bg-surface-elevated/60 border-b border-border text-muted font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">IMEI</th>
                    <th className="py-3 px-4">Product Variant</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Warranty Period</th>
                    <th className="py-3 px-4">Expires At</th>
                    <th className="py-3 px-4">Customer / Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingSerials ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted">
                        <RefreshCw size={20} className="animate-spin inline mr-2 text-primary" />
                        Loading tracked serials...
                      </td>
                    </tr>
                  ) : serials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted">
                        No serial numbers registered yet.
                      </td>
                    </tr>
                  ) : (
                    serials.map((s) => {
                      const isExpired = s.warrantyExpiresAt ? new Date(s.warrantyExpiresAt) < new Date() : false;
                      return (
                        <tr key={s.id} className="hover:bg-surface-elevated/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                            {s.serialNumber}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted text-xs">
                            {s.imei || "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col max-w-[200px]">
                              <span className="font-semibold text-foreground truncate">{s.productVariant?.product?.name || s.productVariant?.name || "Product"}</span>
                              <span className="text-[11px] text-muted">{s.productVariant?.sku || ""}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {getSerialStatusBadge(s.status)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-xs">
                            {s.warrantyMonths} Months
                          </td>
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                            {s.warrantyExpiresAt ? (
                              <span className={isExpired ? "text-rose-500 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                                {new Date(s.warrantyExpiresAt).toLocaleDateString()} {isExpired ? "(Expired)" : "(Active)"}
                              </span>
                            ) : (
                              <span className="text-muted">Not Activated</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            {s.orderItem?.order ? (
                              <div className="flex flex-col">
                                <span className="font-mono font-semibold text-foreground">{s.orderItem.order.orderNumber}</span>
                                <span className="text-muted text-[11px]">{s.orderItem.order.customer?.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* NEW CLAIM MODAL */}
      {isNewClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-6 border-b border-border bg-surface-elevated flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Wrench size={20} />
                </div>
                <div>
                  <h2 className="font-inter font-bold text-lg text-foreground">Open Warranty Claim / RMA Ticket</h2>
                  <p className="text-xs text-muted">Verify warranty coverage and generate an official service job sheet</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewClaimModalOpen(false)}
                className="p-1.5 text-muted hover:text-foreground rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateClaim} className="p-6 space-y-5">
              
              {/* Lookup Card */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border/80 space-y-3">
                <label className="block text-xs font-bold text-foreground">
                  Step 1: Fast Lookup by Serial #, IMEI, or Order #
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder="e.g. SN-WARR-2026-..., IMEI, or POS-..."
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    data-testid="claim-lookup-btn"
                    onClick={handlePerformLookup}
                    disabled={isLookingUp || !lookupQuery.trim()}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {isLookingUp ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Lookup</span>
                  </button>
                </div>

                {/* Lookup Result Box */}
                {lookupResult && (
                  <div className={`p-3.5 rounded-xl border text-xs ${
                    lookupResult.notFound
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                      : lookupResult.isCovered
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
                  }`}>
                    {lookupResult.notFound ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>No serial record found for "{lookupQuery}". You may fill in the details manually below.</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5 text-sm">
                            <CheckCircle2 size={16} />
                            {lookupResult.productVariant?.product?.name} ({lookupResult.productVariant?.name})
                          </span>
                          <span className="px-2 py-0.5 rounded font-mono uppercase text-[10px] bg-surface border">
                            {lookupResult.isCovered ? "🛡️ Under Active Warranty" : "⚠️ Out of Warranty"}
                          </span>
                        </div>
                        <div className="text-[11px] grid grid-cols-2 gap-2 pt-1 border-t border-border/40 font-mono">
                          <div>S/N: {lookupResult.serialNumber || "N/A"}</div>
                          <div>Days Left: {lookupResult.remainingDays ?? "N/A"}</div>
                          <div>Customer: {lookupResult.customer?.name || "Unregistered"}</div>
                          <div>Order: {lookupResult.order?.orderNumber || "Direct"}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Customer & Device Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Step 2: Customer & Device Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Customer Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kasun Perera"
                      value={claimFormData.customerName}
                      onChange={(e) => setClaimFormData({ ...claimFormData, customerName: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Customer Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 0771234567"
                      value={claimFormData.customerPhone}
                      onChange={(e) => setClaimFormData({ ...claimFormData, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Serial Number</label>
                    <input
                      type="text"
                      placeholder="Product Serial #"
                      value={claimFormData.serialNumber}
                      onChange={(e) => setClaimFormData({ ...claimFormData, serialNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Physical Condition on Intake</label>
                    <input
                      type="text"
                      placeholder="e.g. Mint, Screen intact, Minor corner dent"
                      value={claimFormData.physicalCondition}
                      onChange={(e) => setClaimFormData({ ...claimFormData, physicalCondition: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1 text-xs">
                    Customer Reported Defect / Symptom
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. No display output after 15 mins, intermittent audio buzz"
                    value={claimFormData.reportedDefect}
                    onChange={(e) => setClaimFormData({ ...claimFormData, reportedDefect: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1 text-xs">
                    Intake Issue & Detailed Diagnostics Request *
                  </label>
                  <textarea
                    rows={3}
                    data-testid="claim-issue-input"
                    required
                    placeholder="Describe the defect reported by customer and any initial technician observations..."
                    value={claimFormData.issueDescription}
                    onChange={(e) => setClaimFormData({ ...claimFormData, issueDescription: e.target.value })}
                    className="w-full p-3 bg-surface border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground border border-border hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-new-claim-btn"
                  disabled={isSubmittingClaim}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition-all shadow-md flex items-center gap-1.5"
                >
                  {isSubmittingClaim ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>Open Warranty Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
