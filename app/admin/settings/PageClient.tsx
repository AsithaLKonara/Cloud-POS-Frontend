"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Globe,
  Receipt,
  CreditCard,
  Layers,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Store,
  Percent,
  Clock,
  Printer,
  QrCode,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  DollarSign,
} from "lucide-react";
import { useCurrentTenant, useUpdateCurrentTenant, useTenantUsage } from "@/hooks/useTenantSettings";
import { toast } from "@/store/toast.store";

export default function TenantSettingsPageClient() {
  const [activeTab, setActiveTab] = useState<"general" | "regional" | "receipts" | "plan" | "integrations">("general");

  const { data: tenant, isLoading, refetch, isFetching } = useCurrentTenant();
  const { data: usage } = useTenantUsage(tenant?.id);
  const updateTenantMutation = useUpdateCurrentTenant();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    businessType: "RETAIL",
    currency: "LKR",
    currencySymbol: "Rs.",
    timezone: "Asia/Colombo",
    taxRate: 0.0,
    logoUrl: "",
    supportEmail: "",
    supportPhone: "",
    invoicePrefix: "INV-",
    receiptHeader: "",
    receiptFooter: "Thank you for shopping with us! Please come again.",
    autoPrintReceipt: true,
    enableLankaQr: true,
    enableCod: true,
    enableCardPayments: true,
    lankaQrMerchantId: "",
  });

  useEffect(() => {
    if (tenant) {
      const s = (tenant.settings as any) || {};
      setFormData({
        name: tenant.name || "",
        slug: tenant.slug || "",
        businessType: tenant.businessType || "RETAIL",
        currency: tenant.currency || "LKR",
        currencySymbol: tenant.currencySymbol || "Rs.",
        timezone: tenant.timezone || "Asia/Colombo",
        taxRate: tenant.taxRate ?? 0.0,
        logoUrl: tenant.logoUrl || "",
        supportEmail: s.supportEmail || "",
        supportPhone: s.supportPhone || "",
        invoicePrefix: s.invoicePrefix || "INV-",
        receiptHeader: s.receiptHeader || "",
        receiptFooter: s.receiptFooter || "Thank you for your business! Please visit us again.",
        autoPrintReceipt: s.autoPrintReceipt !== false,
        enableLankaQr: s.enableLankaQr !== false,
        enableCod: s.enableCod !== false,
        enableCardPayments: s.enableCardPayments !== false,
        lankaQrMerchantId: s.lankaQrMerchantId || "",
      });
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Business legal name is required.");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        businessType: formData.businessType as any,
        currency: formData.currency,
        currencySymbol: formData.currencySymbol,
        timezone: formData.timezone,
        taxRate: Number(formData.taxRate) || 0.0,
        logoUrl: formData.logoUrl.trim() || undefined,
        settings: {
          supportEmail: formData.supportEmail.trim(),
          supportPhone: formData.supportPhone.trim(),
          invoicePrefix: formData.invoicePrefix.trim(),
          receiptHeader: formData.receiptHeader.trim(),
          receiptFooter: formData.receiptFooter.trim(),
          autoPrintReceipt: formData.autoPrintReceipt,
          enableLankaQr: formData.enableLankaQr,
          enableCod: formData.enableCod,
          enableCardPayments: formData.enableCardPayments,
          lankaQrMerchantId: formData.lankaQrMerchantId.trim(),
        },
      };

      await updateTenantMutation.mutateAsync(payload);
      toast.success("Tenant settings updated successfully!");
    } catch (err: any) {
      console.error("Failed to update tenant settings", err);
      toast.error(err?.response?.data?.message || "Failed to update tenant settings.");
    }
  };

  const tabs = [
    { id: "general", label: "Business Profile", icon: Building2 },
    { id: "regional", label: "Regional & Taxes", icon: Globe },
    { id: "receipts", label: "Receipts & POS", icon: Receipt },
    { id: "plan", label: "Plan & Quotas", icon: Layers },
    { id: "integrations", label: "Payment Gateways", icon: CreditCard },
  ] as const;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 max-w-[1200px] mx-auto min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-inter text-muted font-medium">Loading tenant configuration...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-8 max-w-[1280px] mx-auto w-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 tracking-wider uppercase">
              Tenant Administration
            </span>
            <span className="text-xs text-muted font-mono">
              Tenant ID: {tenant?.id?.slice(0, 13) || "active-instance"}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                tenant?.status === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              }`}
            >
              {tenant?.status || "ACTIVE"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold font-mono uppercase">
              {tenant?.subscriptionTier || "STANDARD"} Plan
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight font-poppins">
            {tenant?.name || "Business Tenant Settings"}
          </h1>
          <p className="text-xs md:text-sm text-muted font-inter mt-0.5">
            Configure multi-tenant business identity, currency, regional taxes, receipt preferences, and plan quotas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 w-10 flex items-center justify-center bg-surface border border-border rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Reload settings"
            aria-label="Reload settings"
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin text-primary" : ""} />
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateTenantMutation.isPending}
            className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-inter font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 active:scale-95 disabled:opacity-50"
          >
            <Save size={15} />
            <span>{updateTenantMutation.isPending ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-inter font-medium transition-all text-left whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-white shadow-sm font-semibold"
                    : "bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <Icon size={16} className={isActive ? "text-white" : "text-muted"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Forms Container */}
        <div className="lg:col-span-9 bg-surface border border-border rounded-2xl shadow-sm p-6 md:p-8 flex flex-col gap-6">
          {/* TAB 1: GENERAL / PROFILE */}
          {activeTab === "general" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-bold text-foreground font-poppins">Business Profile & Identity</h3>
                <p className="text-xs text-muted font-inter mt-0.5">
                  Core branding and identification parameters for your business instance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground font-inter">Business Legal Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. PetroChem Solutions Pvt Ltd"
                    className="h-10 bg-background border border-border rounded-xl px-3 text-xs text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-inter"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground font-inter">System Slug Identifier</label>
                  <div className="h-10 flex items-center bg-background border border-border rounded-xl overflow-hidden focus-within:border-primary">
                    <span className="px-3 text-muted text-xs font-mono border-r border-border bg-surface">xonit.space/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="petrochem-lk"
                      className="flex-1 px-3 text-xs font-mono outline-none bg-transparent text-foreground placeholder:text-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground font-inter">Industry / Business Classification</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="h-10 bg-background border border-border rounded-xl px-3 text-xs text-foreground outline-none cursor-pointer focus:border-primary font-inter"
                  >
                    <option value="RETAIL" className="bg-surface text-foreground">Retail & Merchandising</option>
                    <option value="AUTOMOTIVE_SERVICES" className="bg-surface text-foreground">Automotive, Oil & Lubricants</option>
                    <option value="RESTAURANT_CAFE" className="bg-surface text-foreground">Restaurant, Bistro & Cafe</option>
                    <option value="GROCERY_SUPERMARKET" className="bg-surface text-foreground">Grocery & Supermarket</option>
                    <option value="PHARMACY_CLINIC" className="bg-surface text-foreground">Pharmacy & Healthcare</option>
                    <option value="SALON_SPA" className="bg-surface text-foreground">Salon, Spa & Wellness</option>
                    <option value="WHOLESALE_DISTRIBUTION" className="bg-surface text-foreground">Wholesale & Distribution</option>
                    <option value="GENERAL_SERVICES" className="bg-surface text-foreground">General Service Provider</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground font-inter">Logo Image URL</label>
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://cdn.example.com/logo.png"
                    className="h-10 bg-background border border-border rounded-xl px-3 text-xs text-foreground placeholder:text-muted outline-none focus:border-primary font-inter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground font-inter">Support Email</label>
                  <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    placeholder="support@petrochem.lk"
                    className="h-10 bg-background border border-border rounded-xl px-3 text-xs text-foreground placeholder:text-muted outline-none focus:border-primary font-inter"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground font-inter">Support Hotline / Phone</label>
                  <input
                    type="text"
                    value={formData.supportPhone}
                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                    placeholder="+94 11 234 5678"
                    className="h-10 bg-background border border-border rounded-xl px-3 text-xs text-foreground placeholder:text-muted outline-none focus:border-primary font-inter"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGIONAL & TAXES */}
          {activeTab === "regional" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-bold text-foreground font-poppins">Regional, Currency & Tax Settings</h3>
                <p className="text-xs text-muted font-inter mt-0.5">
                  Controls transaction currencies, receipt symbols, and statutory tax rates applied across branches.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground font-inter">Currency Code (ISO)</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    placeholder="LKR"
                    className="h-10 bg-background border border-border rounded-xl px-3 text-xs font-mono font-bold text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground font-inter">Currency Display Symbol</label>
                  <input
                    type="text"
                    value={formData.currencySymbol}
                    onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                    placeholder="Rs."
                    className="h-10 bg-background border border-border rounded-xl px-3 text-xs font-mono font-bold text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground font-inter">Default Tax / VAT Rate (%)</label>
                  <div className="h-10 flex items-center bg-background border border-border rounded-xl overflow-hidden focus-within:border-primary">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-3 text-xs font-mono font-bold outline-none bg-transparent text-foreground"
                    />
                    <span className="px-3 text-muted text-xs font-mono border-l border-border bg-surface">%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-foreground font-inter">Operating Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="h-10 bg-background border border-border rounded-xl px-3 text-xs text-foreground outline-none cursor-pointer focus:border-primary font-inter"
                >
                  <option value="Asia/Colombo" className="bg-surface text-foreground">Asia/Colombo (Sri Lanka Standard Time, GMT+5:30)</option>
                  <option value="Asia/Dubai" className="bg-surface text-foreground">Asia/Dubai (Gulf Standard Time, GMT+4:00)</option>
                  <option value="Asia/Singapore" className="bg-surface text-foreground">Asia/Singapore (SGT, GMT+8:00)</option>
                  <option value="UTC" className="bg-surface text-foreground">Coordinated Universal Time (UTC)</option>
                  <option value="America/New_York" className="bg-surface text-foreground">America/New_York (Eastern Time, GMT-5:00)</option>
                  <option value="Europe/London" className="bg-surface text-foreground">Europe/London (GMT/BST)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 mt-2">
                <Percent size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                  <p className="font-semibold">Statutory Tax & Currency Synchronization</p>
                  <p className="mt-0.5 text-amber-600/90 dark:text-amber-300/80">
                    Changes to tax rates and currency symbols apply dynamically to newly created POS tickets and customer invoices. Historical sales data retains its original tax calculations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECEIPTS & POS */}
          {activeTab === "receipts" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-bold text-foreground font-poppins">Receipt & Invoicing Preferences</h3>
                <p className="text-xs text-muted font-inter mt-0.5">
                  Customize thermal printouts, invoice numbering schemas, and automatic printing behavior.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground font-inter">Invoice / Receipt Prefix</label>
                  <input
                    type="text"
                    value={formData.invoicePrefix}
                    onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                    placeholder="INV-"
                    className="h-10 bg-background border border-border rounded-xl px-3 text-xs font-mono font-bold text-foreground outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-muted font-inter">Example output: {formData.invoicePrefix}2026-00482</span>
                </div>

                <div className="flex flex-col justify-center gap-2 pt-2 sm:pt-0">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoPrintReceipt}
                      onChange={(e) => setFormData({ ...formData, autoPrintReceipt: e.target.checked })}
                      className="w-4 h-4 rounded text-primary border-border focus:ring-primary/20 accent-amber-500 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground font-inter">Zero-Click Auto Print Receipts</span>
                      <span className="text-[10px] text-muted font-inter">Automatically dispatch ESC/POS job to hardware bridge on checkout</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-foreground font-inter">Receipt Header Announcement</label>
                <input
                  type="text"
                  value={formData.receiptHeader}
                  onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                  placeholder="e.g. Welcome to XONIT Flagship Store • ISO 9001:2015 Certified"
                  className="h-10 bg-background border border-border rounded-xl px-3 text-xs text-foreground placeholder:text-muted outline-none focus:border-primary font-inter"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground font-inter">Receipt Footer Legal Note / Return Policy</label>
                <textarea
                  value={formData.receiptFooter}
                  onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                  rows={3}
                  placeholder="Terms for returns, warranties, or customer service contact info..."
                  className="bg-background border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted outline-none focus:border-primary font-inter resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: PLAN & QUOTAS */}
          {activeTab === "plan" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-bold text-foreground font-poppins">Subscription Tier & Allocated Quotas</h3>
                <p className="text-xs text-muted font-inter mt-0.5">
                  Overview of current multi-branch limits, staff capacity, and usage against quotas.
                </p>
              </div>

              {/* Quota Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-background border border-border flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted font-inter">Branch Allocation</span>
                    <Store size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black font-mono text-foreground">{usage?.branches?.current ?? 1}</span>
                      <span className="text-xs font-mono text-muted">/ {tenant?.maxBranches ?? 3} Branches</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden mt-2.5">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((usage?.branches?.current ?? 1) / (tenant?.maxBranches || 3)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-background border border-border flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted font-inter">Staff Accounts</span>
                    <ShieldCheck size={16} className="text-emerald-500" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black font-mono text-foreground">{usage?.users?.current ?? 3}</span>
                      <span className="text-xs font-mono text-muted">/ {tenant?.maxUsers ?? 10} Staff Members</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden mt-2.5">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((usage?.users?.current ?? 3) / (tenant?.maxUsers || 10)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Details Card */}
              <div className="p-5 rounded-xl bg-background border border-border flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider">Active Tier</span>
                  <h4 className="text-base font-bold text-foreground font-poppins mt-0.5">
                    {tenant?.subscriptionTier || "STANDARD"} Enterprise POS
                  </h4>
                  <p className="text-xs text-muted font-inter mt-0.5">
                    Includes real-time consolidated multi-branch inventory, zero-click thermal printing, and executive P&L ledger.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground font-semibold">
                    LKR Billing Enabled
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENT GATEWAYS & INTEGRATIONS */}
          {activeTab === "integrations" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-bold text-foreground font-poppins">Payment Gateways & Local Integrations</h3>
                <p className="text-xs text-muted font-inter mt-0.5">
                  Configure digital payment tender options available on POS terminals and storefront checkout.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* LankaQR Integration */}
                <div className="p-4 rounded-xl bg-background border border-border flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <QrCode size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground font-poppins">LankaQR Digital Payments</h4>
                      <p className="text-[11px] text-muted font-inter mt-0.5">
                        Accept instant EMVCo-compliant LankaQR payments from all Sri Lankan banking apps.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <input
                          type="text"
                          value={formData.lankaQrMerchantId}
                          onChange={(e) => setFormData({ ...formData, lankaQrMerchantId: e.target.value })}
                          placeholder="Merchant ID / Virtual Payment Address"
                          className="h-8 w-60 bg-surface border border-border rounded-lg px-2.5 text-xs text-foreground placeholder:text-muted font-mono outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.enableLankaQr}
                      onChange={(e) => setFormData({ ...formData, enableLankaQr: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Cash on Delivery */}
                <div className="p-4 rounded-xl bg-background border border-border flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground font-poppins">Cash on Delivery & Register Drawer</h4>
                      <p className="text-[11px] text-muted font-inter mt-0.5">
                        Cash handling with automated change calculation and drawer kick via RJ11 bridge.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.enableCod}
                      onChange={(e) => setFormData({ ...formData, enableCod: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Card Terminals */}
                <div className="p-4 rounded-xl bg-background border border-border flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground font-poppins">Credit & Debit Card Terminals</h4>
                      <p className="text-[11px] text-muted font-inter mt-0.5">
                        Accept Visa, MasterCard, and LankaPay cards via standalone or integrated IP terminals.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.enableCardPayments}
                      onChange={(e) => setFormData({ ...formData, enableCardPayments: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Sparkles size={14} className="text-primary" />
              <span>Settings automatically synchronize across all registered branch terminals</span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={updateTenantMutation.isPending}
              className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-inter font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 active:scale-95 disabled:opacity-50"
            >
              <Save size={15} />
              <span>{updateTenantMutation.isPending ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
