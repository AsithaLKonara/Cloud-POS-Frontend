"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Truck,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Activity,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCurrentTenant } from "@/hooks/useTenantSettings";
import { integrationService, TenantIntegrations } from "@/services/integration.service";
import { SettingsNavTabs } from "@/components/settings/SettingsNavTabs";
import { toast } from "@/store/toast.store";

export default function IntegrationsPageClient() {
  const { data: tenant, isLoading: tenantLoading } = useCurrentTenant();
  const [integrations, setIntegrations] = useState<TenantIntegrations | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs: number; message: string }>>({});
  const [activeCategory, setActiveCategory] = useState<"payments" | "couriers">("payments");
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  // Local editable form states
  const [onepayForm, setOnepayForm] = useState({
    enabled: false,
    appId: "",
    appToken: "",
    hashSalt: "",
    isSandbox: true,
  });

  const [payhereForm, setPayhereForm] = useState({
    enabled: false,
    merchantId: "",
    merchantSecret: "",
    isSandbox: true,
  });

  const [kokoForm, setKokoForm] = useState({
    enabled: false,
    merchantId: "",
    apiKey: "",
    apiSecret: "",
    isSandbox: true,
  });

  const [webxpayForm, setWebxpayForm] = useState({
    enabled: false,
    publicKey: "",
    secretKey: "",
    isSandbox: true,
  });

  const [lankaQrForm, setLankaQrForm] = useState({
    enabled: false,
    merchantCategoryCode: "5411",
    accountNumber: "",
    bankCode: "7010",
    terminalId: "",
    merchantName: "",
  });

  const [koombiyoForm, setKoombiyoForm] = useState({
    enabled: false,
    apiKey: "",
    pickupCode: "",
  });

  const [promptxForm, setPromptxForm] = useState({
    enabled: false,
    apiKey: "",
    clientCode: "",
  });

  const [domexForm, setDomexForm] = useState({
    enabled: false,
    username: "",
    accountNumber: "",
  });

  const [fardarForm, setFardarForm] = useState({
    enabled: false,
    apiKey: "",
    merchantCode: "",
    pickupBranch: "",
    serviceType: "STANDARD",
    isSandbox: true,
  });

  const loadData = async () => {
    if (!tenant?.id) return;
    try {
      setLoading(true);
      const data = await integrationService.getIntegrations(tenant.id);
      setIntegrations(data);

      if (data?.paymentGateways) {
        const pg = data.paymentGateways;
        if (pg.onepay) {
          setOnepayForm({
            enabled: !!pg.onepay.enabled,
            appId: pg.onepay.appId || "",
            appToken: pg.onepay.appToken || "",
            hashSalt: pg.onepay.hashSalt || "",
            isSandbox: pg.onepay.isSandbox ?? true,
          });
        }
        if (pg.payhere) {
          setPayhereForm({
            enabled: !!pg.payhere.enabled,
            merchantId: pg.payhere.merchantId || "",
            merchantSecret: pg.payhere.merchantSecret || "",
            isSandbox: pg.payhere.isSandbox ?? true,
          });
        }
        if (pg.koko) {
          setKokoForm({
            enabled: !!pg.koko.enabled,
            merchantId: pg.koko.merchantId || "",
            apiKey: pg.koko.apiKey || "",
            apiSecret: pg.koko.apiSecret || "",
            isSandbox: pg.koko.isSandbox ?? true,
          });
        }
        if (pg.webxpay) {
          setWebxpayForm({
            enabled: !!pg.webxpay.enabled,
            publicKey: pg.webxpay.publicKey || "",
            secretKey: pg.webxpay.secretKey || "",
            isSandbox: pg.webxpay.isSandbox ?? true,
          });
        }
        if (pg.lankaQr) {
          setLankaQrForm({
            enabled: !!pg.lankaQr.enabled,
            merchantCategoryCode: pg.lankaQr.merchantCategoryCode || "5411",
            accountNumber: pg.lankaQr.accountNumber || "",
            bankCode: pg.lankaQr.bankCode || "7010",
            terminalId: pg.lankaQr.terminalId || "",
            merchantName: pg.lankaQr.merchantName || "",
          });
        }
      }

      if (data?.couriers) {
        const c = data.couriers;
        if (c.koombiyo) {
          setKoombiyoForm({
            enabled: !!c.koombiyo.enabled,
            apiKey: c.koombiyo.apiKey || "",
            pickupCode: c.koombiyo.pickupCode || "",
          });
        }
        if (c.promptx) {
          setPromptxForm({
            enabled: !!c.promptx.enabled,
            apiKey: c.promptx.apiKey || "",
            clientCode: c.promptx.clientCode || "",
          });
        }
        if (c.domex) {
          setDomexForm({
            enabled: !!c.domex.enabled,
            username: c.domex.username || "",
            accountNumber: c.domex.accountNumber || "",
          });
        }
        if (c.fardar) {
          setFardarForm({
            enabled: !!c.fardar.enabled,
            apiKey: c.fardar.apiKey || "",
            merchantCode: c.fardar.merchantCode || "",
            pickupBranch: c.fardar.pickupBranch || "",
            serviceType: c.fardar.serviceType || "STANDARD",
            isSandbox: c.fardar.isSandbox ?? true,
          });
        }
      }
    } catch (err: any) {
      console.error("Failed to load integrations", err);
      toast.error(err?.response?.data?.message || "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    } else if (!tenantLoading) {
      setLoading(false);
    }
  }, [tenant?.id, tenantLoading]);

  const handleSavePayment = async (
    gateway: "onepay" | "payhere" | "koko" | "webxpay" | "lankaQr",
    formState: any
  ) => {
    if (!tenant?.id) return;
    try {
      setSavingProvider(gateway);
      await integrationService.updatePaymentGateway(tenant.id, gateway, formState);
      toast.success(`${gateway.toUpperCase()} configuration encrypted & saved in vault`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save configuration");
    } finally {
      setSavingProvider(null);
    }
  };

  const handleSaveCourier = async (
    courier: "koombiyo" | "promptx" | "domex" | "fardar",
    formState: any
  ) => {
    if (!tenant?.id) return;
    try {
      setSavingProvider(courier);
      await integrationService.updateCourier(tenant.id, courier, formState);
      toast.success(`${courier.toUpperCase()} credentials encrypted & saved in vault`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save configuration");
    } finally {
      setSavingProvider(null);
    }
  };

  const handleTestConnection = async (type: "payment" | "courier", provider: string) => {
    if (!tenant?.id) return;
    try {
      setTestingProvider(provider);
      const res = await integrationService.testConnection(tenant.id, type, provider);
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: res.success,
          latencyMs: res.latencyMs,
          message: res.message,
        },
      }));
      if (res.success) {
        toast.success(`${provider.toUpperCase()}: Connection verified in ${res.latencyMs}ms`);
      } else {
        toast.error(`${provider.toUpperCase()}: ${res.message}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Connection test failed");
    } finally {
      setTestingProvider(null);
    }
  };

  const toggleShowSecret = (fieldId: string) => {
    setShowSecret((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  if (tenantLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 max-w-[1280px] mx-auto min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-inter text-muted font-medium">Opening secure credentials vault...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-8 max-w-[1280px] mx-auto w-full gap-6">
      {/* Settings Breadcrumbs & Tabs */}
      <SettingsNavTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 tracking-wider uppercase flex items-center gap-1.5">
              <ShieldCheck size={13} />
              Encrypted Credentials Vault
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold flex items-center gap-1">
              <Lock size={11} />
              AES-256-GCM Envelope Encryption
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight font-poppins">
            External Services & Payment Integrations
          </h1>
          <p className="text-xs md:text-sm text-muted font-inter mt-1 max-w-2xl">
            Store and manage third-party API keys securely per tenant. Credentials are never written to plaintext or environment files, but are derived and encrypted inside your isolated cryptographic envelope.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="h-10 px-4 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-2 transition-all text-xs font-semibold"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            <span>Reload Vault</span>
          </button>
        </div>
      </div>

      {/* Category Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveCategory("payments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-inter font-bold transition-all ${
            activeCategory === "payments"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <CreditCard size={15} />
          <span>Payment Gateways (6)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("couriers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-inter font-bold transition-all ${
            activeCategory === "couriers"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <Truck size={15} />
          <span>Couriers & Logistics (4)</span>
        </button>
      </div>

      {/* PAYMENT GATEWAYS SECTION */}
      {activeCategory === "payments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OnePay Payment Gateway */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black font-poppins text-lg">
                    1P
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground font-poppins">OnePay Gateway</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${onepayForm.isSandbox ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
                        {onepayForm.isSandbox ? "Sandbox" : "Live"}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      Visa, Mastercard, LankaQR, FriMi, Genie, eZ Cash & Direct Bank
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={onepayForm.enabled}
                    onChange={(e) => setOnepayForm({ ...onepayForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">OnePay App ID</label>
                  <input
                    type="text"
                    value={onepayForm.appId}
                    onChange={(e) => setOnepayForm({ ...onepayForm, appId: e.target.value })}
                    placeholder="e.g. 100029384"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-foreground/80">App Token / API Key</label>
                    <span className="text-[10px] text-muted flex items-center gap-1 font-mono">
                      <Lock size={10} className="text-emerald-500" /> AES-256 Encrypted
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret["onepay_token"] ? "text" : "password"}
                      value={onepayForm.appToken}
                      onChange={(e) => setOnepayForm({ ...onepayForm, appToken: e.target.value })}
                      placeholder="Enter OnePay App Token"
                      className="w-full h-9 bg-background border border-border rounded-xl pl-3 pr-10 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret("onepay_token")}
                      className="absolute right-2.5 top-2 text-muted hover:text-foreground"
                    >
                      {showSecret["onepay_token"] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-foreground/80">Hash Salt (Signature Verification)</label>
                    <span className="text-[10px] text-muted flex items-center gap-1 font-mono">
                      <Lock size={10} className="text-emerald-500" /> SHA-256 Verification
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret["onepay_salt"] ? "text" : "password"}
                      value={onepayForm.hashSalt}
                      onChange={(e) => setOnepayForm({ ...onepayForm, hashSalt: e.target.value })}
                      placeholder="Enter Hash Salt from OnePay portal"
                      className="w-full h-9 bg-background border border-border rounded-xl pl-3 pr-10 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret("onepay_salt")}
                      className="absolute right-2.5 top-2 text-muted hover:text-foreground"
                    >
                      {showSecret["onepay_salt"] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted font-inter">Environment Mode</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOnepayForm({ ...onepayForm, isSandbox: true })}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        onepayForm.isSandbox ? "bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnepayForm({ ...onepayForm, isSandbox: false })}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        !onepayForm.isSandbox ? "bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Production
                    </button>
                  </div>
                </div>

                {testResults["onepay"] && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    testResults["onepay"].success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    <Activity size={14} />
                    <span>{testResults["onepay"].message} ({testResults["onepay"].latencyMs}ms)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => handleTestConnection("payment", "onepay")}
                disabled={testingProvider === "onepay"}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Zap size={13} className={testingProvider === "onepay" ? "animate-spin text-primary" : "text-blue-500"} />
                <span>{testingProvider === "onepay" ? "Pinging..." : "Test Ping"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSavePayment("onepay", onepayForm)}
                disabled={savingProvider === "onepay"}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "onepay" ? "Encrypting..." : "Save Vault"}</span>
              </button>
            </div>
          </div>

          {/* PayHere Gateway */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black font-poppins text-lg">
                    PH
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground font-poppins">PayHere Payment Gateway</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${payhereForm.isSandbox ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
                        {payhereForm.isSandbox ? "Sandbox" : "Live"}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      Visa, MasterCard, Amex, eZ Cash, mCash & Internet Banking
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={payhereForm.enabled}
                    onChange={(e) => setPayhereForm({ ...payhereForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">PayHere Merchant ID</label>
                  <input
                    type="text"
                    value={payhereForm.merchantId}
                    onChange={(e) => setPayhereForm({ ...payhereForm, merchantId: e.target.value })}
                    placeholder="e.g. 1211111"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-foreground/80">Merchant Secret Key</label>
                    <span className="text-[10px] text-muted flex items-center gap-1 font-mono">
                      <Lock size={10} className="text-emerald-500" /> AES-256 Encrypted
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret["payhere"] ? "text" : "password"}
                      value={payhereForm.merchantSecret}
                      onChange={(e) => setPayhereForm({ ...payhereForm, merchantSecret: e.target.value })}
                      placeholder="Enter new secret or leave masked"
                      className="w-full h-9 bg-background border border-border rounded-xl pl-3 pr-10 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret("payhere")}
                      className="absolute right-2.5 top-2 text-muted hover:text-foreground"
                    >
                      {showSecret["payhere"] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted font-inter">Environment Mode</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPayhereForm({ ...payhereForm, isSandbox: true })}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        payhereForm.isSandbox ? "bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayhereForm({ ...payhereForm, isSandbox: false })}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        !payhereForm.isSandbox ? "bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Production
                    </button>
                  </div>
                </div>

                {testResults["payhere"] && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    testResults["payhere"].success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    <Activity size={14} />
                    <span>{testResults["payhere"].message} ({testResults["payhere"].latencyMs}ms)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => handleTestConnection("payment", "payhere")}
                disabled={testingProvider === "payhere"}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Zap size={13} className={testingProvider === "payhere" ? "animate-spin text-primary" : "text-amber-500"} />
                <span>{testingProvider === "payhere" ? "Pinging..." : "Test Ping"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSavePayment("payhere", payhereForm)}
                disabled={savingProvider === "payhere"}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "payhere" ? "Encrypting..." : "Save Vault"}</span>
              </button>
            </div>
          </div>

          {/* Koko BNPL Gateway */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 font-black font-poppins text-lg">
                    KO
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground font-poppins">Koko Buy Now Pay Later</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${kokoForm.isSandbox ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
                        {kokoForm.isSandbox ? "Sandbox" : "Live"}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      3 interest-free installments for Sri Lankan shoppers
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={kokoForm.enabled}
                    onChange={(e) => setKokoForm({ ...kokoForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Koko Merchant ID</label>
                  <input
                    type="text"
                    value={kokoForm.merchantId}
                    onChange={(e) => setKokoForm({ ...kokoForm, merchantId: e.target.value })}
                    placeholder="e.g. KOKO_M_78291"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Public API Key</label>
                  <input
                    type="text"
                    value={kokoForm.apiKey}
                    onChange={(e) => setKokoForm({ ...kokoForm, apiKey: e.target.value })}
                    placeholder="e.g. pk_live_..."
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-foreground/80">API Secret Key</label>
                    <span className="text-[10px] text-muted flex items-center gap-1 font-mono">
                      <Lock size={10} className="text-emerald-500" /> AES-256 Encrypted
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret["koko"] ? "text" : "password"}
                      value={kokoForm.apiSecret}
                      onChange={(e) => setKokoForm({ ...kokoForm, apiSecret: e.target.value })}
                      placeholder="Enter new secret or leave masked"
                      className="w-full h-9 bg-background border border-border rounded-xl pl-3 pr-10 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret("koko")}
                      className="absolute right-2.5 top-2 text-muted hover:text-foreground"
                    >
                      {showSecret["koko"] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted font-inter">Environment Mode</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setKokoForm({ ...kokoForm, isSandbox: true })}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        kokoForm.isSandbox ? "bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setKokoForm({ ...kokoForm, isSandbox: false })}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        !kokoForm.isSandbox ? "bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Production
                    </button>
                  </div>
                </div>

                {testResults["koko"] && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    testResults["koko"].success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    <Activity size={14} />
                    <span>{testResults["koko"].message} ({testResults["koko"].latencyMs}ms)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => handleTestConnection("payment", "koko")}
                disabled={testingProvider === "koko"}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Zap size={13} className={testingProvider === "koko" ? "animate-spin text-primary" : "text-pink-500"} />
                <span>{testingProvider === "koko" ? "Pinging..." : "Test Ping"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSavePayment("koko", kokoForm)}
                disabled={savingProvider === "koko"}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "koko" ? "Encrypting..." : "Save Vault"}</span>
              </button>
            </div>
          </div>

          {/* WebXPay Gateway */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black font-poppins text-lg">
                    WX
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground font-poppins">WebXPay Gateway</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${webxpayForm.isSandbox ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
                        {webxpayForm.isSandbox ? "Sandbox" : "Live"}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      Multi-currency international card checkout & QR solutions
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={webxpayForm.enabled}
                    onChange={(e) => setWebxpayForm({ ...webxpayForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Public Key</label>
                  <input
                    type="text"
                    value={webxpayForm.publicKey}
                    onChange={(e) => setWebxpayForm({ ...webxpayForm, publicKey: e.target.value })}
                    placeholder="Enter WebXPay public key"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-foreground/80">Secret Key</label>
                    <span className="text-[10px] text-muted flex items-center gap-1 font-mono">
                      <Lock size={10} className="text-emerald-500" /> AES-256 Encrypted
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret["webxpay"] ? "text" : "password"}
                      value={webxpayForm.secretKey}
                      onChange={(e) => setWebxpayForm({ ...webxpayForm, secretKey: e.target.value })}
                      placeholder="Enter WebXPay secret key"
                      className="w-full h-9 bg-background border border-border rounded-xl pl-3 pr-10 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret("webxpay")}
                      className="absolute right-2.5 top-2 text-muted hover:text-foreground"
                    >
                      {showSecret["webxpay"] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted font-inter">Environment Mode</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWebxpayForm({ ...webxpayForm, isSandbox: true })}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        webxpayForm.isSandbox ? "bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setWebxpayForm({ ...webxpayForm, isSandbox: false })}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        !webxpayForm.isSandbox ? "bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Production
                    </button>
                  </div>
                </div>

                {testResults["webxpay"] && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    testResults["webxpay"].success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    <Activity size={14} />
                    <span>{testResults["webxpay"].message} ({testResults["webxpay"].latencyMs}ms)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => handleTestConnection("payment", "webxpay")}
                disabled={testingProvider === "webxpay"}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Zap size={13} className={testingProvider === "webxpay" ? "animate-spin text-primary" : "text-blue-500"} />
                <span>{testingProvider === "webxpay" ? "Pinging..." : "Test Ping"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSavePayment("webxpay", webxpayForm)}
                disabled={savingProvider === "webxpay"}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "webxpay" ? "Encrypting..." : "Save Vault"}</span>
              </button>
            </div>
          </div>

          {/* LankaQR Digital Merchant */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black font-poppins text-lg">
                    QR
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground font-poppins">LankaQR Central Bank Spec</h3>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      National standard EMVCo dynamic QR code generator
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={lankaQrForm.enabled}
                    onChange={(e) => setLankaQrForm({ ...lankaQrForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Bank Code</label>
                  <input
                    type="text"
                    value={lankaQrForm.bankCode}
                    onChange={(e) => setLankaQrForm({ ...lankaQrForm, bankCode: e.target.value })}
                    placeholder="7010 (BOC), 7083 (Commercial)"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Account Number</label>
                  <input
                    type="text"
                    value={lankaQrForm.accountNumber}
                    onChange={(e) => setLankaQrForm({ ...lankaQrForm, accountNumber: e.target.value })}
                    placeholder="e.g. 00192837482"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Merchant Category Code (MCC)</label>
                  <input
                    type="text"
                    value={lankaQrForm.merchantCategoryCode}
                    onChange={(e) => setLankaQrForm({ ...lankaQrForm, merchantCategoryCode: e.target.value })}
                    placeholder="5411 (Grocery), 5812 (Dining)"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Terminal ID (Optional)</label>
                  <input
                    type="text"
                    value={lankaQrForm.terminalId}
                    onChange={(e) => setLankaQrForm({ ...lankaQrForm, terminalId: e.target.value })}
                    placeholder="POS-01"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mt-4">
              <span className="text-xs text-muted font-inter">EMVCo 29 Format</span>
              <button
                type="button"
                onClick={() => handleSavePayment("lankaQr", lankaQrForm)}
                disabled={savingProvider === "lankaQr"}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "lankaQr" ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COURIERS & LOGISTICS SECTION */}
      {activeCategory === "couriers" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Koombiyo Courier */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-black font-poppins text-lg">
                    KB
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground font-poppins">Koombiyo Delivery</h3>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      Island-wide COD express fulfillment & dispatch API
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={koombiyoForm.enabled}
                    onChange={(e) => setKoombiyoForm({ ...koombiyoForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Pickup Location / Account Code</label>
                  <input
                    type="text"
                    value={koombiyoForm.pickupCode}
                    onChange={(e) => setKoombiyoForm({ ...koombiyoForm, pickupCode: e.target.value })}
                    placeholder="e.g. CMB-STORE-01"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-foreground/80">Koombiyo API Key</label>
                    <span className="text-[10px] text-muted flex items-center gap-1 font-mono">
                      <Lock size={10} className="text-emerald-500" /> AES-256 Encrypted
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret["koombiyo"] ? "text" : "password"}
                      value={koombiyoForm.apiKey}
                      onChange={(e) => setKoombiyoForm({ ...koombiyoForm, apiKey: e.target.value })}
                      placeholder="Enter Koombiyo API key"
                      className="w-full h-9 bg-background border border-border rounded-xl pl-3 pr-10 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret("koombiyo")}
                      className="absolute right-2.5 top-2 text-muted hover:text-foreground"
                    >
                      {showSecret["koombiyo"] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {testResults["koombiyo"] && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    testResults["koombiyo"].success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    <Activity size={14} />
                    <span>{testResults["koombiyo"].message} ({testResults["koombiyo"].latencyMs}ms)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => handleTestConnection("courier", "koombiyo")}
                disabled={testingProvider === "koombiyo"}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Zap size={13} className={testingProvider === "koombiyo" ? "animate-spin text-primary" : "text-orange-500"} />
                <span>{testingProvider === "koombiyo" ? "Pinging..." : "Test Ping"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveCourier("koombiyo", koombiyoForm)}
                disabled={savingProvider === "koombiyo"}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "koombiyo" ? "Encrypting..." : "Save Vault"}</span>
              </button>
            </div>
          </div>

          {/* PromptX Courier */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 font-black font-poppins text-lg">
                    PX
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground font-poppins">PromptX Express</h3>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      Automated waybill creation & doorstep return management
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={promptxForm.enabled}
                    onChange={(e) => setPromptxForm({ ...promptxForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">PromptX Client Code</label>
                  <input
                    type="text"
                    value={promptxForm.clientCode}
                    onChange={(e) => setPromptxForm({ ...promptxForm, clientCode: e.target.value })}
                    placeholder="e.g. PX-4029"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-foreground/80">API Key / Token</label>
                    <span className="text-[10px] text-muted flex items-center gap-1 font-mono">
                      <Lock size={10} className="text-emerald-500" /> AES-256 Encrypted
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret["promptx"] ? "text" : "password"}
                      value={promptxForm.apiKey}
                      onChange={(e) => setPromptxForm({ ...promptxForm, apiKey: e.target.value })}
                      placeholder="Enter PromptX API key"
                      className="w-full h-9 bg-background border border-border rounded-xl pl-3 pr-10 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret("promptx")}
                      className="absolute right-2.5 top-2 text-muted hover:text-foreground"
                    >
                      {showSecret["promptx"] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {testResults["promptx"] && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    testResults["promptx"].success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    <Activity size={14} />
                    <span>{testResults["promptx"].message} ({testResults["promptx"].latencyMs}ms)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => handleTestConnection("courier", "promptx")}
                disabled={testingProvider === "promptx"}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Zap size={13} className={testingProvider === "promptx" ? "animate-spin text-primary" : "text-purple-500"} />
                <span>{testingProvider === "promptx" ? "Pinging..." : "Test Ping"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveCourier("promptx", promptxForm)}
                disabled={savingProvider === "promptx"}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "promptx" ? "Encrypting..." : "Save Vault"}</span>
              </button>
            </div>
          </div>

          {/* Fardar Express Courier */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 font-black font-poppins text-lg">
                    FD
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground font-poppins">Fardar Express Logistics</h3>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      Nationwide parcel delivery, automated COD dispatch & waybill API
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={fardarForm.enabled}
                    onChange={(e) => setFardarForm({ ...fardarForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Merchant / Client ID</label>
                  <input
                    type="text"
                    value={fardarForm.merchantCode}
                    onChange={(e) => setFardarForm({ ...fardarForm, merchantCode: e.target.value })}
                    placeholder="e.g. FDR-CLIENT-089"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-foreground/80">Fardar API Key</label>
                    <span className="text-[10px] text-muted flex items-center gap-1 font-mono">
                      <Lock size={10} className="text-emerald-500" /> AES-256 Encrypted
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret["fardar"] ? "text" : "password"}
                      value={fardarForm.apiKey}
                      onChange={(e) => setFardarForm({ ...fardarForm, apiKey: e.target.value })}
                      placeholder="Enter Fardar API key"
                      className="w-full h-9 bg-background border border-border rounded-xl pl-3 pr-10 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret("fardar")}
                      className="absolute right-2.5 top-2 text-muted hover:text-foreground"
                    >
                      {showSecret["fardar"] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Pickup Hub / Branch Code</label>
                  <input
                    type="text"
                    value={fardarForm.pickupBranch}
                    onChange={(e) => setFardarForm({ ...fardarForm, pickupBranch: e.target.value })}
                    placeholder="e.g. CMB-CENTRAL"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                {testResults["fardar"] && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    testResults["fardar"].success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    <Activity size={14} />
                    <span>{testResults["fardar"].message} ({testResults["fardar"].latencyMs}ms)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => handleTestConnection("courier", "fardar")}
                disabled={testingProvider === "fardar"}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Zap size={13} className={testingProvider === "fardar" ? "animate-spin text-primary" : "text-cyan-500"} />
                <span>{testingProvider === "fardar" ? "Pinging..." : "Test Ping"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveCourier("fardar", fardarForm)}
                disabled={savingProvider === "fardar"}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "fardar" ? "Encrypting..." : "Save Vault"}</span>
              </button>
            </div>
          </div>

          {/* Domex Courier */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black font-poppins text-lg">
                    DX
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground font-poppins">Domex Courier Service</h3>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      Island-wide domestic delivery network with tracking integration
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={domexForm.enabled}
                    onChange={(e) => setDomexForm({ ...domexForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Account Number</label>
                  <input
                    type="text"
                    value={domexForm.accountNumber}
                    onChange={(e) => setDomexForm({ ...domexForm, accountNumber: e.target.value })}
                    placeholder="e.g. DX-99214"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">API Username</label>
                  <input
                    type="text"
                    value={domexForm.username}
                    onChange={(e) => setDomexForm({ ...domexForm, username: e.target.value })}
                    placeholder="e.g. api_domex_merchant"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                {testResults["domex"] && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    testResults["domex"].success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    <Activity size={14} />
                    <span>{testResults["domex"].message} ({testResults["domex"].latencyMs}ms)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => handleTestConnection("courier", "domex")}
                disabled={testingProvider === "domex"}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Zap size={13} className={testingProvider === "domex" ? "animate-spin text-primary" : "text-emerald-500"} />
                <span>{testingProvider === "domex" ? "Pinging..." : "Test Ping"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveCourier("domex", domexForm)}
                disabled={savingProvider === "domex"}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "domex" ? "Encrypting..." : "Save Vault"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
