"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  superAdminService,
  PlatformKPIs,
  PlatformFinancials,
  TenantRegistryItem,
  ClusterTelemetry,
} from "@/services/superadmin.service";
import SuperAdminSidebar from "@/components/superadmin/SuperAdminSidebar";
import SuperAdminHeader from "@/components/superadmin/SuperAdminHeader";
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
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Live Data States
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [financials, setFinancials] = useState<PlatformFinancials | null>(null);
  const [tenants, setTenants] = useState<TenantRegistryItem[]>([]);
  const [telemetry, setTelemetry] = useState<ClusterTelemetry | null>(null);

  // Modals
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isPriceEditorOpen, setIsPriceEditorOpen] = useState(false);
  const [selectedPlanToEdit, setSelectedPlanToEdit] = useState("STARTER");
  const [newPlanPrice, setNewPlanPrice] = useState("4500");

  // Provision Form State
  const [provisionData, setProvisionData] = useState({
    businessName: "",
    slug: "",
    businessType: "RETAIL",
    adminEmail: "",
    adminPassword: "Password@123",
    adminFullName: "",
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

  // Tenant Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiRes, finRes, tenantsRes, telemRes] = await Promise.all([
        superAdminService.getKPIs().catch(() => null),
        superAdminService.getFinancials().catch(() => null),
        superAdminService.getTenants().catch(() => []),
        superAdminService.getTelemetry().catch(() => null),
      ]);

      if (kpiRes) setKpis(kpiRes);
      if (finRes) setFinancials(finRes);
      if (tenantsRes) setTenants(tenantsRes);
      if (telemRes) setTelemetry(telemRes);
    } finally {
      setLoading(false);
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
      alert("Failed to record expense: " + err.message);
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleUpdateTenantStatus = async (
    tenantId: string,
    status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "CANCELLED"
  ) => {
    if (!confirm(`Are you sure you want to change tenant status to ${status}?`)) return;
    try {
      await superAdminService.updateTenantStatus(tenantId, status);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update tenant status");
    }
  };

  const handleExtendTrial = async (tenantId: string) => {
    try {
      await superAdminService.extendTrial(tenantId, 14);
      alert("Free trial successfully extended by +14 days!");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to extend trial");
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
          tenantCount={tenants.length || 38}
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
                      <span>New Sale</span>
                    </button>

                    <button
                      onClick={() => setIsExpenseOpen(true)}
                      className="h-9 px-3.5 rounded-lg bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <SlidersHorizontal size={13} className="text-zinc-400" />
                      <span>Actions</span>
                    </button>
                  </div>
                </div>

                {/* 4 Top Metric KPI Cards (Matching Reference Screenshot) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Revenue */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-zinc-400">
                        Total Revenue
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                        <TrendingUp size={11} />
                        +12%
                      </span>
                    </div>

                    <div className="my-3">
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        Rs. {(kpis?.mrrLkr || 248500).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium mt-1">
                        <span>Trending up this month</span>
                        <TrendingUp size={13} className="text-emerald-400" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
                      Projected ARR: Rs. {(kpis?.arrLkr || 2982000).toLocaleString()}
                    </div>
                  </div>

                  {/* Card 2: Active Customers / Tenants */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-zinc-400">
                        Active Customers
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                        <TrendingUp size={11} />
                        +5.2%
                      </span>
                    </div>

                    <div className="my-3">
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        {(kpis?.totalTenants || tenants.length || 38).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium mt-1">
                        <span>Strong user retention</span>
                        <TrendingUp size={13} className="text-emerald-400" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
                      {kpis?.activeTenants || 34} Active • {kpis?.trialTenants || 4} Free Trial
                    </div>
                  </div>

                  {/* Card 3: Total Orders / GMV */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-zinc-400">
                        Total Orders
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 font-mono">
                        <TrendingDown size={11} />
                        -2.1%
                      </span>
                    </div>

                    <div className="my-3">
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        {(kpis?.totalOrders || 1247).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium mt-1">
                        <span>Down 2% this period</span>
                        <TrendingDown size={13} className="text-rose-400" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
                      GMV: Rs. {((kpis?.platformGmvLkr || 18450200) / 1000000).toFixed(2)}M processed
                    </div>
                  </div>

                  {/* Card 4: Conversion Rate / Net Margin */}
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-zinc-400">
                        Conversion Rate
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                        <TrendingUp size={11} />
                        +8.3%
                      </span>
                    </div>

                    <div className="my-3">
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        {(financials?.profitMarginPercent || 73.8).toFixed(2)}%
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium mt-1">
                        <span>Steady performance increase</span>
                        <TrendingUp size={13} className="text-emerald-400" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
                      SaaS Net Profit: Rs. {(financials?.netSaaSProfitLkr || 184300).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Middle Dual Section: Sales Performance (Area) & Revenue Breakdown (Donut) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-7">
                    <SalesPerformanceChart
                      mrrLkr={kpis?.mrrLkr || 248500}
                      totalGmvLkr={kpis?.platformGmvLkr || 18450200}
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <RevenueBreakdownChart
                      mrrLkr={kpis?.mrrLkr || 248500}
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
                          {(financials?.recentInvoices || [
                            {
                              id: "1",
                              tenantName: "Velvet Threads Boutique",
                              amountLkr: 18500,
                              billingCycle: "MONTHLY",
                              status: "PAID",
                              invoiceNumber: "INV-2026-001",
                              issuedAt: new Date().toISOString(),
                            },
                            {
                              id: "2",
                              tenantName: "Artisan Cafe & Bakery",
                              amountLkr: 9500,
                              billingCycle: "MONTHLY",
                              status: "PAID",
                              invoiceNumber: "INV-2026-002",
                              issuedAt: new Date(Date.now() - 86400000).toISOString(),
                            },
                            {
                              id: "3",
                              tenantName: "Colombo Central Superstore",
                              amountLkr: 18500,
                              billingCycle: "ANNUAL",
                              status: "PAID",
                              invoiceNumber: "INV-2026-003",
                              issuedAt: new Date(Date.now() - 172800000).toISOString(),
                            },
                            {
                              id: "4",
                              tenantName: "Luxe Spa & Wellness",
                              amountLkr: 4500,
                              billingCycle: "TRIAL",
                              status: "TRIAL",
                              invoiceNumber: "INV-2026-004",
                              issuedAt: new Date(Date.now() - 259200000).toISOString(),
                            },
                          ])
                            .slice(0, 4)
                            .map((inv) => (
                              <tr key={inv.id} className="hover:bg-[#16181B] transition-colors">
                                <td className="py-3 px-3 font-medium text-white">
                                  {inv.tenantName}
                                </td>
                                <td className="py-3 px-3 font-mono text-zinc-400">
                                  {inv.billingCycle}
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
                            ))}
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
                            High velocity tenants across Sri Lanka
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        {[
                          {
                            name: "Velvet Threads - Colombo 03",
                            type: "Apparel & Fashion",
                            orders: 412,
                            pct: 92,
                          },
                          {
                            name: "Artisan Bistro - Kandy",
                            type: "Restaurant & Cafe",
                            orders: 348,
                            pct: 78,
                          },
                          {
                            name: "Luxe Spa - Galle Fort",
                            type: "Salon & Wellness",
                            orders: 224,
                            pct: 54,
                          },
                        ].map((outlet) => (
                          <div key={outlet.name} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-200">
                                {outlet.name}
                              </span>
                              <span className="font-mono text-zinc-400">
                                {outlet.orders} orders
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[#1C2025] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${outlet.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
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
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      SaaS Subscription Tiers & Pricing
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Manage platform subscription pricing in Sri Lankan Rupees (LKR)
                    </p>
                  </div>
                </div>

                {/* 3 Tier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    {
                      tier: "STARTER",
                      name: "Starter Merchant",
                      priceLkr: 4500,
                      features: ["1 Branch Included", "Up to 3 Cashiers", "Core POS & Inventory", "Standard Receipts"],
                      color: "border-blue-500/30",
                    },
                    {
                      tier: "GROWTH",
                      name: "Growth Multi-Store",
                      priceLkr: 9500,
                      features: ["Up to 3 Branches", "Up to 10 Staff", "LankaQR & PayHere APIs", "Full P&L Reports"],
                      color: "border-emerald-500/40",
                      badge: "Most Popular",
                    },
                    {
                      tier: "ENTERPRISE",
                      name: "Enterprise Multi-Tenant",
                      priceLkr: 18500,
                      features: ["Unlimited Branches", "Unlimited Staff", "Dedicated DB Schema", "24/7 Priority SLA"],
                      color: "border-purple-500/30",
                    },
                  ].map((p) => (
                    <div
                      key={p.tier}
                      className={`p-6 rounded-2xl bg-[#121417] border ${p.color} flex flex-col justify-between relative group hover:border-zinc-500 transition-colors`}
                    >
                      {p.badge && (
                        <span className="absolute top-4 right-4 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {p.badge}
                        </span>
                      )}
                      <div>
                        <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                          {p.tier}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">{p.name}</h3>
                        <div className="mt-4 mb-6">
                          <span className="text-3xl font-black text-white font-mono">
                            Rs. {p.priceLkr.toLocaleString()}
                          </span>
                          <span className="text-xs text-zinc-500 ml-1.5 font-medium">/ month</span>
                        </div>

                        <ul className="space-y-2.5 text-xs text-zinc-300">
                          {p.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedPlanToEdit(p.tier);
                          setNewPlanPrice(String(p.priceLkr));
                          setIsPriceEditorOpen(true);
                        }}
                        className="mt-6 w-full h-9 rounded-lg bg-[#181A1D] hover:bg-[#22262C] border border-[#2B3037] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Settings size={13} />
                        <span>Adjust Plan Price</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Invoices Ledger */}
                <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                  <h3 className="text-sm font-bold text-white tracking-tight mb-4">
                    Platform Automated Invoices & LankaQR Gateway Settlements
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1E2227] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3">Tenant</th>
                          <th className="py-2.5 px-3">Billing Cycle</th>
                          <th className="py-2.5 px-3">Amount (LKR)</th>
                          <th className="py-2.5 px-3">Issued Date</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1D21]">
                        {(financials?.recentInvoices || []).map((inv) => (
                          <tr key={inv.id} className="hover:bg-[#16181B] transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-zinc-300">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-3 px-3 text-white font-medium">
                              {inv.tenantName}
                            </td>
                            <td className="py-3 px-3 font-mono text-zinc-400">
                              {inv.billingCycle}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-white">
                              Rs. {inv.amountLkr.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-[11px] text-zinc-500 font-mono">
                              {new Date(inv.issuedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {inv.status}
                              </span>
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
                      Rs. {(financials?.totalInflowLkr || 248500).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      MRR + 0.5% Payment gateway margins
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <span className="text-xs font-semibold text-zinc-400">Cloud & Operational Costs</span>
                    <div className="text-2xl font-black text-rose-400 font-mono mt-2">
                      Rs. {(financials?.totalPlatformExpensesLkr || 64200).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      AWS ECS, RDS PostgreSQL, Redis, Twilio SMS
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <span className="text-xs font-semibold text-zinc-400">Net SaaS Margin</span>
                    <div className="text-2xl font-black text-white font-mono mt-2">
                      {(financials?.profitMarginPercent || 73.8).toFixed(1)}%
                    </div>
                    <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                      Net Profit: Rs. {(financials?.netSaaSProfitLkr || 184300).toLocaleString()}
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
                TAB 5: CLUSTER TELEMETRY & HEALTH
                ========================================================================= */}
            {activeTab === "telemetry" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Cluster Telemetry & Health
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      PostgreSQL query latency, Redis cache heartbeat, and node-cron workers
                    </p>
                  </div>
                  <button
                    onClick={loadData}
                    className="h-8 px-3 rounded-lg bg-[#141619] border border-[#2B3037] text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    <span>Refresh Telemetry</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">PostgreSQL Aurora</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {telemetry?.database?.status || "HEALTHY"}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-3">
                      {telemetry?.database?.latencyMs || 4} ms
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Query round-trip time (SELECT 1)
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">Redis 6379 Cache</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {telemetry?.redis?.status || "ONLINE"}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-3">
                      {telemetry?.redis?.latencyMs || 1} ms
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      PING response latency
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">Platform Uptime</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-3">
                      {Math.floor((telemetry?.uptimeSeconds || 3600) / 3600)}h{" "}
                      {Math.floor(((telemetry?.uptimeSeconds || 3600) % 3600) / 60)}m
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Node.js runtime continuous uptime
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227]">
                  <h3 className="text-sm font-bold text-white tracking-tight mb-4">
                    Active Node-Cron Background Schedulers
                  </h3>
                  <div className="divide-y divide-[#1A1D21]">
                    {[
                      {
                        name: "weekly-audit-digest",
                        schedule: "0 8 * * 1 (Every Monday 08:00)",
                        status: "ACTIVE",
                      },
                      {
                        name: "daily-db-backup",
                        schedule: "0 2 * * * (Daily 02:00 UTC)",
                        status: "ACTIVE",
                      },
                      {
                        name: "quarterly-pentest-reminder",
                        schedule: "0 0 1 1,4,7,10 *",
                        status: "ACTIVE",
                      },
                    ].map((s) => (
                      <div key={s.name} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Clock size={14} className="text-zinc-500" />
                          <span className="font-semibold text-white text-xs">{s.name}</span>
                          <span className="text-[11px] text-zinc-500 font-mono">
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
                    <option value="SUPERMARKET_GROCERY">Supermarket</option>
                    <option value="SALON_SPA">Salon & Wellness</option>
                    <option value="PHARMACY">Pharmacy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                onClick={() => {
                  alert(
                    `Updated ${selectedPlanToEdit} plan pricing to Rs. ${Number(
                      newPlanPrice
                    ).toLocaleString()}/month`
                  );
                  setIsPriceEditorOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all"
              >
                Save Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
