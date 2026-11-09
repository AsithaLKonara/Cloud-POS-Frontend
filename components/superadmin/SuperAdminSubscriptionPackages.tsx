"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Settings,
  Trash2,
  CheckCircle2,
  Building2,
  Users,
  Search,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Eye,
  Check,
  X,
  FileText,
  AlertCircle,
  Archive,
  RotateCcw,
  Tag,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  superAdminService,
  PlanConfig,
  TenantRegistryItem,
  PlatformFinancials,
} from "@/services/superadmin.service";
import { toast } from "@/store/toast.store";
import { globalDialog } from "@/store/dialog.store";

interface SuperAdminSubscriptionPackagesProps {
  tenants: TenantRegistryItem[];
  financials?: PlatformFinancials | null;
  onRefreshData?: () => void;
}

const PRESET_FEATURES = [
  "Modular Universal POS Terminal",
  "80mm/58mm Thermal Receipt Printing",
  "Basic Inventory & Barcodes",
  "Cash & Card Payment Recording",
  "14-Day Full Access Trial",
  "Up to 3 Branches & Multi-Branch Allocations",
  "Inter-Branch Stock Transfers & In-Transit Auditing",
  "Restaurant Dining Tables & KOT Routing",
  "Split Bill Engine (N-Way & By Line Item)",
  "Customer Credit Accounts & Debt Settlement Ledger",
  "Full GAAP Canonical P&L Reporting",
  "LankaQR & Local Fintech Gateways",
  "Unlimited Branches, Outlets & Terminals",
  "Unlimited Staff Roles & Granular Permissions",
  "FEFO / FIFO Batch Lot Tracking & Expiry Alerts",
  "Moving Weighted Average Cost Purchase Orders",
  "Digital Scale RS-232 Continuous Integration",
  "Headless Developer API & Storefront Webhooks",
  "Custom Courier Webhooks (Koombiyo, PromptX, Domex)",
  "24/7 Priority SLA & Dedicated Hardware Engineer",
];

export function SuperAdminSubscriptionPackages({
  tenants,
  financials,
  onRefreshData,
}: SuperAdminSubscriptionPackagesProps) {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "QUARTERLY" | "ANNUAL">("MONTHLY");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formKey, setFormKey] = useState("");
  const [formName, setFormName] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMonthlyLkr, setFormMonthlyLkr] = useState<number>(4500);
  const [formQuarterlyLkr, setFormQuarterlyLkr] = useState<number>(12150);
  const [formAnnualLkr, setFormAnnualLkr] = useState<number>(43200);
  const [autoDiscount, setAutoDiscount] = useState(true);
  const [formMaxBranches, setFormMaxBranches] = useState<number>(1);
  const [isUnlimitedBranches, setIsUnlimitedBranches] = useState(false);
  const [formMaxUsers, setFormMaxUsers] = useState<number>(3);
  const [isUnlimitedUsers, setIsUnlimitedUsers] = useState(false);
  const [formTrialDays, setFormTrialDays] = useState<number>(14);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState("");
  const [formColor, setFormColor] = useState<string>("emerald");
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  // Assign Plan to Tenant Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPlanForAssign, setSelectedPlanForAssign] = useState<PlanConfig | null>(null);
  const [assignTenantId, setAssignTenantId] = useState<string>("");
  const [assignCycle, setAssignCycle] = useState<"MONTHLY" | "QUARTERLY" | "ANNUAL">("MONTHLY");
  const [assignCustomPrice, setAssignCustomPrice] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // Fetch plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getPlans();
      setPlans(data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Recalculate auto-discounts when monthly changes
  const handleMonthlyChange = (val: number) => {
    setFormMonthlyLkr(val);
    if (autoDiscount) {
      setFormQuarterlyLkr(Math.round(val * 3 * 0.9));
      setFormAnnualLkr(Math.round(val * 12 * 0.8));
    }
  };

  // Open modal for Creating
  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setFormKey("");
    setFormName("");
    setFormBadge("");
    setFormDescription("");
    setFormMonthlyLkr(6500);
    setFormQuarterlyLkr(Math.round(6500 * 3 * 0.9));
    setFormAnnualLkr(Math.round(6500 * 12 * 0.8));
    setAutoDiscount(true);
    setFormMaxBranches(2);
    setIsUnlimitedBranches(false);
    setFormMaxUsers(5);
    setIsUnlimitedUsers(false);
    setFormTrialDays(14);
    setFormFeatures([
      "Modular Universal POS Terminal",
      "Thermal Receipt Printing",
      "Basic Inventory & Barcodes",
      "Cash & Card Payment Recording",
    ]);
    setNewFeatureText("");
    setFormColor("emerald");
    setFormIsPopular(false);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (p: PlanConfig) => {
    setEditingPlan(p);
    setFormKey(p.key);
    setFormName(p.name);
    setFormBadge(p.badge || "");
    setFormDescription(p.description || "");
    setFormMonthlyLkr(p.monthlyLkr);
    setFormQuarterlyLkr(p.quarterlyLkr || Math.round(p.monthlyLkr * 3 * 0.9));
    setFormAnnualLkr(p.annualLkr || Math.round(p.monthlyLkr * 12 * 0.8));
    setAutoDiscount(false);
    setFormMaxBranches(p.maxBranches >= 999 ? 100 : p.maxBranches);
    setIsUnlimitedBranches(p.maxBranches >= 999 || p.maxBranches === -1);
    setFormMaxUsers(p.maxUsers >= 999 ? 500 : p.maxUsers);
    setIsUnlimitedUsers(p.maxUsers >= 999 || p.maxUsers === -1);
    setFormTrialDays(p.trialDays || 14);
    setFormFeatures(p.features || []);
    setNewFeatureText("");
    setFormColor(p.color || "emerald");
    setFormIsPopular(Boolean(p.isPopular));
    setFormIsActive(p.isActive !== false);
    setIsModalOpen(true);
  };

  // Feature handling
  const handleAddFeature = () => {
    const text = newFeatureText.trim();
    if (!text) return;
    if (!formFeatures.includes(text)) {
      setFormFeatures([...formFeatures, text]);
    }
    setNewFeatureText("");
  };

  const handleTogglePresetFeature = (f: string) => {
    if (formFeatures.includes(f)) {
      setFormFeatures(formFeatures.filter((item) => item !== f));
    } else {
      setFormFeatures([...formFeatures, f]);
    }
  };

  const handleRemoveFeature = (f: string) => {
    setFormFeatures(formFeatures.filter((item) => item !== f));
  };

  // Form Submit (Create or Update)
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Package name is required");
      return;
    }
    if (!formMonthlyLkr || formMonthlyLkr <= 0) {
      toast.error("Valid positive monthly price is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<PlanConfig> = {
        key: formKey.trim() || formName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_"),
        name: formName.trim(),
        badge: formBadge.trim() || undefined,
        description: formDescription.trim() || undefined,
        monthlyLkr: Number(formMonthlyLkr),
        quarterlyLkr: Number(formQuarterlyLkr),
        annualLkr: Number(formAnnualLkr),
        maxBranches: isUnlimitedBranches ? 999 : Number(formMaxBranches),
        maxUsers: isUnlimitedUsers ? 999 : Number(formMaxUsers),
        trialDays: Number(formTrialDays),
        features: formFeatures,
        color: formColor,
        isPopular: formIsPopular,
        isActive: formIsActive,
      };

      if (editingPlan) {
        await superAdminService.updatePlan(editingPlan.key, payload);
        toast.success(`Package "${payload.name}" updated successfully!`);
      } else {
        await superAdminService.createPlan(payload);
        toast.success(`New package "${payload.name}" created successfully!`);
      }

      setIsModalOpen(false);
      fetchPlans();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to save package");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete / Archive package
  const handleDeletePlan = async (plan: PlanConfig) => {
    const isCore = ["STARTER", "GROWTH", "ENTERPRISE"].includes(plan.key);
    const confirmed = await globalDialog.confirm(
      (plan.subscriberCount || 0) > 0
        ? `This package currently has ${plan.subscriberCount} active subscriber(s). It will be safely archived and hidden from new subscribers while maintaining access for existing tenants.`
        : `Are you sure you want to remove the "${plan.name}" package? This action cannot be undone.`,
      isCore ? `Archive Package: ${plan.name}?` : `Delete Package: ${plan.name}?`,
      {
        confirmText: "Proceed",
        cancelText: "Cancel",
        variant: "danger",
      }
    );

    if (!confirmed) return;

    try {
      const res = await superAdminService.deletePlan(plan.key);
      toast.success(res?.message || "Package operation completed");
      fetchPlans();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to remove package");
    }
  };

  // Toggle Plan Active State
  const handleToggleActive = async (plan: PlanConfig) => {
    try {
      await superAdminService.updatePlan(plan.key, { isActive: !plan.isActive });
      toast.success(`Package "${plan.name}" marked as ${!plan.isActive ? "Active" : "Archived"}`);
      fetchPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to toggle status");
    }
  };

  // Open Assign Modal
  const handleOpenAssignModal = (p: PlanConfig) => {
    setSelectedPlanForAssign(p);
    setAssignTenantId(tenants[0]?.id || "");
    setAssignCycle("MONTHLY");
    setAssignCustomPrice("");
    setIsAssignModalOpen(true);
  };

  // Submit Plan Assignment
  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForAssign || !assignTenantId) {
      toast.error("Please select a target tenant");
      return;
    }

    setAssigning(true);
    try {
      await superAdminService.assignPlanToTenant(assignTenantId, {
        planKey: selectedPlanForAssign.key,
        billingCycle: assignCycle,
        customPriceLkr: assignCustomPrice ? Number(assignCustomPrice) : undefined,
      });

      const tenantName = tenants.find((t) => t.id === assignTenantId)?.name || "Tenant";
      toast.success(`Successfully assigned package "${selectedPlanForAssign.name}" to ${tenantName}!`);
      setIsAssignModalOpen(false);
      fetchPlans();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to assign package");
    } finally {
      setAssigning(false);
    }
  };

  // Filtered plans
  const filteredPlans = plans.filter((p) => {
    if (filterStatus === "ACTIVE" && p.isActive === false) return false;
    if (filterStatus === "ARCHIVED" && p.isActive !== false) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchKey = p.key.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchFeat = p.features?.some((f) => f.toLowerCase().includes(q));
      if (!matchName && !matchKey && !matchDesc && !matchFeat) return false;
    }
    return true;
  });

  // Calculate platform totals
  const totalSubscribers = plans.reduce((sum, p) => sum + (p.subscriberCount || 0), 0);
  const totalMRR = plans.reduce((sum, p) => sum + (p.totalMrrLkr || 0), 0);
  const totalARR = totalMRR * 12;

  const colorVariants: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    blue: {
      border: "border-blue-500/40",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    emerald: {
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    purple: {
      border: "border-purple-500/40",
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
    amber: {
      border: "border-amber-500/40",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    rose: {
      border: "border-rose-500/40",
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    },
    cyan: {
      border: "border-cyan-500/40",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    },
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Analytics Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>SaaS Subscription Tiers & Pricing Packages</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
              Multi-Tenant Engine
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Create, edit, and assign custom subscription tiers, pricing schedules in LKR, feature sets, and resource limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlans}
            className="h-9 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs flex items-center gap-1.5 transition"
            title="Refresh package data"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-amber-400" : ""} />
            <span>Reload</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>Create New Package</span>
          </button>
        </div>
      </div>

      {/* 2. Platform KPIs Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#121417] border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
            Active Packages
            <Layers size={14} className="text-zinc-500" />
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              {plans.filter((p) => p.isActive !== false).length}
            </span>
            <span className="text-[10px] text-zinc-500 ml-1.5 font-mono">
              / {plans.length} total
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121417] border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
            Subscribed Businesses
            <Building2 size={14} className="text-zinc-500" />
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {totalSubscribers}
            </span>
            <span className="text-[10px] text-zinc-500 ml-1.5">tenants</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121417] border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
            Subscription MRR
            <TrendingUp size={14} className="text-emerald-500" />
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              Rs. {totalMRR.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-500 ml-1.5">/ mo</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121417] border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
            Annual Run Rate (ARR)
            <DollarSign size={14} className="text-amber-500" />
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              Rs. {totalARR.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-500 ml-1.5">/ yr</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Billing Cycle Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#121417] border border-zinc-800 p-3 rounded-2xl">
        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex-1 max-w-sm">
            <Search size={14} className="text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search package name, code, or features..."
              className="bg-transparent w-full text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs">
            {(["ALL", "ACTIVE", "ARCHIVED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg font-medium transition text-[11px] ${
                  filterStatus === status
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Billing Cycle Preview Switcher */}
        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 text-xs shrink-0 w-full sm:w-auto justify-center">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-3 py-1 rounded-lg transition text-xs font-medium ${
              billingCycle === "MONTHLY"
                ? "bg-amber-500 text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("QUARTERLY")}
            className={`px-3 py-1 rounded-lg transition text-xs font-medium flex items-center gap-1.5 ${
              billingCycle === "QUARTERLY"
                ? "bg-amber-500 text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Quarterly</span>
            <span className="text-[9px] font-bold px-1 rounded bg-black/20 text-emerald-300">
              -10%
            </span>
          </button>
          <button
            onClick={() => setBillingCycle("ANNUAL")}
            className={`px-3 py-1 rounded-lg transition text-xs font-medium flex items-center gap-1.5 ${
              billingCycle === "ANNUAL"
                ? "bg-amber-500 text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Annual</span>
            <span className="text-[9px] font-bold px-1 rounded bg-black/20 text-emerald-300">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* 4. Packages Interactive Grid */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 text-xs">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-500" />
          Loading SaaS subscription tiers & pricing packages...
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="py-16 text-center bg-[#121417] border border-dashed border-zinc-800 rounded-2xl p-6">
          <CreditCard size={32} className="mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-300">No packages match your search filter</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or click "Create New Package" to add one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const color = colorVariants[plan.color || "emerald"] || colorVariants.emerald;
            const price =
              billingCycle === "ANNUAL"
                ? plan.annualLkr || Math.round(plan.monthlyLkr * 12 * 0.8)
                : billingCycle === "QUARTERLY"
                ? plan.quarterlyLkr || Math.round(plan.monthlyLkr * 3 * 0.9)
                : plan.monthlyLkr;

            const isArchived = plan.isActive === false;

            return (
              <div
                key={plan.key}
                className={`p-6 rounded-2xl bg-[#121417] border ${
                  plan.isPopular ? "border-amber-500/50 shadow-lg shadow-amber-500/5" : color.border
                } flex flex-col justify-between relative group hover:border-zinc-500 transition-all ${
                  isArchived ? "opacity-60 bg-[#0f1013]" : ""
                }`}
              >
                {/* Header Callout Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      {plan.key}
                    </span>
                    {isArchived ? (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        ARCHIVED
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {plan.badge && (
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        plan.isPopular
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : color.badge
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {plan.description}
                    </p>
                  )}

                  {/* Pricing Display */}
                  <div className="mt-4 mb-4 pb-4 border-b border-zinc-800/80">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-white font-mono tracking-tight">
                        Rs. {price.toLocaleString()}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        {billingCycle === "ANNUAL"
                          ? "/ year"
                          : billingCycle === "QUARTERLY"
                          ? "/ quarter"
                          : "/ month"}
                      </span>
                    </div>

                    {billingCycle === "ANNUAL" && (
                      <span className="text-[11px] font-mono text-emerald-400 font-medium mt-1 block">
                        Save Rs. {(plan.monthlyLkr * 12 - price).toLocaleString()} / year (20% off)
                      </span>
                    )}
                    {billingCycle === "QUARTERLY" && (
                      <span className="text-[11px] font-mono text-emerald-400 font-medium mt-1 block">
                        Save Rs. {(plan.monthlyLkr * 3 - price).toLocaleString()} / quarter (10% off)
                      </span>
                    )}
                  </div>

                  {/* Quotas Strip */}
                  <div className="grid grid-cols-3 gap-2 mb-4 py-2 px-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Branches</span>
                      <span className="font-bold text-zinc-200 font-mono">
                        {plan.maxBranches >= 999 || plan.maxBranches === -1
                          ? "Unlimited"
                          : `${plan.maxBranches} Outlet${plan.maxBranches > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Staff / Users</span>
                      <span className="font-bold text-zinc-200 font-mono">
                        {plan.maxUsers >= 999 || plan.maxUsers === -1
                          ? "Unlimited"
                          : `${plan.maxUsers} Users`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Free Trial</span>
                      <span className="font-bold text-zinc-200 font-mono">
                        {plan.trialDays ? `${plan.trialDays} Days` : "No Trial"}
                      </span>
                    </div>
                  </div>

                  {/* Subscriber Count Indicator */}
                  <div className="mb-4 flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Building2 size={13} className="text-zinc-500" />
                      <span>Subscribers</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {plan.subscriberCount || 0} active tenant{plan.subscriberCount === 1 ? "" : "s"}
                      {plan.totalMrrLkr && plan.totalMrrLkr > 0 && (
                        <span className="text-[10px] text-zinc-400 ml-1 font-normal">
                          (Rs. {plan.totalMrrLkr.toLocaleString()}/mo)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {(plan.features || []).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="text-emerald-400 shrink-0 mt-0.5"
                        />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenEditModal(plan)}
                      className="h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <Settings size={12} />
                      <span>Edit Package</span>
                    </button>

                    <button
                      onClick={() => handleOpenAssignModal(plan)}
                      className="h-8 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <Building2 size={12} />
                      <span>Assign to Tenant</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className="hover:text-white transition flex items-center gap-1"
                    >
                      {isArchived ? (
                        <>
                          <RotateCcw size={11} className="text-emerald-400" />
                          <span className="text-emerald-400">Unarchive</span>
                        </>
                      ) : (
                        <>
                          <Archive size={11} className="text-zinc-400" />
                          <span>Archive Package</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeletePlan(plan)}
                      className="text-red-400 hover:text-red-300 transition flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Platform Invoices & Settlements Ledger */}
      <div className="p-5 rounded-2xl bg-[#121417] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Platform Automated Invoices & Payment Gateway Settlements
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live ledger of generated tenant subscription invoices, billing cycles, and status.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Tenant Name</th>
                <th className="py-2.5 px-3">Billing Cycle</th>
                <th className="py-2.5 px-3">Amount (LKR)</th>
                <th className="py-2.5 px-3">Issued Date</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-inter">
              {(financials?.recentInvoices || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                    No billing invoices generated yet. Invoices appear automatically upon tenant package activation.
                  </td>
                </tr>
              ) : (
                (financials?.recentInvoices || []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-zinc-200">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-white font-medium">
                      {inv.tenantName || "Tenant Outlet"}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-400">
                      {inv.billingCycle || "MONTHLY"}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      Rs. {inv.amountLkr.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-zinc-400 font-mono">
                      {new Date(inv.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {inv.status || "PAID"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: CREATE / EDIT PACKAGE
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#121417] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <CreditCard size={17} className="text-amber-400" />
                  <span>{editingPlan ? `Edit Package: ${editingPlan.name}` : "Create New SaaS Package"}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure pricing, billing intervals, quotas, and feature entitlements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSavePlan} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
              {/* General Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider text-zinc-400 border-b border-zinc-800/80 pb-1.5">
                  1. General Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Package Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        if (!editingPlan) {
                          setFormKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "_"));
                        }
                      }}
                      placeholder="e.g. Food & Beverage Pro"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Package Code / Key <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(editingPlan)}
                      value={formKey}
                      onChange={(e) => setFormKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                      placeholder="e.g. RESTAURANT_PRO"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Callout Badge (Optional)
                    </label>
                    <input
                      type="text"
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      placeholder="e.g. Most Popular, Single Outlet"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Card Accent Color
                    </label>
                    <select
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="emerald">Emerald Green (Recommended)</option>
                      <option value="blue">Sapphire Blue</option>
                      <option value="purple">Royal Purple</option>
                      <option value="amber">Warm Amber / Gold</option>
                      <option value="rose">Crimson Rose</option>
                      <option value="cyan">Neon Cyan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                    Summary / Description
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of targeted business vertical..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing Engine */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider text-zinc-400">
                    2. Pricing Schedule in Sri Lankan Rupees (LKR)
                  </h4>
                  <label className="text-[11px] text-zinc-400 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDiscount}
                      onChange={(e) => setAutoDiscount(e.target.checked)}
                      className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Auto-calculate 10% Quarterly & 20% Annual</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Monthly Price (LKR) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-zinc-500 font-mono">Rs.</span>
                      <input
                        type="number"
                        required
                        value={formMonthlyLkr}
                        onChange={(e) => handleMonthlyChange(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Quarterly Price (LKR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-zinc-500 font-mono">Rs.</span>
                      <input
                        type="number"
                        disabled={autoDiscount}
                        value={formQuarterlyLkr}
                        onChange={(e) => setFormQuarterlyLkr(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none disabled:opacity-60"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block font-mono">
                      10% discount applied
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Annual Price (LKR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-zinc-500 font-mono">Rs.</span>
                      <input
                        type="number"
                        disabled={autoDiscount}
                        value={formAnnualLkr}
                        onChange={(e) => setFormAnnualLkr(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none disabled:opacity-60"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block font-mono">
                      20% discount applied
                    </span>
                  </div>
                </div>
              </div>

              {/* Resource Quotas */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider text-zinc-400 border-b border-zinc-800/80 pb-1.5">
                  3. Entitlements & Resource Quotas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-zinc-300">Max Branches</label>
                      <label className="text-[10px] text-amber-400 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isUnlimitedBranches}
                          onChange={(e) => setIsUnlimitedBranches(e.target.checked)}
                          className="rounded text-amber-500"
                        />
                        <span>Unlimited</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      disabled={isUnlimitedBranches}
                      value={isUnlimitedBranches ? 999 : formMaxBranches}
                      onChange={(e) => setFormMaxBranches(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-zinc-300">Max Staff Accounts</label>
                      <label className="text-[10px] text-amber-400 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isUnlimitedUsers}
                          onChange={(e) => setIsUnlimitedUsers(e.target.checked)}
                          className="rounded text-amber-500"
                        />
                        <span>Unlimited</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      disabled={isUnlimitedUsers}
                      value={isUnlimitedUsers ? 999 : formMaxUsers}
                      onChange={(e) => setFormMaxUsers(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Trial Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={formTrialDays}
                      onChange={(e) => setFormTrialDays(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Checklist Builder */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider text-zinc-400 border-b border-zinc-800/80 pb-1.5">
                  4. Feature Checklist & Entitlements
                </h4>

                {/* Quick Preset Feature Chips */}
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                    Click preset capabilities to toggle:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    {PRESET_FEATURES.map((pf) => {
                      const isSelected = formFeatures.includes(pf);
                      return (
                        <button
                          key={pf}
                          type="button"
                          onClick={() => handleTogglePresetFeature(pf)}
                          className={`text-[10px] font-medium px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                            isSelected
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-zinc-800/60 text-zinc-400 hover:text-white border border-transparent"
                          }`}
                        >
                          {isSelected ? <Check size={10} /> : <Plus size={10} />}
                          <span>{pf}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Feature Adder */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                    placeholder="Or type a custom feature item..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Add
                  </button>
                </div>

                {/* Current Selected Features List */}
                <div className="space-y-1.5 mt-2">
                  <span className="text-[11px] text-zinc-400 block font-medium">
                    Selected Features ({formFeatures.length}):
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {formFeatures.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(feat)}
                          className="text-zinc-500 hover:text-red-400 p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status and Highlighting */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>Mark as "Most Popular / Featured" tier</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Publish immediately (Active)</span>
                </label>
              </div>

              {/* Submit / Cancel Footer */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-semibold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingPlan ? "Save Changes" : "Create Package"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ASSIGN PACKAGE TO TENANT
          ========================================================================= */}
      {isAssignModalOpen && selectedPlanForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121417] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Building2 size={16} className="text-amber-400" />
                  <span>Assign Package to Tenant</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Package: <strong className="text-amber-400">{selectedPlanForAssign.name}</strong> ({selectedPlanForAssign.key})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignPlan} className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                  Select Tenant Business <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={assignTenantId}
                  onChange={(e) => setAssignTenantId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Current: {t.subscriptionTier} · {t.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={assignCycle}
                    onChange={(e) => setAssignCycle(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="MONTHLY">Monthly (Rs. {selectedPlanForAssign.monthlyLkr.toLocaleString()})</option>
                    <option value="QUARTERLY">Quarterly (Rs. {selectedPlanForAssign.quarterlyLkr.toLocaleString()})</option>
                    <option value="ANNUAL">Annual (Rs. {selectedPlanForAssign.annualLkr.toLocaleString()})</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                    Custom Price Override (Optional)
                  </label>
                  <input
                    type="number"
                    value={assignCustomPrice}
                    onChange={(e) => setAssignCustomPrice(e.target.value)}
                    placeholder="e.g. 8000"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
                <span className="font-semibold text-white block">Automatic Provisioning:</span>
                <p className="text-[11px] text-zinc-400">
                  Assigning will update the tenant's tier to <code className="text-amber-400 font-mono">{selectedPlanForAssign.key}</code>, adjust branch limits to <strong>{selectedPlanForAssign.maxBranches}</strong>, user limits to <strong>{selectedPlanForAssign.maxUsers}</strong>, and generate an invoice record in the platform ledger.
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {assigning ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Activate & Assign Package</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
