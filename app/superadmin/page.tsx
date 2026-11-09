"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  superAdminService,
  PlatformKPIs,
  PlatformFinancials,
  TenantRegistryItem,
  ClusterTelemetry,
  MonthlyAnalyticsResponse,
  PlatformRevenueBreakdownResponse,
  TopOutletPerformanceItem,
} from "@/services/superadmin.service";
import { systemService, SystemErrorLogItem } from "@/services/system.service";
import { tenantService } from "@/services/tenant.service";
import { globalDialog } from "@/store/dialog.store";
import { toast } from "@/store/toast.store";
import { useAuthStore } from "@/store/auth.store";
import SuperAdminSidebar from "@/components/superadmin/SuperAdminSidebar";
import SuperAdminHeader from "@/components/superadmin/SuperAdminHeader";
import { SuperAdminSubscriptionPackages } from "@/components/superadmin/SuperAdminSubscriptionPackages";
import SuperAdminFeatureFlags from "@/components/superadmin/SuperAdminFeatureFlags";
import TenantEntitlementsModal from "@/components/superadmin/TenantEntitlementsModal";
import SuperAdminSecurityAudit from "@/components/superadmin/SuperAdminSecurityAudit";
import SuperAdminDunningManager from "@/components/superadmin/SuperAdminDunningManager";
import SuperAdminAnnouncements from "@/components/superadmin/SuperAdminAnnouncements";
import SuperAdminDisasterRecovery from "@/components/superadmin/SuperAdminDisasterRecovery";
import {
  SalesPerformanceChart,
  RevenueBreakdownChart,
} from "@/components/superadmin/SuperAdminCharts";
import {
  Plus,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Users,
  CreditCard,
  Server,
  DollarSign,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Settings,
  ChevronRight,
  Cpu,
  HardDrive,
  KeyRound,
  UserPlus,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentErrors, setRecentErrors] = useState<SystemErrorLogItem[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  // Live Data States
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [financials, setFinancials] = useState<PlatformFinancials | null>(null);
  const [tenants, setTenants] = useState<TenantRegistryItem[]>([]);
  const [telemetry, setTelemetry] = useState<ClusterTelemetry | null>(null);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlyAnalyticsResponse | null>(null);
  const [breakdown, setBreakdown] = useState<PlatformRevenueBreakdownResponse | null>(null);
  const [topOutlets, setTopOutlets] = useState<TopOutletPerformanceItem[]>([]);

  // Modals
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isPriceEditorOpen, setIsPriceEditorOpen] = useState(false);
  const [selectedPlanToEdit, setSelectedPlanToEdit] = useState("STARTER");
  const [newPlanPrice, setNewPlanPrice] = useState("4500");
  const [priceUpdating, setPriceUpdating] = useState(false);
  const [planOverrides, setPlanOverrides] = useState<Record<string, number>>({
    STARTER: 4500,
    GROWTH: 9500,
    PRO: 9500,
    ENTERPRISE: 18500,
  });

  // Provision Form State
  const [provisionData, setProvisionData] = useState({
    businessName: "",
    slug: "",
    businessType: "RETAIL",
    adminEmail: "",
    adminPassword: "Password@123",
    adminFullName: "",
    initialBranchName: "",
    subscriptionTier: "STARTER",
  });
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState<string | null>(null);

  // Expense Form State
  const [expenseData, setExpenseData] = useState<{
    category: 'CLOUD_SERVERS' | 'DATABASE' | 'REDIS_CACHE' | 'SMS_GATEWAY' | 'SECURITY_SSL' | 'OPERATIONS';
    amountLkr: number;
    vendor: string;
    description: string;
  }>({
    category: "CLOUD_SERVERS",
    amountLkr: 25000,
    vendor: "AWS Cloud (ECS/EC2)",
    description: "Production API cluster containers & ALB",
  });
  const [expenseLoading, setExpenseLoading] = useState(false);

  // Tenant Settings Modal State
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState<TenantRegistryItem | null>(null);
  const [isTenantSettingsOpen, setIsTenantSettingsOpen] = useState(false);
  const [tenantEditForm, setTenantEditForm] = useState({
    name: "",
    slug: "",
    businessType: "RETAIL",
    subscriptionTier: "STARTER",
    status: "ACTIVE",
    maxBranches: 1,
    maxUsers: 5,
    taxRate: 0,
    currency: "LKR",
    currencySymbol: "Rs.",
  });
  const [tenantEditLoading, setTenantEditLoading] = useState(false);

  // Tenant Super Admins Management Modal State
  const [selectedTenantForAdmins, setSelectedTenantForAdmins] = useState<TenantRegistryItem | null>(null);
  const [isTenantAdminsOpen, setIsTenantAdminsOpen] = useState(false);
  const [tenantAdminsList, setTenantAdminsList] = useState<any[]>([]);
  const [tenantAdminsLoading, setTenantAdminsLoading] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    name: "",
    email: "",
    password: "Password@123",
    phone: "",
  });
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState<string | null>(null);
  const [entitlementsTenant, setEntitlementsTenant] = useState<TenantRegistryItem | null>(null);

  // Tenant Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiRes, finRes, tenantsRes, telemRes, monthlyRes, breakdownRes, outletsRes] = await Promise.all([
        superAdminService.getKPIs().catch(() => null),
        superAdminService.getFinancials().catch(() => null),
        superAdminService.getTenants().catch(() => []),
        superAdminService.getTelemetry().catch(() => null),
        superAdminService.getMonthlyAnalytics().catch(() => null),
        superAdminService.getRevenueBreakdown().catch(() => null),
        superAdminService.getTopOutlets(5).catch(() => []),
      ]);

      if (kpiRes) setKpis(kpiRes);
      if (finRes) setFinancials(finRes);
      if (tenantsRes) setTenants(tenantsRes);
      if (telemRes) setTelemetry(telemRes);
      if (monthlyRes) setMonthlyAnalytics(monthlyRes);
      if (breakdownRes) setBreakdown(breakdownRes);
      if (outletsRes) setTopOutlets(outletsRes);

      // Load recent system errors for in-VPS telemetry
      try {
        const errorLogs = await systemService.getErrorLogs(8);
        setRecentErrors(errorLogs || []);
      } catch (e) {
        // Soft fail
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualBackup = async () => {
    setBackupLoading(true);
    setBackupStatus(null);
    try {
      const res = await systemService.triggerBackup();
      setBackupStatus(res.message || "Database snapshot created successfully.");
      await loadData();
    } catch (err: any) {
      setBackupStatus(err?.response?.data?.message || err?.message || "Failed to execute database backup.");
    } finally {
      setBackupLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProvisionTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionLoading(true);
    setProvisionMsg(null);
    try {
      await superAdminService.provisionTenant(provisionData);
      setProvisionMsg("Tenant successfully provisioned with isolated database schema!");
      await loadData();
      setTimeout(() => {
        setIsProvisionOpen(false);
        setProvisionMsg(null);
        setProvisionData({
          businessName: "",
          slug: "",
          businessType: "RETAIL",
          adminEmail: "",
          adminPassword: "Password@123",
          adminFullName: "",
          initialBranchName: "",
          subscriptionTier: "STARTER",
        });
      }, 1200);
    } catch (err: any) {
      setProvisionMsg(err?.response?.data?.message || err?.message || "Failed to provision tenant");
    } finally {
      setProvisionLoading(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseLoading(true);
    try {
      await superAdminService.recordExpense({
        ...expenseData,
        amountLkr: Number(expenseData.amountLkr),
      });
      await loadData();
      setIsExpenseOpen(false);
    } catch (err: any) {
      toast.error("Failed to record expense: " + err.message);
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleSavePrice = async () => {
    const priceNum = parseInt(newPlanPrice, 10);
    if (isNaN(priceNum) || priceNum <= 0) return;
    setPriceUpdating(true);
    try {
      await superAdminService.updatePlanPrice(selectedPlanToEdit, priceNum);
      setPlanOverrides((prev) => ({
        ...prev,
        [selectedPlanToEdit]: priceNum,
        ...(selectedPlanToEdit === "GROWTH" ? { PRO: priceNum } : {}),
        ...(selectedPlanToEdit === "PRO" ? { GROWTH: priceNum } : {}),
      }));
      await loadData();
      setIsPriceEditorOpen(false);
      toast.success("Plan pricing updated successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update plan pricing");
    } finally {
      setPriceUpdating(false);
    }
  };

  const handleUpdateTenantStatus = async (
    tenantId: string,
    status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "CANCELLED"
  ) => {
    const isDestructive = status === "CANCELLED" || status === "SUSPENDED";
    const confirmed = await globalDialog.confirm(
      `Are you sure you want to change tenant status to ${status}?`,
      "Confirm Tenant Status",
      {
        variant: isDestructive ? "danger" : "default",
        confirmText: `Set to ${status}`,
      }
    );
    if (!confirmed) return;
    try {
      await superAdminService.updateTenantStatus(tenantId, status);
      toast.success(`Tenant status changed to ${status}`);
      await loadData();
    } catch (err: any) {
      globalDialog.alert(err.message || "Failed to update tenant status", "Update Failed", { variant: "danger" });
    }
  };

  const [impersonatingTenantId, setImpersonatingTenantId] = useState<string | null>(null);

  const handleImpersonateTenant = async (tenant: TenantRegistryItem) => {
    setImpersonatingTenantId(tenant.id);
    try {
      // 1. Read current superadmin user & token for backup
      const currentUserStr = localStorage.getItem("laural_user");
      const match = typeof document !== "undefined" ? document.cookie.match(/(?:^|;\s*)laural_access_token=([^;]*)/) : null;
      const currentToken = match ? match[1] : "";

      if (currentToken && currentUserStr) {
        localStorage.setItem("xonit_impersonator_token", currentToken);
        localStorage.setItem("xonit_impersonator_user", currentUserStr);
      }

      // 2. Call backend impersonation service
      const res = await superAdminService.impersonateTenant(tenant.id);
      if (!res || !res.accessToken) {
        throw new Error("Did not receive impersonation token from server.");
      }

      // 3. Store impersonation session metadata
      localStorage.setItem(
        "xonit_impersonation_session",
        JSON.stringify({
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          userEmail: res.user?.email,
          impersonatorEmail: res.user?.impersonator?.email,
          startedAt: new Date().toISOString(),
        })
      );

      // 4. Update cookies with impersonated credentials
      document.cookie = `laural_access_token=${res.accessToken}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `laural_role=${res.user?.roles?.[0] || "ADMIN"}; path=/; max-age=3600; SameSite=Lax`;

      // 5. Update auth store and local tenant context
      localStorage.setItem("laural_user", JSON.stringify(res.user));
      localStorage.setItem("laural_tenant_id", tenant.id);
      localStorage.setItem("laural_tenant_slug", tenant.slug);
      localStorage.setItem("active_tenant_id", tenant.id);
      localStorage.setItem("active_tenant_slug", tenant.slug);

      useAuthStore.getState().setAuth(res.user);

      toast.success(`Entering ${tenant.name} workspace in Masquerade Mode...`);

      // 6. Navigate to tenant admin
      window.location.href = res.redirectTo || "/admin";
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to impersonate tenant");
    } finally {
      setImpersonatingTenantId(null);
    }
  };

  const handleExtendTrial = async (tenantId: string) => {
    try {
      await superAdminService.extendTrial(tenantId, 14);
      toast.success("Free trial successfully extended by +14 days!");
      await loadData();
    } catch (err: any) {
      globalDialog.alert(err.message || "Failed to extend trial", "Action Failed", { variant: "danger" });
    }
  };

  const handleOpenTenantSettings = (tenant: TenantRegistryItem) => {
    setSelectedTenantForEdit(tenant);
    setTenantEditForm({
      name: tenant.name,
      slug: tenant.slug,
      businessType: tenant.businessType || "RETAIL",
      subscriptionTier: tenant.subscriptionTier || "STARTER",
      status: tenant.status || "ACTIVE",
      maxBranches: tenant.maxBranches || 1,
      maxUsers: tenant.maxUsers || 5,
      taxRate: (tenant as any).taxRate ?? 0,
      currency: (tenant as any).currency || "LKR",
      currencySymbol: (tenant as any).currencySymbol || "Rs.",
    });
    setIsTenantSettingsOpen(true);
  };

  const handleSaveTenantSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForEdit) return;
    setTenantEditLoading(true);
    try {
      await tenantService.updateTenant(selectedTenantForEdit.id, {
        name: tenantEditForm.name,
        slug: tenantEditForm.slug,
        businessType: tenantEditForm.businessType as any,
        subscriptionTier: tenantEditForm.subscriptionTier as any,
        status: tenantEditForm.status as any,
        maxBranches: Number(tenantEditForm.maxBranches),
        maxUsers: Number(tenantEditForm.maxUsers),
        taxRate: Number(tenantEditForm.taxRate),
        currency: tenantEditForm.currency,
        currencySymbol: tenantEditForm.currencySymbol,
      });
      toast.success("Tenant settings saved successfully!");
      setIsTenantSettingsOpen(false);
      await loadData();
    } catch (err: any) {
      globalDialog.alert(err?.response?.data?.message || err?.message || "Failed to update tenant settings", "Error", { variant: "danger" });
    } finally {
      setTenantEditLoading(false);
    }
  };

  const handleOpenTenantAdmins = async (tenant: TenantRegistryItem) => {
    setSelectedTenantForAdmins(tenant);
    setIsTenantAdminsOpen(true);
    setTenantAdminsLoading(true);
    setAdminActionMsg(null);
    try {
      const admins = await superAdminService.getTenantAdmins(tenant.id);
      setTenantAdminsList(admins || []);
    } catch (err: any) {
      globalDialog.alert("Failed to load tenant admins: " + (err.message || err), "Load Failed", { variant: "danger" });
    } finally {
      setTenantAdminsLoading(false);
    }
  };

  const handleCreateTenantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForAdmins) return;
    setAddAdminLoading(true);
    setAdminActionMsg(null);
    try {
      await superAdminService.createTenantAdmin(selectedTenantForAdmins.id, newAdminForm);
      setAdminActionMsg("Admin successfully created!");
      setIsAddAdminOpen(false);
      setNewAdminForm({ name: "", email: "", password: "Password@123", phone: "" });
      const admins = await superAdminService.getTenantAdmins(selectedTenantForAdmins.id);
      setTenantAdminsList(admins || []);
    } catch (err: any) {
      globalDialog.alert(err?.response?.data?.message || err?.message || "Failed to create admin", "Creation Failed", { variant: "danger" });
    } finally {
      setAddAdminLoading(false);
    }
  };

  const handleToggleAdminStatus = async (adminId: string, currentStatus: string) => {
    if (!selectedTenantForAdmins) return;
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmed = await globalDialog.confirm(
      `Are you sure you want to change this admin's status to ${newStatus}?`,
      "Admin Status Update",
      {
        variant: newStatus === "SUSPENDED" ? "danger" : "default",
        confirmText: `Set to ${newStatus}`
      }
    );
    if (!confirmed) return;
    try {
      await superAdminService.updateTenantAdminStatus(selectedTenantForAdmins.id, adminId, newStatus);
      toast.success(`Admin status updated to ${newStatus}`);
      const admins = await superAdminService.getTenantAdmins(selectedTenantForAdmins.id);
      setTenantAdminsList(admins || []);
    } catch (err: any) {
      globalDialog.alert(err?.response?.data?.message || err?.message || "Failed to update admin status", "Update Failed", { variant: "danger" });
    }
  };

  const handleResetAdminPassword = async (adminId: string, email: string) => {
    if (!selectedTenantForAdmins) return;
    const newPassword = await globalDialog.prompt(
      `Enter new secure password for ${email}:`,
      "Password@123",
      "Reset Admin Password",
      {
        placeholder: "Enter new password",
        confirmText: "Reset Password",
        variant: "warning"
      }
    );
    if (!newPassword) return;
    try {
      await superAdminService.resetTenantAdminPassword(selectedTenantForAdmins.id, adminId, newPassword);
      toast.success(`Password successfully reset for ${email}!`);
    } catch (err: any) {
      globalDialog.alert(err?.response?.data?.message || err?.message || "Failed to reset password", "Reset Failed", { variant: "danger" });
    }
  };

  // Filter tenants
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesType = typeFilter === "ALL" || t.businessType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#090A0C] text-zinc-100 flex flex-col antialiased">
      <div className="flex-1 flex w-full">
        {/* Dedicated Dark Carbon Sidebar */}
        <SuperAdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          tenantCount={kpis?.totalTenants ?? tenants.length}
        />

        {/* Main Viewport */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#090A0C]">
          {/* Header Bar */}
          <SuperAdminHeader
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onOpenProvisionModal={() => setIsProvisionOpen(true)}
            onOpenExpenseModal={() => setIsExpenseOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Tab Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1560px] w-full mx-auto space-y-6">
            {/* =========================================================================
                TAB 1: BUSINESS DASHBOARD (Overview - Matches Reference Screenshot)
                ========================================================================= */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Page Title & Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      Business Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      Monitor your business performance and key metrics in real-time
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIsProvisionOpen(true)}
                      className="h-9 px-3.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Plus size={14} className="stroke-[2.5]" />
                      <span>Provision Tenant</span>
                    </button>

                    <button
                      onClick={() => setIsExpenseOpen(true)}
                      className="h-9 px-3.5 rounded-lg bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <SlidersHorizontal size={13} className="text-zinc-400" />
                      <span>Record Expense</span>
                    </button>
                  </div>
                </div>

                {/* 4 Top Metric KPI Cards (Matching Reference Screenshot) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Revenue (MRR) */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-zinc-400">
                        Monthly Recurring Revenue
                      </span>
                      {(() => {
                        const growth = monthlyAnalytics?.momGrowth.mrrGrowthPct ?? 0;
                        const isUp = growth >= 0;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono ${
                              isUp
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            }`}
                          >
                            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isUp ? `+${growth}%` : `${growth}%`}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="my-3">
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        Rs. {(kpis?.mrrLkr ?? 0).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium mt-1">
                        <span>
                          {(monthlyAnalytics?.momGrowth.mrrGrowthPct ?? 0) >= 0
                            ? "Trending up this month"
                            : "Contracted this period"}
                        </span>
                        {(monthlyAnalytics?.momGrowth.mrrGrowthPct ?? 0) >= 0 ? (
                          <TrendingUp size={13} className="text-emerald-400" />
                        ) : (
                          <TrendingDown size={13} className="text-rose-400" />
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
                      Projected ARR: Rs. {(kpis?.arrLkr ?? 0).toLocaleString()}
                    </div>
                  </div>

                  {/* Card 2: Active Customers / Tenants */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-zinc-400">
                        Active Tenants
                      </span>
                      {(() => {
                        const growth = monthlyAnalytics?.momGrowth.tenantsGrowthPct ?? 0;
                        const isUp = growth >= 0;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono ${
                              isUp
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            }`}
                          >
                            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isUp ? `+${growth}%` : `${growth}%`}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="my-3">
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        {(kpis?.totalTenants ?? tenants.length ?? 0).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium mt-1">
                        <span>
                          {(monthlyAnalytics?.momGrowth.tenantsGrowthPct ?? 0) >= 0
                            ? "Strong tenant adoption"
                            : "Tenant churn detected"}
                        </span>
                        {(monthlyAnalytics?.momGrowth.tenantsGrowthPct ?? 0) >= 0 ? (
                          <TrendingUp size={13} className="text-emerald-400" />
                        ) : (
                          <TrendingDown size={13} className="text-rose-400" />
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
                      {kpis?.activeTenants ?? 0} Active • {kpis?.trialTenants ?? 0} Free Trial
                    </div>
                  </div>

                  {/* Card 3: Total Orders / GMV */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-zinc-400">
                        Total Orders
                      </span>
                      {(() => {
                        const growth = monthlyAnalytics?.momGrowth.ordersGrowthPct ?? 0;
                        const isUp = growth >= 0;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono ${
                              isUp
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            }`}
                          >
                            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isUp ? `+${growth}%` : `${growth}%`}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="my-3">
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        {(kpis?.totalOrders ?? 0).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium mt-1">
                        <span>
                          {(monthlyAnalytics?.momGrowth.ordersGrowthPct ?? 0) >= 0
                            ? "Order volume expanding"
                            : "Volume down this period"}
                        </span>
                        {(monthlyAnalytics?.momGrowth.ordersGrowthPct ?? 0) >= 0 ? (
                          <TrendingUp size={13} className="text-emerald-400" />
                        ) : (
                          <TrendingDown size={13} className="text-rose-400" />
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
                      GMV: Rs. {((kpis?.platformGmvLkr ?? 0) / 1000000).toFixed(2)}M processed
                    </div>
                  </div>

                  {/* Card 4: SaaS Net Margin */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-zinc-400">
                        Net Profit Margin
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                        <TrendingUp size={11} />
                        {(financials?.profitMarginPercent ?? 0).toFixed(1)}%
                      </span>
                    </div>

                    <div className="my-3">
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        {(financials?.profitMarginPercent ?? 0).toFixed(1)}%
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium mt-1">
                        <span>
                          {(financials?.netSaaSProfitLkr ?? 0) >= 0
                            ? "Profitable SaaS operational health"
                            : "High infrastructure overhead"}
                        </span>
                        {(financials?.netSaaSProfitLkr ?? 0) >= 0 ? (
                          <TrendingUp size={13} className="text-emerald-400" />
                        ) : (
                          <TrendingDown size={13} className="text-rose-400" />
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
                      SaaS Net Profit: Rs. {(financials?.netSaaSProfitLkr ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Middle Dual Section: Sales Performance (Area) & Revenue Breakdown (Donut) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-7">
                    <SalesPerformanceChart
                      series={monthlyAnalytics?.series || []}
                      mrrLkr={kpis?.mrrLkr || 0}
                      totalGmvLkr={kpis?.platformGmvLkr || 0}
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <RevenueBreakdownChart
                      breakdown={breakdown ?? undefined}
                      mrrLkr={kpis?.mrrLkr || 0}
                    />
                  </div>
                </div>

                {/* Lower Dual Section: Recent Transactions & Top Multi-Tenant Outlets */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left 60%: Recent Transactions / Invoices Table */}
                  <div className="lg:col-span-7 p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          Recent Transactions
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Latest customer transactions & automated billing
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("subscriptions")}
                        className="h-8 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] hover:bg-[#20242A] text-xs text-zinc-300 flex items-center gap-1 transition-colors"
                      >
                        <Eye size={12} />
                        <span>View All</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#1E2227] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-3">Tenant</th>
                            <th className="py-2.5 px-3">Plan</th>
                            <th className="py-2.5 px-3">Amount (LKR)</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1A1D21]">
                          {financials?.recentInvoices && financials.recentInvoices.length > 0 ? (
                            financials.recentInvoices.slice(0, 5).map((inv) => (
                              <tr key={inv.id} className="hover:bg-[#16181B] transition-colors">
                                <td className="py-3 px-3 font-medium text-white">
                                  {inv.tenantName || "Platform Merchant"}
                                </td>
                                <td className="py-3 px-3 font-mono text-zinc-400">
                                  {inv.billingCycle || "MONTHLY"}
                                </td>
                                <td className="py-3 px-3 font-bold font-mono text-zinc-100">
                                  Rs. {inv.amountLkr.toLocaleString()}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                      inv.status === "PAID"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-[11px] text-zinc-500 font-mono">
                                  {new Date(inv.issuedAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-zinc-500 font-mono text-xs">
                                No billing invoices generated yet. Automated ledger cycles on next renewal.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right 40%: Top Outlets & Upgrade Banner */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-white tracking-tight">
                            Top Performing Outlets
                          </h3>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            High velocity merchant branches across Sri Lanka
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        {topOutlets.length > 0 ? (
                          topOutlets.map((outlet) => (
                            <div key={outlet.id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-semibold text-zinc-200 truncate">
                                    {outlet.branchName}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono shrink-0">
                                    {outlet.businessType}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 font-mono shrink-0">
                                  <span className="text-zinc-400">
                                    {outlet.totalOrders} orders
                                  </span>
                                  <span className="text-zinc-500 text-[10px]">
                                    (Rs. {outlet.gmvLkr.toLocaleString()})
                                  </span>
                                </div>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#1C2025] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${Math.max(outlet.velocityPct, 4)}%` }}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                            No branch order activity recorded yet across tenant outlets.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom floating upgrade banner matching screenshot */}
                    <div className="mt-6 pt-4 border-t border-[#1C2025] flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">
                          Cluster Quota Headroom
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          68% capacity remaining on current AWS tier
                        </span>
                      </div>
                      <button
                        onClick={() => setIsProvisionOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
                      >
                        <Sparkles size={12} />
                        <span>Provision +</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 2: TENANTS REGISTRY (Full Table & Governance Controls)
                ========================================================================= */}
            {activeTab === "tenants" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Tenants Registry & Quotas
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Manage {filteredTenants.length} multi-tenant business instances
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsProvisionOpen(true)}
                      className="h-9 px-4 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Plus size={14} className="stroke-[2.5]" />
                      <span>Provision Tenant</span>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="p-4 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <Search size={15} className="text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tenant name or slug..."
                      className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-8 px-2.5 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="TRIAL">Trial</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>

                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="h-8 px-2.5 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="ALL">All Business Types</option>
                      <option value="RETAIL">Retail</option>
                      <option value="RESTAURANT_CAFE">Restaurant & Cafe</option>
                      <option value="SUPERMARKET_GROCERY">Supermarket</option>
                      <option value="SALON_SPA">Salon & Spa</option>
                    </select>
                  </div>
                </div>

                {/* Tenants Table */}
                <div className="rounded-2xl bg-[#121417] border border-[#1E2227] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1E2227] text-zinc-500 font-semibold uppercase tracking-wider text-[10px] bg-[#141619]">
                          <th className="py-3 px-4">Business Name & Slug</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Plan</th>
                          <th className="py-3 px-4">Branches & Staff</th>
                          <th className="py-3 px-4">Catalog / Orders</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1D21]">
                        {filteredTenants.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-zinc-500">
                              No tenants found matching criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredTenants.map((t) => (
                            <tr key={t.id} className="hover:bg-[#16181B] transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-white">{t.name}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">
                                  slug: {t.slug}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-zinc-300 text-[11px]">
                                {t.businessType}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold font-mono">
                                  {t.subscriptionTier}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-zinc-400">
                                {t.branchesCount} / {t.maxBranches} branches • {t.usersCount} users
                              </td>
                              <td className="py-3.5 px-4 font-mono text-zinc-400">
                                {t.productsCount || 0} items • {t.ordersCount || 0} orders
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                                    t.status === "ACTIVE"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : t.status === "TRIAL"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  }`}
                                >
                                  {t.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleImpersonateTenant(t)}
                                    disabled={impersonatingTenantId === t.id}
                                    className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 text-[11px] font-semibold border border-amber-500/30 hover:border-amber-400 transition-all flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50"
                                    title="Masquerade Mode: Log into this tenant store with root permissions"
                                  >
                                    <KeyRound size={12} className={impersonatingTenantId === t.id ? "animate-spin" : "text-amber-400"} />
                                    <span>{impersonatingTenantId === t.id ? "Entering..." : "Impersonate"}</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenTenantAdmins(t)}
                                    className="px-2 py-1 rounded bg-[#1C2025] hover:bg-amber-950/40 text-amber-400 text-[11px] font-medium border border-[#2B3037] hover:border-amber-500/40 transition-colors flex items-center gap-1"
                                    title="Manage Tenant Super Admins"
                                  >
                                    <Users size={12} />
                                    <span>Admins</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenTenantSettings(t)}
                                    className="px-2 py-1 rounded bg-[#1C2025] hover:bg-blue-950/40 text-blue-400 text-[11px] font-medium border border-[#2B3037] hover:border-blue-500/40 transition-colors flex items-center gap-1"
                                    title="Edit Tenant Settings"
                                  >
                                    <Settings size={12} />
                                    <span>Settings</span>
                                  </button>
                                  <button
                                    onClick={() => setEntitlementsTenant(t)}
                                    data-testid={`entitlements-btn-${t.slug}`}
                                    className="px-2 py-1 rounded bg-[#1C2025] hover:bg-purple-950/40 text-purple-400 text-[11px] font-medium border border-[#2B3037] hover:border-purple-500/40 transition-colors flex items-center gap-1"
                                    title="Manage Feature Entitlements & Overrides"
                                  >
                                    <SlidersHorizontal size={12} />
                                    <span>Entitlements</span>
                                  </button>
                                  {t.status === "ACTIVE" ? (
                                    <button
                                      onClick={() => handleUpdateTenantStatus(t.id, "SUSPENDED")}
                                      className="px-2 py-1 rounded bg-[#1C2025] hover:bg-rose-950/30 text-rose-400 text-[11px] font-medium border border-[#2B3037] hover:border-rose-500/40 transition-colors"
                                    >
                                      Suspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateTenantStatus(t.id, "ACTIVE")}
                                      className="px-2 py-1 rounded bg-[#1C2025] hover:bg-emerald-950/30 text-emerald-400 text-[11px] font-medium border border-[#2B3037] hover:border-emerald-500/40 transition-colors"
                                    >
                                      Activate
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleExtendTrial(t.id)}
                                    className="px-2 py-1 rounded bg-[#1C2025] hover:bg-[#252B33] text-zinc-300 text-[11px] font-medium border border-[#2B3037] transition-colors"
                                    title="Extend trial by +14 days"
                                  >
                                    +14d Trial
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 3: SUBSCRIPTIONS & LKR PRICING PLANS
                ========================================================================= */}
            {activeTab === "subscriptions" && (
              <SuperAdminSubscriptionPackages
                tenants={tenants}
                financials={financials}
                onRefreshData={loadData}
              />
            )}

            {/* =========================================================================
                TAB 4: PLATFORM SAAS P&L & CLOUD COSTS
                ========================================================================= */}
            {activeTab === "financials" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Platform SaaS Financials (P&L)
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Subscription inflows vs AWS, PostgreSQL, Redis, and SMS expenses
                    </p>
                  </div>

                  <button
                    onClick={() => setIsExpenseOpen(true)}
                    className="h-9 px-4 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                    <span>Record Platform Expense</span>
                  </button>
                </div>

                {/* 3 Summary Financial Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <span className="text-xs font-semibold text-zinc-400">Total Monthly Inflow</span>
                    <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
                      Rs. {(financials?.totalInflowLkr ?? 0).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      MRR + 0.5% Payment gateway margins
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <span className="text-xs font-semibold text-zinc-400">Cloud & Operational Costs</span>
                    <div className="text-2xl font-black text-rose-400 font-mono mt-2">
                      Rs. {(financials?.totalPlatformExpensesLkr ?? 0).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      AWS ECS, RDS PostgreSQL, Redis, Twilio SMS
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <span className="text-xs font-semibold text-zinc-400">Net SaaS Margin</span>
                    <div className="text-2xl font-black text-white font-mono mt-2">
                      {(financials?.profitMarginPercent ?? 0).toFixed(1)}%
                    </div>
                    <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                      Net Profit: Rs. {(financials?.netSaaSProfitLkr ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Expenses Ledger */}
                <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                  <h3 className="text-sm font-bold text-white tracking-tight mb-4">
                    Platform Operational Expenses Breakdown
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1E2227] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Vendor / Service</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Amount (LKR)</th>
                          <th className="py-2.5 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1D21]">
                        {(financials?.expensesBreakdown || []).map((exp) => (
                          <tr key={exp.id} className="hover:bg-[#16181B] transition-colors">
                            <td className="py-3 px-3 font-semibold text-white">
                              {exp.vendor}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-zinc-400">
                              {exp.category}
                            </td>
                            <td className="py-3 px-3 text-zinc-300">
                              {exp.description}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-rose-400">
                              Rs. {exp.amountLkr.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-[11px] text-zinc-500 font-mono">
                              {new Date(exp.recordedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 5: VPS TELEMETRY, HEALTH & IN-VPS ALERTING
                ========================================================================= */}
            {activeTab === "telemetry" && (
              <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Single-VPS Health & Telemetry
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        8GB RAM • 100GB SSD • 4 vCPU
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Live host metrics, database round-trips, in-VPS alerting thresholds, and error diagnostics
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleManualBackup}
                      disabled={backupLoading}
                      className="h-8 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Database size={12} className={backupLoading ? "animate-spin" : ""} />
                      <span>{backupLoading ? "Creating Backup..." : "Run Database Backup"}</span>
                    </button>
                    <button
                      onClick={loadData}
                      className="h-8 px-3 rounded-lg bg-[#141619] border border-[#2B3037] text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                      <span>Refresh Live Telemetry</span>
                    </button>
                  </div>
                </div>

                {/* Backup Status Banner if triggered */}
                {backupStatus && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-300">{backupStatus}</span>
                    </div>
                    <button onClick={() => setBackupStatus(null)} className="text-emerald-400 hover:text-white text-xs">✕</button>
                  </div>
                )}

                {/* In-VPS Alerts Banner */}
                {telemetry?.alerts && telemetry.alerts.length > 0 ? (
                  <div className="space-y-2">
                    {telemetry.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                          alert.severity === "CRITICAL"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        }`}
                      >
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">{alert.title}</div>
                          <div className="text-[11px] opacity-90 mt-0.5">{alert.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#121417] border border-[#1E2227] flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-400" />
                    <span className="text-xs text-zinc-300 font-medium">
                      All VPS resources, memory allocations, and databases are healthy and within optimal operational thresholds.
                    </span>
                  </div>
                )}

                {/* Hardware Resource Meters (4 Cores CPU, 8GB RAM, 100GB SSD) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* CPU Meter */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-blue-400" />
                        <span className="text-xs font-semibold text-zinc-300">CPU Load (4 Cores)</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">
                        {telemetry?.cpu?.usagePercentage ?? 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1A1D21] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, telemetry?.cpu?.usagePercentage ?? 0)}%`,
                          backgroundColor:
                            (telemetry?.cpu?.usagePercentage ?? 0) > 85
                              ? "#EF4444"
                              : (telemetry?.cpu?.usagePercentage ?? 0) > 60
                              ? "#F59E0B"
                              : "#3B82F6",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>1m: {telemetry?.cpu?.loadAvg?.["1m"] ?? "0.00"}</span>
                      <span>5m: {telemetry?.cpu?.loadAvg?.["5m"] ?? "0.00"}</span>
                      <span>15m: {telemetry?.cpu?.loadAvg?.["15m"] ?? "0.00"}</span>
                    </div>
                  </div>

                  {/* RAM Meter */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server size={16} className="text-emerald-400" />
                        <span className="text-xs font-semibold text-zinc-300">Memory (RAM 8GB)</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">
                        {telemetry?.memory?.percentage ?? 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1A1D21] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, telemetry?.memory?.percentage ?? 0)}%`,
                          backgroundColor:
                            (telemetry?.memory?.percentage ?? 0) > 85
                              ? "#EF4444"
                              : (telemetry?.memory?.percentage ?? 0) > 70
                              ? "#F59E0B"
                              : "#10B981",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Used: {telemetry?.memory?.usedMb ?? 0} MB</span>
                      <span>Total: {telemetry?.memory?.totalMb ?? 8192} MB</span>
                    </div>
                  </div>

                  {/* Disk Meter */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive size={16} className="text-purple-400" />
                        <span className="text-xs font-semibold text-zinc-300">SSD Storage (100GB)</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">
                        {telemetry?.disk?.percentage ?? 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1A1D21] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, telemetry?.disk?.percentage ?? 0)}%`,
                          backgroundColor:
                            (telemetry?.disk?.percentage ?? 0) > 85
                              ? "#EF4444"
                              : (telemetry?.disk?.percentage ?? 0) > 70
                              ? "#F59E0B"
                              : "#A855F7",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Used: {telemetry?.disk?.usedGb ?? 0} GB</span>
                      <span>Free: {telemetry?.disk?.freeGb ?? 0} GB</span>
                    </div>
                  </div>
                </div>

                {/* Database & Redis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">PostgreSQL (Local VPS)</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        telemetry?.database?.status === "HEALTHY" || telemetry?.database?.status === "ONLINE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {telemetry?.database?.status ?? "ONLINE"}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-3">
                      {telemetry?.database?.latencyMs ?? 0} ms
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Query round-trip response time (SELECT 1)
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">Redis 6379 (Local VPS)</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        telemetry?.redis?.status === "ONLINE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {telemetry?.redis?.status ?? "ONLINE"}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-3">
                      {telemetry?.redis?.latencyMs ?? 0} ms
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      PING response latency
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">Continuous VPS Uptime</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-3">
                      {telemetry?.uptimeFormatted || `${Math.floor((telemetry?.uptimeSeconds ?? 0) / 3600)}h ${Math.floor(((telemetry?.uptimeSeconds ?? 0) % 3600) / 60)}m`}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Zero unplanned reboots
                    </span>
                  </div>
                </div>

                {/* Schedulers & Error Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Schedulers */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <h3 className="text-sm font-bold text-white tracking-tight mb-3">
                      Active In-VPS Background Schedulers
                    </h3>
                    <div className="divide-y divide-[#1A1D21]">
                      {(telemetry?.schedulers && telemetry.schedulers.length > 0 ? telemetry.schedulers : [
                        { name: "weekly-audit-digest", schedule: "0 8 * * 1 (Every Monday 08:00)", status: "ACTIVE" },
                        { name: "daily-db-backup", schedule: "0 2 * * * (Daily 02:00 UTC)", status: "ACTIVE" },
                        { name: "vps-log-rotation", schedule: "0 0 * * * (Daily 00:00 UTC)", status: "ACTIVE" },
                      ]).map((s) => (
                        <div key={s.name} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-zinc-500" />
                            <span className="font-semibold text-white text-xs">{s.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {s.schedule}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {s.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exception Tracking / Recent Errors */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        Live System Exception Diagnostics
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {recentErrors.length} recent events
                      </span>
                    </div>
                    {recentErrors.length === 0 ? (
                      <div className="py-8 text-center text-xs text-zinc-500">
                        ✓ Zero unhandled exceptions recorded in database. System is running cleanly.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#1A1D21] max-h-60 overflow-y-auto">
                        {recentErrors.map((err) => (
                          <div key={err.id} className="py-2.5 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-zinc-400 font-semibold truncate max-w-[200px]">
                                {err.method} {err.path}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                err.statusCode >= 500
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {err.statusCode}
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-400 line-clamp-1">
                              {err.humanReadable || err.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 6: GLOBAL FEATURE FLAGS & MASTER KILL-SWITCHES
                ========================================================================= */}
            {activeTab === "features" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                      <Cpu className="text-amber-400" size={24} />
                      Global Feature Flags & Master Kill-Switches
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      Manage platform-wide kill switches, emergency outages, and modular tier entitlements.
                    </p>
                  </div>
                </div>

                <SuperAdminFeatureFlags />
              </div>
            )}

            {/* =========================================================================
                TAB 7: CROSS-TENANT SECURITY & GLOBAL AUDIT LOG
                ========================================================================= */}
            {activeTab === "audit" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                      <ShieldCheck className="text-emerald-400" size={24} />
                      Cross-Tenant Security & Global Audit Trail
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      Immutable platform security ledger: monitor masquerade sessions, feature overrides, and administrative mutations.
                    </p>
                  </div>
                </div>

                <SuperAdminSecurityAudit tenants={tenants} />
              </div>
            )}

            {/* =========================================================================
                TAB 8: AUTOMATED DUNNING & DELINQUENCY MANAGER
                ========================================================================= */}
            {activeTab === "dunning" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                      <AlertTriangle className="text-amber-400" size={24} />
                      Automated Dunning, Delinquency & Grace Period Manager
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      Monitor overdue merchant subscriptions, manage 7-day grace periods, and execute automated suspension policies.
                    </p>
                  </div>
                </div>

                <SuperAdminDunningManager onRefreshData={loadData} />
              </div>
            )}

            {/* =========================================================================
                TAB 9: PLATFORM BROADCASTS & IN-APP ANNOUNCEMENT BANNERS
                ========================================================================= */}
            {activeTab === "announcements" && (
              <div className="space-y-6 animate-fade-in">
                <SuperAdminAnnouncements />
              </div>
            )}

            {/* =========================================================================
                TAB 10: DISASTER RECOVERY, DATABASE SNAPSHOTS & STORAGE MANAGER
                ========================================================================= */}
            {activeTab === "backups" && (
              <div className="space-y-6 animate-fade-in">
                <SuperAdminDisasterRecovery />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =========================================================================
          MODAL: TURNKEY TENANT PROVISIONING
          ========================================================================= */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#121417] border border-[#2B3037] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2227] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Provision Turnkey Tenant
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Creates isolated schema, main branch, and admin credentials
                </p>
              </div>
              <button
                onClick={() => setIsProvisionOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {provisionMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  provisionMsg.includes("successfully")
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {provisionMsg}
              </div>
            )}

            <form onSubmit={handleProvisionTenant} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Colombo Artisan Roastery"
                  value={provisionData.businessName}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    setProvisionData({ ...provisionData, businessName: name, slug });
                  }}
                  className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Workspace Slug
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. colombo-artisan"
                    value={provisionData.slug}
                    onChange={(e) =>
                      setProvisionData({ ...provisionData, slug: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Industry Archetype
                  </label>
                  <select
                    value={provisionData.businessType}
                    onChange={(e) =>
                      setProvisionData({ ...provisionData, businessType: e.target.value })
                    }
                    className="w-full h-9 px-2.5 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-zinc-400 cursor-pointer"
                  >
                    <option value="RETAIL">Retail & Apparel</option>
                    <option value="RESTAURANT_CAFE">Restaurant & Cafe</option>
                    <option value="GROCERY_SUPERMARKET">Supermarket & Grocery</option>
                    <option value="SALON_SPA">Salon & Wellness</option>
                    <option value="PHARMACY_CLINIC">Pharmacy & Healthcare</option>
                    <option value="AUTOMOTIVE_SERVICES">Automotive Services</option>
                    <option value="WHOLESALE_DISTRIBUTION">Wholesale & Distribution</option>
                    <option value="GENERAL_SERVICES">General Services</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Asitha Lakmal"
                    value={provisionData.adminFullName}
                    onChange={(e) =>
                      setProvisionData({ ...provisionData, adminFullName: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@business.com"
                    value={provisionData.adminEmail}
                    onChange={(e) =>
                      setProvisionData({ ...provisionData, adminEmail: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Initial Admin Password
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Password@123"
                    value={provisionData.adminPassword}
                    onChange={(e) =>
                      setProvisionData({ ...provisionData, adminPassword: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={provisionData.subscriptionTier}
                    onChange={(e) =>
                      setProvisionData({
                        ...provisionData,
                        subscriptionTier: e.target.value,
                      })
                    }
                    className="w-full h-9 px-2.5 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-zinc-400 cursor-pointer"
                  >
                    <option value="STARTER">Starter (Rs. 4,500/mo)</option>
                    <option value="GROWTH">Growth (Rs. 9,500/mo)</option>
                    <option value="ENTERPRISE">Enterprise (Rs. 18,500/mo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Initial Branch Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flagship Store - Colombo 07"
                  value={provisionData.initialBranchName}
                  onChange={(e) =>
                    setProvisionData({ ...provisionData, initialBranchName: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="pt-3 border-t border-[#1E2227] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProvisionOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-[#181A1D] text-zinc-300 text-xs font-medium hover:bg-[#22262B] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionLoading}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all disabled:opacity-50"
                >
                  {provisionLoading ? "Provisioning..." : "Provision Instance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RECORD PLATFORM EXPENSE
          ========================================================================= */}
      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#121417] border border-[#2B3037] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2227] pb-3">
              <h3 className="text-base font-bold text-white">Record Platform Cloud Expense</h3>
              <button
                onClick={() => setIsExpenseOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  required
                  value={expenseData.vendor}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, vendor: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Amount (LKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={expenseData.amountLkr}
                    onChange={(e) =>
                      setExpenseData({
                        ...expenseData,
                        amountLkr: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={expenseData.category}
                    onChange={(e) =>
                      setExpenseData({ ...expenseData, category: e.target.value as any })
                    }
                    className="w-full h-9 px-2 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-zinc-400 cursor-pointer"
                  >
                    <option value="CLOUD_SERVERS">Cloud Servers (AWS)</option>
                    <option value="DATABASE">PostgreSQL Aurora</option>
                    <option value="REDIS_CACHE">Redis Cluster</option>
                    <option value="SMS_GATEWAY">Dialog / Twilio SMS</option>
                    <option value="OPERATIONS">Operations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={expenseData.description}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, description: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="pt-3 border-t border-[#1E2227] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsExpenseOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-[#181A1D] text-zinc-300 text-xs font-medium hover:bg-[#22262B] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expenseLoading}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all disabled:opacity-50"
                >
                  {expenseLoading ? "Saving..." : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADJUST PLAN PRICE
          ========================================================================= */}
      {isPriceEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#121417] border border-[#2B3037] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Adjust {selectedPlanToEdit} Pricing (LKR)
            </h3>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Monthly Subscription Fee (Rs.)
              </label>
              <input
                type="number"
                value={newPlanPrice}
                onChange={(e) => setNewPlanPrice(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-sm text-white font-mono font-bold focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPriceEditorOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-[#181A1D] text-zinc-300 text-xs font-medium hover:bg-[#22262B] transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={priceUpdating}
                onClick={handleSavePrice}
                className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                {priceUpdating && <RefreshCw size={12} className="animate-spin" />}
                <span>{priceUpdating ? "Saving..." : "Save Price"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TENANT SETTINGS (SUPERADMIN)
          ========================================================================= */}
      {isTenantSettingsOpen && selectedTenantForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#121417] border border-[#2B3037] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2227]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings size={16} className="text-blue-400" />
                  Tenant Settings: {selectedTenantForEdit.name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  ID: {selectedTenantForEdit.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTenantSettingsOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTenantSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Business / Tenant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={tenantEditForm.name}
                    onChange={(e) =>
                      setTenantEditForm({ ...tenantEditForm, name: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Slug / Subdomain
                  </label>
                  <input
                    type="text"
                    required
                    value={tenantEditForm.slug}
                    onChange={(e) =>
                      setTenantEditForm({
                        ...tenantEditForm,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Business Type
                  </label>
                  <select
                    value={tenantEditForm.businessType}
                    onChange={(e) =>
                      setTenantEditForm({ ...tenantEditForm, businessType: e.target.value })
                    }
                    className="w-full h-9 px-2.5 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-zinc-400"
                  >
                    <option value="RETAIL">RETAIL</option>
                    <option value="RESTAURANT">RESTAURANT</option>
                    <option value="SERVICE">SERVICE</option>
                    <option value="HEALTHCARE">HEALTHCARE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={tenantEditForm.subscriptionTier}
                    onChange={(e) =>
                      setTenantEditForm({ ...tenantEditForm, subscriptionTier: e.target.value })
                    }
                    className="w-full h-9 px-2.5 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="GROWTH">GROWTH</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={tenantEditForm.status}
                    onChange={(e) =>
                      setTenantEditForm({ ...tenantEditForm, status: e.target.value })
                    }
                    className="w-full h-9 px-2.5 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIAL">TRIAL</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1E2227]">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Max Allowed Branches
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={tenantEditForm.maxBranches}
                    onChange={(e) =>
                      setTenantEditForm({
                        ...tenantEditForm,
                        maxBranches: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Max Allowed Users
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={tenantEditForm.maxUsers}
                    onChange={(e) =>
                      setTenantEditForm({
                        ...tenantEditForm,
                        maxUsers: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={tenantEditForm.taxRate}
                    onChange={(e) =>
                      setTenantEditForm({
                        ...tenantEditForm,
                        taxRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Currency Code
                  </label>
                  <input
                    type="text"
                    value={tenantEditForm.currency}
                    onChange={(e) =>
                      setTenantEditForm({
                        ...tenantEditForm,
                        currency: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={tenantEditForm.currencySymbol}
                    onChange={(e) =>
                      setTenantEditForm({
                        ...tenantEditForm,
                        currencySymbol: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#1E2227] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTenantSettingsOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-[#181A1D] text-zinc-300 text-xs font-medium hover:bg-[#22262B] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tenantEditLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {tenantEditLoading && <RefreshCw size={12} className="animate-spin" />}
                  <span>{tenantEditLoading ? "Saving..." : "Save Settings"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TENANT SUPER ADMINS MANAGEMENT
          ========================================================================= */}
      {isTenantAdminsOpen && selectedTenantForAdmins && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#121417] border border-[#2B3037] p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1E2227] pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Tenant Super Admins
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                    {selectedTenantForAdmins.name}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  Tenant ID: {selectedTenantForAdmins.id} • Slug: {selectedTenantForAdmins.slug}
                </p>
              </div>
              <button
                onClick={() => setIsTenantAdminsOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {adminActionMsg && (
              <div className="p-3 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                {adminActionMsg}
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-400 font-medium">
                {tenantAdminsList.length} Administrator{tenantAdminsList.length === 1 ? "" : "s"} Assigned
              </span>
              <button
                onClick={() => setIsAddAdminOpen(!isAddAdminOpen)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus size={13} />
                <span>{isAddAdminOpen ? "Close Form" : "Add Super Admin"}</span>
              </button>
            </div>

            {/* Add Admin Form Accordion */}
            {isAddAdminOpen && (
              <form onSubmit={handleCreateTenantAdmin} className="p-4 rounded-xl bg-[#181A1D] border border-[#2B3037] space-y-3 shrink-0 animate-fade-in">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                  <Users size={14} className="text-amber-400" />
                  <span>Create New Tenant Administrator</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kasun Fernando"
                      value={newAdminForm.name}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                      className="w-full h-8 px-3 rounded-lg bg-[#121417] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@tenant.com"
                      value={newAdminForm.email}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                      className="w-full h-8 px-3 rounded-lg bg-[#121417] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Initial Password</label>
                    <input
                      type="text"
                      required
                      placeholder="Password@123"
                      value={newAdminForm.password}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                      className="w-full h-8 px-3 rounded-lg bg-[#121417] border border-[#2B3037] text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Phone (Optional)</label>
                    <input
                      type="text"
                      placeholder="+94 77 123 4567"
                      value={newAdminForm.phone}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                      className="w-full h-8 px-3 rounded-lg bg-[#121417] border border-[#2B3037] text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddAdminOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#121417] text-zinc-400 hover:text-white text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addAdminLoading}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-50"
                  >
                    {addAdminLoading ? "Creating..." : "Save Admin"}
                  </button>
                </div>
              </form>
            )}

            {/* Admins Table */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-[#1E2227] bg-[#16181B]">
              {tenantAdminsLoading ? (
                <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin text-zinc-400" />
                  <span className="text-xs">Loading tenant administrators...</span>
                </div>
              ) : tenantAdminsList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No administrators configured for this tenant.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121417] text-zinc-400 border-b border-[#1E2227] text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Administrator</th>
                      <th className="py-2.5 px-3">Branch</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2227]">
                    {tenantAdminsList.map((adm) => (
                      <tr key={adm.id} className="hover:bg-[#1A1D21] transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{adm.name || "Tenant Admin"}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{adm.email}</div>
                          {adm.phone && <div className="text-[10px] text-zinc-500">{adm.phone}</div>}
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-300 text-[11px]">
                          {adm.branch?.name || "All Branches"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                              adm.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {adm.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleAdminStatus(adm.id, adm.status)}
                              className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                                adm.status === "ACTIVE"
                                  ? "bg-[#1C2025] hover:bg-rose-950/30 text-rose-400 border-[#2B3037] hover:border-rose-500/40"
                                  : "bg-[#1C2025] hover:bg-emerald-950/30 text-emerald-400 border-[#2B3037] hover:border-emerald-500/40"
                              }`}
                              title={adm.status === "ACTIVE" ? "Suspend Admin" : "Activate Admin"}
                            >
                              {adm.status === "ACTIVE" ? "Suspend" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleResetAdminPassword(adm.id, adm.email)}
                              className="px-2 py-1 rounded bg-[#1C2025] hover:bg-amber-950/40 text-amber-400 text-[11px] font-medium border border-[#2B3037] hover:border-amber-500/40 transition-colors flex items-center gap-1"
                              title="Reset Password"
                            >
                              <KeyRound size={11} />
                              <span>Reset PW</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-[#1E2227] flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsTenantAdminsOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#181A1D] text-zinc-300 text-xs font-medium hover:bg-[#22262B] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TENANT ENTITLEMENTS & MODULAR FEATURE OVERRIDES
          ========================================================================= */}
      {entitlementsTenant && (
        <TenantEntitlementsModal
          tenant={entitlementsTenant}
          onClose={() => setEntitlementsTenant(null)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
