"use client";

import React, { useState, useEffect } from "react";
import {
  superAdminService,
  PlatformKPIs,
  PlatformFinancials,
  TenantRegistryItem,
  ClusterTelemetry,
} from "@/services/superadmin.service";
import { subscriptionService, PlanConfig } from "@/services/subscription.service";
import { useAuthStore } from "@/store/auth.store";
import {
  Building2,
  TrendingUp,
  CreditCard,
  Server,
  DollarSign,
  Users,
  Search,
  Filter,
  Plus,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Database,
  Cpu,
  Zap,
  Sliders,
  X,
  Store,
  Utensils,
  Scissors,
  Pill,
  ShoppingBag,
  Truck,
  Sparkles,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"tenants" | "subscriptions" | "financials" | "cluster">("tenants");
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [financials, setFinancials] = useState<PlatformFinancials | null>(null);
  const [tenants, setTenants] = useState<TenantRegistryItem[]>([]);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [cluster, setCluster] = useState<ClusterTelemetry | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modals
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [selectedTenantDetails, setSelectedTenantDetails] = useState<TenantRegistryItem | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Provision Form
  const [provForm, setProvForm] = useState({
    name: "",
    slug: "",
    businessType: "RETAIL",
    subscriptionTier: "GROWTH",
    adminEmail: "",
    adminPassword: "Password@123",
    adminName: "",
    initialBranchName: "Flagship Outlet",
  });

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({
    category: "CLOUD_SERVERS" as const,
    amountLkr: 25000,
    vendor: "AWS Cloud Services",
    description: "Extra EC2 Compute Nodes",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpisRes, finRes, tenantsRes, plansRes, clusterRes] = await Promise.all([
        superAdminService.getKPIs(),
        superAdminService.getFinancials(),
        superAdminService.getTenants(),
        subscriptionService.getPlans(),
        superAdminService.getClusterTelemetry(),
      ]);
      setKpis(kpisRes);
      setFinancials(finRes);
      setTenants(tenantsRes);
      setPlans(plansRes);
      setCluster(clusterRes);
    } catch (err) {
      console.error("Failed to load SuperAdmin platform data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (tenantId: string, newStatus: "ACTIVE" | "SUSPENDED" | "TRIAL") => {
    try {
      await superAdminService.updateTenantStatus(tenantId, newStatus);
      setActionMessage(`✅ Tenant status successfully updated to ${newStatus}`);
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    } catch (e: any) {
      alert(`Error updating tenant status: ${e.message}`);
    }
  };

  const handleExtendTrial = async (tenantId: string) => {
    try {
      await superAdminService.extendTrial(tenantId, 14);
      setActionMessage("✅ 14-Day Free Trial extended for tenant.");
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    } catch (e: any) {
      alert(`Error extending trial: ${e.message}`);
    }
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superAdminService.provisionTenant({
        name: provForm.name,
        slug: provForm.slug || undefined,
        businessType: provForm.businessType,
        subscriptionTier: provForm.subscriptionTier,
        initialBranchName: provForm.initialBranchName,
        adminUser: {
          email: provForm.adminEmail,
          password: provForm.adminPassword,
          name: provForm.adminName || provForm.name + " Admin",
        },
      });
      setIsProvisionModalOpen(false);
      setActionMessage(`✅ New turnkey tenant [${provForm.name}] provisioned successfully!`);
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    } catch (err: any) {
      alert(`Provisioning failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSavePlanPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      await subscriptionService.updatePlan(editingPlan.key, {
        monthlyLkr: Number(editingPlan.monthlyLkr),
        name: editingPlan.name,
      });
      setEditingPlan(null);
      setActionMessage(`✅ Plan ${editingPlan.key} pricing saved in LKR.`);
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    } catch (err: any) {
      alert(`Failed to save plan: ${err.message}`);
    }
  };

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superAdminService.addExpense(expenseForm);
      setIsAddExpenseModalOpen(false);
      setActionMessage("✅ Platform operational expense recorded.");
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    } catch (err: any) {
      alert(`Failed to record expense: ${err.message}`);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "ALL" || t.businessType === selectedType;
    const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getBusinessIcon = (type: string) => {
    switch (type) {
      case "RESTAURANT_CAFE":
        return <Utensils size={15} className="text-amber-400" />;
      case "SALON_SPA":
        return <Scissors size={15} className="text-rose-400" />;
      case "PHARMACY_CLINIC":
        return <Pill size={15} className="text-emerald-400" />;
      case "WHOLESALE_DISTRIBUTION":
        return <Truck size={15} className="text-indigo-400" />;
      default:
        return <ShoppingBag size={15} className="text-cyan-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#090D16] text-stone-100">
      
      {/* Top Mission Control Header */}
      <header className="sticky top-0 z-50 bg-[#0E131F]/90 backdrop-blur-md border-b border-stone-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-cyan-500/20">
            X
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">XONIT SPACE</h1>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 tracking-wider">
                Super Admin Control Center
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono">
              Universal Multi-Tenant SaaS Cloud Platform • Sri Lanka
            </p>
          </div>
        </div>

        {/* Cluster Telemetry Pills */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono">
            <Database size={13} className="text-cyan-400" />
            <span className="text-stone-300">PostgreSQL:</span>
            <span className="text-emerald-400 font-bold">{cluster?.database.latencyMs || 2}ms</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono">
            <Zap size={13} className="text-amber-400" />
            <span className="text-stone-300">Redis 6379:</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono">
            <Server size={13} className="text-purple-400" />
            <span className="text-stone-300">Schedulers:</span>
            <span className="text-purple-300 font-bold">3 Active</span>
          </div>
        </div>

        {/* User & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-white">{user?.name || "Asitha K."}</span>
            <span className="text-[10px] text-stone-400 font-mono">Platform Executive</span>
          </div>

          <button
            onClick={() => useAuthStore.getState().logout("/login")}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
            title="Sign Out of Super Admin"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Action Banner */}
      {actionMessage && (
        <div className="bg-cyan-950/80 border-b border-cyan-500/30 px-6 py-2.5 text-xs font-mono text-cyan-300 flex items-center justify-between animate-in fade-in">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-cyan-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Executive SaaS KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MRR Card */}
          <div className="p-5 rounded-2xl bg-[#0E131F] border border-stone-800/80 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono uppercase text-stone-400 font-bold tracking-wider">
                  Monthly Recurring Revenue (MRR)
                </span>
                <div className="text-2xl lg:text-3xl font-black font-mono text-cyan-400 mt-2">
                  Rs. {(kpis?.mrrLkr || 0).toLocaleString()}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
              <span>Annual Run-Rate (ARR)</span>
              <span className="font-mono font-bold text-white">Rs. {(kpis?.arrLkr || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Platform GMV */}
          <div className="p-5 rounded-2xl bg-[#0E131F] border border-stone-800/80 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono uppercase text-stone-400 font-bold tracking-wider">
                  Platform GMV Volume
                </span>
                <div className="text-2xl lg:text-3xl font-black font-mono text-indigo-400 mt-2">
                  Rs. {(kpis?.platformGmvLkr || 0).toLocaleString()}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
              <span>Nationwide POS Orders</span>
              <span className="font-mono font-bold text-white">{kpis?.totalOrders || 0} Paid</span>
            </div>
          </div>

          {/* Tenants Count */}
          <div className="p-5 rounded-2xl bg-[#0E131F] border border-stone-800/80 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono uppercase text-stone-400 font-bold tracking-wider">
                  Active Business Tenants
                </span>
                <div className="text-2xl lg:text-3xl font-black font-mono text-white mt-2">
                  {kpis?.totalTenants || 0} <span className="text-sm font-normal text-stone-400">Tenants</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Building2 size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-3 text-xs">
              <span className="text-emerald-400 font-mono font-bold">{kpis?.activeTenants || 0} Active</span>
              <span className="text-stone-500">•</span>
              <span className="text-amber-400 font-mono font-bold">{kpis?.trialTenants || 0} Trials</span>
              <span className="text-stone-500">•</span>
              <span className="text-rose-400 font-mono font-bold">{kpis?.suspendedTenants || 0} Hold</span>
            </div>
          </div>

          {/* Platform Net SaaS Profit */}
          <div className="p-5 rounded-2xl bg-[#0E131F] border border-stone-800/80 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono uppercase text-stone-400 font-bold tracking-wider">
                  Platform Net SaaS Margin
                </span>
                <div className="text-2xl lg:text-3xl font-black font-mono text-emerald-400 mt-2">
                  Rs. {(financials?.netSaaSProfitLkr || 0).toLocaleString()}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
              <span>Operating Costs</span>
              <span className="font-mono text-rose-400 font-bold">
                -Rs. {(financials?.totalPlatformExpensesLkr || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Provision Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2 bg-[#0E131F] p-1 rounded-2xl border border-stone-800/80 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("tenants")}
              className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                activeTab === "tenants"
                  ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Building2 size={15} />
              <span>Tenants Directory</span>
            </button>

            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                activeTab === "subscriptions"
                  ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <CreditCard size={15} />
              <span>Subscriptions & LKR Pricing</span>
            </button>

            <button
              onClick={() => setActiveTab("financials")}
              className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                activeTab === "financials"
                  ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <DollarSign size={15} />
              <span>Platform P&L Statement</span>
            </button>

            <button
              onClick={() => setActiveTab("cluster")}
              className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                activeTab === "cluster"
                  ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Server size={15} />
              <span>Cluster Telemetry</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-colors"
              title="Refresh Platform Metrics"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={() => setIsProvisionModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus size={16} />
              <span>Provision Turnkey Tenant</span>
            </button>
          </div>
        </div>

        {/* TAB 1: TENANTS REGISTRY */}
        {activeTab === "tenants" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search and Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6 relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search tenant by company name or workspace slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0E131F] border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-[#0E131F] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="ALL">All Business Types</option>
                  <option value="RETAIL">Retail & Apparel</option>
                  <option value="RESTAURANT_CAFE">Restaurant & Cafe (KOT)</option>
                  <option value="SALON_SPA">Salon & Wellness</option>
                  <option value="PHARMACY_CLINIC">Pharmacy & Healthcare</option>
                  <option value="GROCERY_SUPERMARKET">Grocery & Scales</option>
                  <option value="WHOLESALE_DISTRIBUTION">Wholesale & Credit</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-[#0E131F] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE (Paying)</option>
                  <option value="TRIAL">TRIAL (14 Days)</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            </div>

            {/* High-Density Tenants Table */}
            <div className="bg-[#0E131F] border border-stone-800 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-900/60 border-b border-stone-800 text-stone-400 font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Organization & Workspace</th>
                    <th className="py-3.5 px-4">Archetype</th>
                    <th className="py-3.5 px-4">Plan Tier</th>
                    <th className="py-3.5 px-4">Branches & Users</th>
                    <th className="py-3.5 px-4 text-center">Orders & GMV</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-stone-500 font-mono">
                        No enterprise tenants match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-stone-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{t.name}</div>
                          <div className="text-[11px] font-mono text-cyan-400 mt-0.5">{t.slug}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-stone-300">
                            {getBusinessIcon(t.businessType)}
                            <span className="capitalize text-[11px]">
                              {t.businessType.toLowerCase().replace(/_/g, " ")}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold">
                            {t.subscriptionTier}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-stone-300 text-xs">
                            Branches: <span className="font-bold text-white">{t.branchesCount}</span> / {t.maxBranches}
                          </div>
                          <div className="text-stone-400 text-[11px] mt-0.5">
                            Users: <span className="font-bold text-white">{t.usersCount}</span> / {t.maxUsers}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono">
                          <div className="font-bold text-white">{t.ordersCount} Orders</div>
                          <div className="text-[10px] text-stone-500">Products: {t.productsCount}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              t.status === "ACTIVE"
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                : t.status === "TRIAL"
                                ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {t.status === "ACTIVE" ? (
                              <button
                                onClick={() => handleStatusChange(t.id, "SUSPENDED")}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-[11px] transition-colors"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(t.id, "ACTIVE")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px] transition-colors"
                              >
                                Activate
                              </button>
                            )}

                            {t.status === "TRIAL" && (
                              <button
                                onClick={() => handleExtendTrial(t.id)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-[11px] transition-colors"
                                title="Grant extra 14 trial days"
                              >
                                +14d Trial
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedTenantDetails(t)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                              title="View Tenant Quotas & Branches"
                            >
                              <ChevronRight size={14} />
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
        )}

        {/* TAB 2: SUBSCRIPTIONS & LKR PRICING */}
        {activeTab === "subscriptions" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* LKR Base Pricing Plans Governance */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-white">Platform Subscription Tiers in LKR</h3>
                  <p className="text-xs text-stone-400">
                    Super Admin controlled monthly base pricing with automated 10% Quarterly & 20% Annual discounts.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {plans.map((p) => (
                  <div
                    key={p.key}
                    className="p-6 rounded-2xl bg-[#0E131F] border border-stone-800 flex flex-col justify-between shadow-xl relative"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg text-white">{p.name}</span>
                        {p.badge && (
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            {p.badge}
                          </span>
                        )}
                      </div>

                      <div className="text-3xl font-black font-mono text-cyan-400 my-3">
                        Rs. {p.monthlyLkr.toLocaleString()}
                        <span className="text-xs font-normal text-stone-400"> / month</span>
                      </div>

                      <div className="space-y-1.5 py-3 border-y border-stone-800 text-xs font-mono text-stone-400">
                        <div className="flex justify-between">
                          <span>Quarterly (10% off):</span>
                          <span className="text-white font-bold">Rs. {p.quarterlyLkr.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual (20% off):</span>
                          <span className="text-white font-bold">Rs. {p.annualLkr.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-indigo-400">
                          <span>Max Outlets:</span>
                          <span className="font-bold">{p.maxBranches} Branch(es)</span>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2 text-xs text-stone-300">
                        {p.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => setEditingPlan(p)}
                      className="mt-6 w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Sliders size={14} />
                      <span>Edit Base Pricing</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Tenant Invoices Ledger */}
            <div className="bg-[#0E131F] border border-stone-800 rounded-2xl p-6 shadow-xl">
              <h4 className="font-bold text-base text-white mb-1">Recent Platform Subscription Invoices</h4>
              <p className="text-xs text-stone-400 mb-4 font-mono">
                Automated recurring invoice ledger generated for registered enterprise tenants in LKR.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400 font-mono uppercase text-[11px]">
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Amount in LKR</th>
                      <th className="py-2.5 px-3">Billing Cycle</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono">
                    {financials?.recentInvoices && financials.recentInvoices.length > 0 ? (
                      financials.recentInvoices.map((inv: any, idx: number) => (
                        <tr key={idx} className="hover:bg-stone-900/40">
                          <td className="py-2.5 px-3 font-bold text-white">
                            {inv.invoiceNumber || inv.id || `INV-2026-${idx + 1}`}
                          </td>
                          <td className="py-2.5 px-3 text-cyan-400 font-bold">
                            Rs. {(inv.amountLkr || inv.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-stone-300">
                            {inv.billingCycle || inv.plan || "MONTHLY"}
                          </td>
                          <td className="py-2.5 px-3 text-stone-400">
                            {new Date(inv.issuedAt || inv.date || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                              {inv.status || "PAID"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-stone-500">
                          No recent invoices recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM P&L (REVENUE VS EXPENSES) */}
        {activeTab === "financials" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* SaaS Net Margin Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0E131F] to-[#121B2D] border border-cyan-500/30 shadow-xl">
                <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                  Total Platform Inflow
                </span>
                <div className="text-3xl font-black font-mono text-white mt-2">
                  Rs. {(financials?.totalInflowLkr || 0).toLocaleString()}
                </div>
                <div className="mt-3 text-xs text-stone-400 font-mono space-y-1">
                  <div>Subscriptions: Rs. {(financials?.grossSubscriptionRevenueLkr || 0).toLocaleString()}</div>
                  <div>0.5% Payment Margin: Rs. {(financials?.gatewayMarginRevenueLkr || 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0E131F] to-[#1F1218] border border-rose-500/30 shadow-xl">
                <span className="text-xs font-mono uppercase text-rose-400 font-bold tracking-wider">
                  Platform Cloud & Ops Costs
                </span>
                <div className="text-3xl font-black font-mono text-rose-400 mt-2">
                  -Rs. {(financials?.totalPlatformExpensesLkr || 0).toLocaleString()}
                </div>
                <div className="mt-3 text-xs text-stone-400 font-mono">
                  Hosting, DB, Redis, SMS credits & WAF
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0E131F] to-[#0D2419] border border-emerald-500/30 shadow-xl">
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
                  Net SaaS Profit / Burn
                </span>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
                  Rs. {(financials?.netSaaSProfitLkr || 0).toLocaleString()}
                </div>
                <div className="mt-3 text-xs text-stone-400 font-mono">
                  Net Margin: <span className="font-bold text-white">{financials?.profitMarginPercent || 0}%</span>
                </div>
              </div>
            </div>

            {/* Expense Breakdown Ledger */}
            <div className="p-6 rounded-2xl bg-[#0E131F] border border-stone-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-base text-white">Platform Infrastructure Expenses</h4>
                  <p className="text-xs text-stone-400">
                    Live operational costs incurred to run the XONIT multi-tenant cloud cluster.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddExpenseModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors border border-stone-700"
                >
                  <Plus size={14} />
                  <span>Record Platform Expense</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400 font-mono uppercase text-[11px]">
                      <th className="py-2.5 px-3">Expense Category</th>
                      <th className="py-2.5 px-3">Vendor / Provider</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Cost (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono">
                    {financials?.expensesBreakdown.map((exp) => (
                      <tr key={exp.id} className="hover:bg-stone-900/40">
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-bold text-[10px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">{exp.vendor}</td>
                        <td className="py-3 px-3 text-stone-400">{exp.description}</td>
                        <td className="py-3 px-3 text-right font-bold text-rose-400">
                          Rs. {exp.amountLkr.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CLUSTER TELEMETRY */}
        {activeTab === "cluster" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-[#0E131F] border border-stone-800 shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">PostgreSQL Cluster</h4>
                    <span className="text-xs text-emerald-400 font-mono">STATUS: HEALTHY</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-stone-800 text-xs font-mono text-stone-400 flex justify-between">
                  <span>Ping Latency:</span>
                  <span className="text-white font-bold">{cluster?.database.latencyMs || 2} ms</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#0E131F] border border-stone-800 shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Redis In-Memory Engine</h4>
                    <span className="text-xs text-emerald-400 font-mono">STATUS: ONLINE (6379)</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-stone-800 text-xs font-mono text-stone-400 flex justify-between">
                  <span>Ping Latency:</span>
                  <span className="text-white font-bold">{cluster?.redis.latencyMs || 1} ms</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#0E131F] border border-stone-800 shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Server Uptime</h4>
                    <span className="text-xs text-purple-400 font-mono">
                      {Math.floor((cluster?.uptimeSeconds || 3600) / 3600)} Hours Online
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-stone-800 text-xs font-mono text-stone-400 flex justify-between">
                  <span>Tenant Isolation:</span>
                  <span className="text-emerald-400 font-bold">100% Enforced</span>
                </div>
              </div>
            </div>

            {/* Background Workers & Schedulers Table */}
            <div className="p-6 rounded-2xl bg-[#0E131F] border border-stone-800 shadow-xl">
              <h4 className="font-bold text-base text-white mb-2">Platform Background Schedulers</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400 uppercase text-[11px]">
                      <th className="py-2 px-3">Job Name</th>
                      <th className="py-2 px-3">Cron Expression</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {cluster?.schedulers.map((job, idx) => (
                      <tr key={idx} className="hover:bg-stone-900/40">
                        <td className="py-2.5 px-3 font-semibold text-white">{job.name}</td>
                        <td className="py-2.5 px-3 text-cyan-400">{job.schedule}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">ACTIVE</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: PROVISION TURNKEY TENANT */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0E131F] border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-5 text-stone-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                <h3 className="font-bold text-base text-white">Provision New Turnkey Business Tenant</h3>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-stone-400 block mb-1">Company / Store Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ceylon Gem & Jewelry"
                    value={provForm.name}
                    onChange={(e) => setProvForm({ ...provForm, name: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Workspace Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={provForm.slug}
                    onChange={(e) => setProvForm({ ...provForm, slug: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-stone-400 block mb-1">Business Archetype</label>
                  <select
                    value={provForm.businessType}
                    onChange={(e) => setProvForm({ ...provForm, businessType: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="RETAIL">Retail & Apparel</option>
                    <option value="RESTAURANT_CAFE">Restaurant & Cafe (KOT)</option>
                    <option value="SALON_SPA">Salon & Wellness</option>
                    <option value="PHARMACY_CLINIC">Pharmacy & Healthcare</option>
                    <option value="GROCERY_SUPERMARKET">Grocery & Scale</option>
                    <option value="WHOLESALE_DISTRIBUTION">Wholesale & Credit</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Subscription Plan</label>
                  <select
                    value={provForm.subscriptionTier}
                    onChange={(e) => setProvForm({ ...provForm, subscriptionTier: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="STARTER">STARTER (Rs. 4,500/mo)</option>
                    <option value="GROWTH">GROWTH (Rs. 9,500/mo)</option>
                    <option value="ENTERPRISE">ENTERPRISE (Rs. 18,500/mo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-800">
                <div>
                  <label className="text-stone-400 block mb-1">Initial Admin Email</label>
                  <input
                    type="email"
                    required
                    placeholder="owner@business.lk"
                    value={provForm.adminEmail}
                    onChange={(e) => setProvForm({ ...provForm, adminEmail: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    value={provForm.adminPassword}
                    onChange={(e) => setProvForm({ ...provForm, adminPassword: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/20"
                >
                  Provision & Seed Turnkey Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PLAN BASE PRICING */}
      {editingPlan && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0E131F] border border-stone-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 text-stone-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-base text-white">Edit {editingPlan.key} Base Pricing</h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 text-stone-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlanPrice} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-stone-400 block mb-1">Monthly Base Price in LKR</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={500}
                  value={editingPlan.monthlyLkr}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, monthlyLkr: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-cyan-400 text-lg font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-[11px] text-stone-400 space-y-1">
                <div className="flex justify-between">
                  <span>Auto-calculated Quarterly (10% off):</span>
                  <span className="text-white font-bold">
                    Rs. {(editingPlan.monthlyLkr * 3 * 0.9).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-calculated Annual (20% off):</span>
                  <span className="text-white font-bold">
                    Rs. {(editingPlan.monthlyLkr * 12 * 0.8).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                >
                  Save New Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD PLATFORM EXPENSE */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0E131F] border border-stone-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 text-stone-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-base text-white">Record Platform Infrastructure Cost</h3>
              <button
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="text-stone-400 block mb-1">Expense Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="CLOUD_SERVERS">Cloud Servers & Compute (AWS/DO)</option>
                  <option value="DATABASE">Database Relational Cluster (PostgreSQL)</option>
                  <option value="REDIS_CACHE">Redis In-Memory Engine</option>
                  <option value="SMS_GATEWAY">SMS & OTP Telecom Gateway (Dialog/Mobitel)</option>
                  <option value="SECURITY_SSL">Security, WAF & SSL</option>
                  <option value="OPERATIONS">Platform Maintenance & Licenses</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Vendor / Service Provider</label>
                <input
                  type="text"
                  required
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Amount in LKR</label>
                <input
                  type="number"
                  required
                  value={expenseForm.amountLkr}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amountLkr: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Description / Bill Notes</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: TENANT QUOTA & DETAILS */}
      {selectedTenantDetails && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0E131F] border-l border-stone-800 h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-white">{selectedTenantDetails.name}</h3>
                  <span className="font-mono text-cyan-400 text-xs">/{selectedTenantDetails.slug}</span>
                </div>
                <button
                  onClick={() => setSelectedTenantDetails(null)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
                  <span className="text-stone-400 uppercase text-[10px] font-bold block">Resource Quota Usage</span>
                  <div className="flex justify-between text-stone-300">
                    <span>Active Outlets:</span>
                    <span className="font-bold text-white">
                      {selectedTenantDetails.branchesCount} / {selectedTenantDetails.maxBranches}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-300">
                    <span>Staff Accounts:</span>
                    <span className="font-bold text-white">
                      {selectedTenantDetails.usersCount} / {selectedTenantDetails.maxUsers}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
                  <span className="text-stone-400 uppercase text-[10px] font-bold block">Commerce Volume</span>
                  <div className="flex justify-between text-stone-300">
                    <span>Total SKU Products:</span>
                    <span className="font-bold text-white">{selectedTenantDetails.productsCount}</span>
                  </div>
                  <div className="flex justify-between text-stone-300">
                    <span>Total Orders Processed:</span>
                    <span className="font-bold text-white">{selectedTenantDetails.ordersCount}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
                  <span className="text-stone-400 uppercase text-[10px] font-bold block">Status & Tier</span>
                  <div className="flex justify-between text-stone-300">
                    <span>Tier:</span>
                    <span className="font-bold text-indigo-400">{selectedTenantDetails.subscriptionTier}</span>
                  </div>
                  <div className="flex justify-between text-stone-300">
                    <span>Status:</span>
                    <span className="font-bold text-emerald-400">{selectedTenantDetails.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800">
              <button
                onClick={() => setSelectedTenantDetails(null)}
                className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
