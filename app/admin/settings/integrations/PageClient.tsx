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
  Bot,
  MessageSquare,
  Send,
  Copy,
  Check,
  Smartphone,
  Radio,
} from "lucide-react";
import { useCurrentTenant } from "@/hooks/useTenantSettings";
import { integrationService, TenantIntegrations } from "@/services/integration.service";
import { aiService } from "@/services/ai.service";
import { SettingsNavTabs } from "@/components/settings/SettingsNavTabs";
import { toast } from "@/store/toast.store";

export default function IntegrationsPageClient() {
  const { data: tenant, isLoading: tenantLoading } = useCurrentTenant();
  const [integrations, setIntegrations] = useState<TenantIntegrations | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs: number; message: string }>>({});
  const [activeCategory, setActiveCategory] = useState<"payments" | "couriers" | "whatsapp" | "ai">("payments");
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  // WhatsApp Business (Meta Cloud API) local editable form state
  const [whatsappForm, setWhatsappForm] = useState({
    enabled: false,
    wabaId: "",
    phoneNumberId: "",
    accessToken: "",
    verifyToken: "xonit_wa_verify_secret",
    isSandbox: true,
    triggers: {
      posReceipts: true,
      orderTracking: true,
      abandonedCart: true,
      creditOverdue: true,
      loyaltyAlerts: true,
      catalogSync: false,
    },
  });
  const [testPhoneModalOpen, setTestPhoneModalOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [sendingTestMessage, setSendingTestMessage] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  // Local editable form states
  const [aiForm, setAiForm] = useState({
    enabled: false,
    apiKey: "",
    model: "auto",
  });
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  const [availableAiModels, setAvailableAiModels] = useState<Array<{ id: string; displayName: string }>>([]);
  const [detectedAiModel, setDetectedAiModel] = useState<string | null>(null);
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

      // Load WhatsApp Business (Meta Cloud API) configuration
      if (data?.messaging?.whatsapp) {
        const wa = data.messaging.whatsapp;
        setWhatsappForm({
          enabled: !!wa.enabled,
          wabaId: wa.wabaId || "",
          phoneNumberId: wa.phoneNumberId || "",
          accessToken: wa.accessToken || "",
          verifyToken: wa.verifyToken || "xonit_wa_verify_secret",
          isSandbox: wa.isSandbox ?? true,
          triggers: {
            posReceipts: wa.triggers?.posReceipts ?? true,
            orderTracking: wa.triggers?.orderTracking ?? true,
            abandonedCart: wa.triggers?.abandonedCart ?? true,
            creditOverdue: wa.triggers?.creditOverdue ?? true,
            loyaltyAlerts: wa.triggers?.loyaltyAlerts ?? true,
            catalogSync: wa.triggers?.catalogSync ?? false,
          },
        });
      }

      // Load AI Copilot (Google Gemini) configuration
      try {
        const aiConf = await aiService.getConfig(tenant?.id);
        if (aiConf) {
          setAiForm({
            enabled: !!aiConf.enabled,
            apiKey: aiConf.apiKey || "",
            model: aiConf.model || "auto",
          });
          setIsAiConfigured(!!aiConf.isConfigured);
        }

        // Pre-fetch available models if configured
        try {
          const modelsData = await aiService.getModels(undefined, tenant?.id);
          if (modelsData?.models) {
            setAvailableAiModels(modelsData.models);
          }
          if (modelsData?.detectedModel) {
            setDetectedAiModel(modelsData.detectedModel);
          }
        } catch {}
      } catch (e) {
        // AI settings optional
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

  const handleSaveWhatsApp = async () => {
    if (!tenant?.id) return;
    try {
      setSavingProvider("whatsapp");
      await integrationService.updateMessaging(tenant.id, "whatsapp", whatsappForm);
      toast.success("Meta WhatsApp Cloud API credentials encrypted & saved in vault");
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save WhatsApp configuration");
    } finally {
      setSavingProvider(null);
    }
  };

  const handleTestWhatsAppConnection = async () => {
    if (!tenant?.id) return;
    try {
      setTestingProvider("whatsapp");
      const res = await integrationService.testConnection(tenant.id, "messaging", "whatsapp");
      setTestResults((prev) => ({
        ...prev,
        whatsapp: {
          success: res.success,
          latencyMs: res.latencyMs,
          message: res.message,
        },
      }));
      toast.success(`WhatsApp API: Connection verified in ${res.latencyMs}ms`);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "WhatsApp connection test failed";
      setTestResults((prev) => ({
        ...prev,
        whatsapp: {
          success: false,
          latencyMs: 0,
          message: errorMsg,
        },
      }));
      toast.error(errorMsg);
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSendTestWhatsAppMessage = async () => {
    if (!tenant?.id || !testPhoneNumber.trim()) {
      toast.error("Please enter a valid recipient phone number.");
      return;
    }
    try {
      setSendingTestMessage(true);
      const res = await integrationService.sendTestWhatsAppMessage(tenant.id, testPhoneNumber.trim());
      toast.success(res.message || "Test WhatsApp message sent successfully!");
      setTestPhoneModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to dispatch test message");
    } finally {
      setSendingTestMessage(false);
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

  const handleSaveAi = async () => {
    setSavingProvider("gemini");
    try {
      await aiService.updateConfig({
        ...aiForm,
        tenantId: tenant?.id,
      });
      toast.success("Google Gemini AI Copilot credentials saved successfully");
      setIsAiConfigured(true);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message || "Failed to save AI configuration");
    } finally {
      setSavingProvider(null);
    }
  };

  const handleTestAi = async () => {
    setTestingProvider("gemini");
    try {
      const res = await aiService.testConnection({
        apiKey: aiForm.apiKey,
        model: aiForm.model,
        tenantId: tenant?.id,
      });
      if (res.detectedModel) {
        setDetectedAiModel(res.detectedModel);
      }
      if (res.availableModels && res.availableModels.length > 0) {
        setAvailableAiModels(res.availableModels);
      }
      setTestResults((prev) => ({
        ...prev,
        gemini: {
          success: res.success,
          latencyMs: res.latencyMs,
          message: res.message,
        },
      }));
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || "Gemini connection test failed";
      setTestResults((prev) => ({
        ...prev,
        gemini: { success: false, latencyMs: 0, message: msg },
      }));
      toast.error(msg);
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

        <button
          type="button"
          data-testid="whatsapp-category-tab"
          onClick={() => setActiveCategory("whatsapp")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-inter font-bold transition-all ${
            activeCategory === "whatsapp"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <MessageSquare size={15} className="text-emerald-500" />
          <span>WhatsApp Cloud API</span>
          {whatsappForm.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("ai")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-inter font-bold transition-all ${
            activeCategory === "ai"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <Sparkles size={15} className="text-amber-500" />
          <span>AI Copilot & Gemini (1)</span>
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

      {/* WHATSAPP BUSINESS (META CLOUD API) SECTION */}
      {activeCategory === "whatsapp" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WhatsApp Credentials & Automation Settings */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black font-poppins text-lg shadow-sm">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground font-poppins">Meta WhatsApp Cloud API</h3>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                        whatsappForm.isSandbox
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }`}>
                        {whatsappForm.isSandbox ? "Sandbox Simulator" : "Live Meta Cloud API"}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      Conversational commerce, instant POS e-receipts & automated CRM reminders
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={whatsappForm.enabled}
                    onChange={(e) => setWhatsappForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5 font-inter">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    type="text"
                    value={whatsappForm.wabaId}
                    onChange={(e) => setWhatsappForm((prev) => ({ ...prev, wabaId: e.target.value }))}
                    placeholder="e.g. 1048592019482"
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5 font-inter">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={whatsappForm.phoneNumberId}
                    onChange={(e) => setWhatsappForm((prev) => ({ ...prev, phoneNumberId: e.target.value }))}
                    placeholder="e.g. 1029482019482"
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[10px] text-muted mt-1 font-inter">
                    Found in Meta App Dashboard → WhatsApp → API Setup → Phone number ID.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-foreground font-inter">
                      Meta System User Permanent Access Token
                    </label>
                    <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 font-semibold">
                      <Lock size={10} /> AES-256 Vault Encrypted
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret["whatsapp_token"] ? "text" : "password"}
                      value={whatsappForm.accessToken}
                      onChange={(e) => setWhatsappForm((prev) => ({ ...prev, accessToken: e.target.value }))}
                      placeholder="EAAG... (Never stored in plaintext)"
                      className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret("whatsapp_token")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                      {showSecret["whatsapp_token"] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5 font-inter">
                    Webhook Verification Token
                  </label>
                  <input
                    type="text"
                    value={whatsappForm.verifyToken}
                    onChange={(e) => setWhatsappForm((prev) => ({ ...prev, verifyToken: e.target.value }))}
                    placeholder="e.g. xonit_wa_webhook_verify_secret"
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Environment Mode Switch */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2 font-inter">
                    Deployment Environment
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWhatsappForm((prev) => ({ ...prev, isSandbox: true }))}
                      className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        whatsappForm.isSandbox
                          ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-sm"
                          : "border-border text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      <Radio size={12} className={whatsappForm.isSandbox ? "fill-amber-500" : ""} />
                      <span>Sandbox Simulator</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhatsappForm((prev) => ({ ...prev, isSandbox: false }))}
                      className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        !whatsappForm.isSandbox
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-sm"
                          : "border-border text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      <Radio size={12} className={!whatsappForm.isSandbox ? "fill-emerald-500" : ""} />
                      <span>Live Production API</span>
                    </button>
                  </div>
                </div>

                {/* Automated Sales & CRM Triggers */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-foreground font-poppins uppercase tracking-wider">
                      Automated Sales & CRM Triggers
                    </h4>
                    <span className="text-[10px] text-emerald-500 font-mono font-semibold">
                      Connected to POS & CRM
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">POS Digital Receipts</p>
                        <p className="text-[10px] text-muted">Auto-send e-bill + LankaQR</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={whatsappForm.triggers.posReceipts}
                        onChange={(e) =>
                          setWhatsappForm((prev) => ({
                            ...prev,
                            triggers: { ...prev.triggers, posReceipts: e.target.checked },
                          }))
                        }
                        className="rounded border-border text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Dispatch & Tracking</p>
                        <p className="text-[10px] text-muted">Courier & dispatch tracking</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={whatsappForm.triggers.orderTracking}
                        onChange={(e) =>
                          setWhatsappForm((prev) => ({
                            ...prev,
                            triggers: { ...prev.triggers, orderTracking: e.target.checked },
                          }))
                        }
                        className="rounded border-border text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Cart Recovery</p>
                        <p className="text-[10px] text-muted">Unpaid quote / cart nudges</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={whatsappForm.triggers.abandonedCart}
                        onChange={(e) =>
                          setWhatsappForm((prev) => ({
                            ...prev,
                            triggers: { ...prev.triggers, abandonedCart: e.target.checked },
                          }))
                        }
                        className="rounded border-border text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Credit Overdue Alerts</p>
                        <p className="text-[10px] text-muted">B2B ledger statements</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={whatsappForm.triggers.creditOverdue}
                        onChange={(e) =>
                          setWhatsappForm((prev) => ({
                            ...prev,
                            triggers: { ...prev.triggers, creditOverdue: e.target.checked },
                          }))
                        }
                        className="rounded border-border text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Loyalty & VIP Upgrades</p>
                        <p className="text-[10px] text-muted">Points milestones & tier badges</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={whatsappForm.triggers.loyaltyAlerts}
                        onChange={(e) =>
                          setWhatsappForm((prev) => ({
                            ...prev,
                            triggers: { ...prev.triggers, loyaltyAlerts: e.target.checked },
                          }))
                        }
                        className="rounded border-border text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Catalog Sync</p>
                        <p className="text-[10px] text-muted">Interactive Chat-to-Order</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={whatsappForm.triggers.catalogSync}
                        onChange={(e) =>
                          setWhatsappForm((prev) => ({
                            ...prev,
                            triggers: { ...prev.triggers, catalogSync: e.target.checked },
                          }))
                        }
                        className="rounded border-border text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Result Display */}
                {testResults["whatsapp"] && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border font-inter ${
                      testResults["whatsapp"].success
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        : "bg-red-500/10 border-red-500/20 text-red-500"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResults["whatsapp"].success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      <span className="font-medium">{testResults["whatsapp"].message}</span>
                    </div>
                    {testResults["whatsapp"].latencyMs > 0 && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-background border border-border font-bold">
                        {testResults["whatsapp"].latencyMs}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-6 mt-6 border-t border-border flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="test-whatsapp-btn"
                  onClick={handleTestWhatsAppConnection}
                  disabled={testingProvider === "whatsapp" || !whatsappForm.enabled}
                  className="h-8 px-3.5 rounded-lg bg-background border border-border hover:bg-surface-hover text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Activity size={13} className={testingProvider === "whatsapp" ? "animate-spin text-emerald-500" : "text-emerald-500"} />
                  <span>{testingProvider === "whatsapp" ? "Testing..." : "Test Connection"}</span>
                </button>

                <button
                  type="button"
                  data-testid="ping-whatsapp-btn"
                  onClick={() => setTestPhoneModalOpen(true)}
                  disabled={!whatsappForm.enabled}
                  className="h-8 px-3.5 rounded-lg bg-background border border-border hover:bg-surface-hover text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Send size={13} className="text-emerald-500" />
                  <span>Send Test Ping</span>
                </button>
              </div>

              <button
                type="button"
                data-testid="save-whatsapp-btn"
                onClick={handleSaveWhatsApp}
                disabled={savingProvider === "whatsapp"}
                className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "whatsapp" ? "Encrypting..." : "Save Settings"}</span>
              </button>
            </div>
          </div>

          {/* Webhook Endpoint & Setup Guide Card */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground font-poppins">Webhook Endpoint & Setup</h3>
                  <p className="text-xs text-muted font-inter mt-0.5">Meta Developer Portal Configuration</p>
                </div>
              </div>

              {/* Copyable Webhook URL */}
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wider font-inter">
                    Callback Webhook URL
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                    POST Webhook
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[11px] font-mono bg-surface p-2 rounded-lg border border-border text-foreground flex-1 truncate">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/api/v1/integrations/whatsapp/webhook`
                      : "https://erp.xonitspace.com/api/v1/integrations/whatsapp/webhook"}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      const url = typeof window !== "undefined"
                        ? `${window.location.origin}/api/v1/integrations/whatsapp/webhook`
                        : "https://erp.xonitspace.com/api/v1/integrations/whatsapp/webhook";
                      navigator.clipboard.writeText(url);
                      setCopiedWebhookUrl(true);
                      setTimeout(() => setCopiedWebhookUrl(false), 2000);
                      toast.success("Webhook URL copied to clipboard");
                    }}
                    className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground transition-all shrink-0"
                    title="Copy Webhook URL"
                  >
                    {copiedWebhookUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Meta Setup Steps */}
              <div className="space-y-3 text-xs text-muted font-inter">
                <div className="p-3 rounded-xl bg-background border border-border">
                  <div className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold">1</span>
                    Meta App Configuration
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Open <span className="font-mono text-foreground font-semibold">developers.facebook.com</span>, navigate to your App → <span className="text-foreground font-semibold">WhatsApp → Configuration</span>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <div className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold">2</span>
                    Paste Webhook & Verify Token
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Click <span className="text-foreground font-semibold">Edit Callback URL</span>, paste the webhook URL above, and provide your verification token: <code className="bg-surface px-1.5 py-0.5 rounded text-foreground font-mono font-bold text-[10px]">{whatsappForm.verifyToken}</code>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <div className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold">3</span>
                    Subscribe to Webhook Fields
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Under Webhook Fields, subscribe to <span className="font-mono text-foreground font-semibold">messages</span> and <span className="font-mono text-foreground font-semibold">message_template_status_update</span> to receive customer chats and delivery receipts.
                  </p>
                </div>
              </div>

              {/* Enterprise Security Highlights */}
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Enterprise Conversational Engine
                </div>
                <ul className="text-[11px] text-muted space-y-1 list-disc list-inside">
                  <li>Includes 1,000 free service conversations/month per Meta policy.</li>
                  <li>Tokens are encrypted using AES-256-GCM envelope encryption.</li>
                  <li>Automations run directly across POS cashiers, Customer CRM, and ERP ledgers.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI ASSISTANT & COPILOT (GEMINI) SECTION */}
      {activeCategory === "ai" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 via-primary/10 to-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black font-poppins text-lg shadow-sm">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground font-poppins">Google Gemini AI Copilot</h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                        Multimodal LLM
                      </span>
                    </div>
                    <p className="text-xs text-muted font-inter mt-0.5">
                      Powers in-dashboard AI Copilot and RAG queries with real-time General Ledger and store metrics.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiForm.enabled}
                    onChange={(e) => setAiForm({ ...aiForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>

              {/* Status and Diagnostics */}
              <div className="p-3.5 rounded-xl bg-background border border-border flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted font-medium">Model Engine</span>
                  <span className="font-mono font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {detectedAiModel ? `${detectedAiModel} (Auto)` : (aiForm.model === "auto" ? "Auto-Detecting" : aiForm.model)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted font-medium">RAG Grounding</span>
                  <span className="text-foreground font-semibold">Live Ledger + Dual-Branch Stock</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted font-medium">Credential Status</span>
                  <span className={`font-mono text-[11px] font-bold ${isAiConfigured ? "text-emerald-500" : "text-amber-500"}`}>
                    {isAiConfigured ? "VAULT CONFIGURED" : "NOT CONFIGURED"}
                  </span>
                </div>

                {testResults["gemini"] && (
                  <div
                    className={`mt-2 p-2.5 rounded-lg text-xs font-inter flex items-start gap-2 border ${
                      testResults["gemini"].success
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    }`}
                  >
                    {testResults["gemini"].success ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-semibold">{testResults["gemini"].message}</p>
                      {testResults["gemini"].latencyMs > 0 && (
                        <p className="text-[10px] font-mono opacity-80 mt-0.5">Latency: {testResults["gemini"].latencyMs}ms</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Controls */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                    Google Gemini API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret["geminiApiKey"] ? "text" : "password"}
                      value={aiForm.apiKey}
                      onChange={(e) => setAiForm({ ...aiForm, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="w-full h-10 px-3 pr-10 rounded-xl bg-background border border-border text-xs font-mono text-foreground focus:outline-none focus:border-amber-500/80 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret("geminiApiKey")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                      {showSecret["geminiApiKey"] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted mt-1">
                    Get an API key from Google AI Studio (ai.google.dev). Keys are encrypted with tenant-scoped AES-256.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                      Gemini Model Variant
                    </label>
                    {detectedAiModel && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-semibold font-mono">
                        Active: {detectedAiModel}
                      </span>
                    )}
                  </div>
                  <select
                    value={aiForm.model}
                    onChange={(e) => setAiForm({ ...aiForm, model: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-inter text-foreground focus:outline-none focus:border-amber-500/80 transition-colors"
                  >
                    <option value="auto">✨ Auto-Detect from API Key (Recommended: Detects latest supported model)</option>
                    {availableAiModels && availableAiModels.length > 0 ? (
                      availableAiModels
                        .filter(m => m.id !== 'auto')
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            {m.displayName}
                          </option>
                        ))
                    ) : (
                      <>
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recommended: Ultra-fast & high quota)</option>
                        <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (High Speed)</option>
                        <option value="gemini-3.8-flash">Gemini 3.8 Flash (Latest Preview)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep complex business reasoning)</option>
                      </>
                    )}
                  </select>
                  <p className="text-[10px] text-muted mt-1">
                    When set to &quot;Auto-Detect&quot;, the system queries your API key directly for active models and auto-migrates if Google updates or deprecates an older model.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-border mt-4">
              <button
                type="button"
                onClick={handleTestAi}
                disabled={testingProvider === "gemini"}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Zap size={13} className={testingProvider === "gemini" ? "animate-spin text-amber-500" : "text-amber-500"} />
                <span>{testingProvider === "gemini" ? "Testing API..." : "Test Connection"}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAi}
                disabled={savingProvider === "gemini"}
                className="h-8 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingProvider === "gemini" ? "Saving..." : "Save Gemini Key"}</span>
              </button>
            </div>
          </div>

          {/* RAG Telemetry Architecture Info Card */}
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground font-poppins">RAG Telemetry & Guardrails</h3>
                  <p className="text-xs text-muted font-inter mt-0.5">How your store data is processed by the AI</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-muted font-inter">
                <div className="p-3 rounded-xl bg-background border border-border">
                  <div className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Strict Multi-Tenant Isolation
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Queries are scoped strictly to your organization ID. Prompt injection attacks and cross-tenant exfiltration are blocked at the controller layer.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <div className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                    <Activity size={14} className="text-blue-500" />
                    Live Financial Grounding
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    The assistant has real-time read access to your General Ledger balance status, today's sales totals, and Accounts Receivable / Payable aging schedules.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <div className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Fallback Mechanism
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    If Gemini API is offline or unconfigured, the system automatically falls back to OpenAI or the built-in offline rule engine so operations are never interrupted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test WhatsApp Message Modal */}
      {testPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground font-poppins">Send Test WhatsApp Ping</h3>
                  <p className="text-[11px] text-muted font-inter">Dispatches verification greeting & interactive buttons</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestPhoneModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-background hover:bg-surface-hover text-muted hover:text-foreground flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 font-inter">
                  Recipient Phone Number
                </label>
                <input
                  type="text"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="e.g. 0771234567 or +94771234567"
                  className="w-full h-10 px-3.5 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  autoFocus
                />
                <p className="text-[10px] text-muted mt-1 font-inter">
                  Mode: <span className="font-semibold text-foreground">{whatsappForm.isSandbox ? "Sandbox Simulator" : "Live Meta Cloud API"}</span>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border text-[11px] text-muted space-y-1">
                <p className="font-semibold text-foreground">Message Payload Preview:</p>
                <p className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  👋 Greetings from {tenant?.name || "XONIT Commerce"}!<br />
                  Your Meta WhatsApp Cloud API connection is active & verified.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTestPhoneModalOpen(false)}
                className="h-9 px-4 rounded-xl bg-background border border-border hover:bg-surface-hover text-foreground text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="send-modal-ping-btn"
                onClick={handleSendTestWhatsAppMessage}
                disabled={sendingTestMessage || !testPhoneNumber.trim()}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Send size={13} className={sendingTestMessage ? "animate-spin" : ""} />
                <span>{sendingTestMessage ? "Dispatching..." : "Send Test Message"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
