"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  Code2,
  Copy,
  Check,
  Plus,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  ExternalLink,
  RefreshCw,
  Globe,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  X,
  FileCode,
  Smartphone,
} from "lucide-react";
import { useCurrentTenant } from "@/hooks/useTenantSettings";
import { apiKeyService, ApiKeyItem, CreateApiKeyDto } from "@/services/apiKey.service";
import { SettingsNavTabs } from "@/components/settings/SettingsNavTabs";
import { toast } from "@/store/toast.store";

const AVAILABLE_SCOPES = [
  { id: "catalog:read", label: "Catalog Read", desc: "Read products, categories & branch stock" },
  { id: "customers:auth", label: "Customer Auth", desc: "Storefront customer registration, login & profile" },
  { id: "checkout:calculate", label: "Cart Calculate", desc: "Real-time tax, promo & shipping fee engine" },
  { id: "orders:create", label: "Place Orders", desc: "Direct headless checkout order submission" },
  { id: "orders:read", label: "Read Orders", desc: "Query order status & fulfillment history" },
  { id: "payments:process", label: "Process Payments", desc: "Initiate PayHere / Koko / LankaQR transactions" },
  { id: "webhooks:manage", label: "Manage Webhooks", desc: "Subscribe to order.created, order.paid events" },
];

export default function DeveloperApiPageClient() {
  const { data: tenant, isLoading: tenantLoading } = useCurrentTenant();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // New key form state
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "catalog:read",
    "customers:auth",
    "checkout:calculate",
    "orders:create",
    "orders:read",
  ]);
  const [allowedOriginsStr, setAllowedOriginsStr] = useState("*");
  const [rateLimit, setRateLimit] = useState(120);

  // One-time secret display dialog
  const [createdSecretData, setCreatedSecretData] = useState<{ clientId: string; secretKey: string; name: string } | null>(null);

  // Quickstart tab
  const [activeCodeTab, setActiveCodeTab] = useState<"curl" | "nextjs" | "flutter">("curl");

  const loadKeys = async () => {
    if (!tenant?.id) return;
    try {
      setLoading(true);
      const data = await apiKeyService.listKeys(tenant.id);
      setKeys(data || []);
    } catch (err: any) {
      console.error("Failed to load API keys", err);
      toast.error(err?.response?.data?.message || "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      loadKeys();
    } else if (!tenantLoading) {
      setLoading(false);
    }
  }, [tenant?.id, tenantLoading]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;
    if (!keyName.trim()) {
      toast.error("Please enter a key identifier name");
      return;
    }

    try {
      setCreating(true);
      const origins = allowedOriginsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: CreateApiKeyDto = {
        name: keyName.trim(),
        scopes: selectedScopes,
        rateLimitPerMin: Number(rateLimit) || 120,
        allowedOrigins: origins.length > 0 ? origins : ["*"],
      };

      const result = await apiKeyService.createKey(tenant.id, payload);
      setIsCreateModalOpen(false);

      if (result.secretKey) {
        setCreatedSecretData({
          clientId: result.clientId,
          secretKey: result.secretKey,
          name: result.name,
        });
      }

      toast.success("API Key generated successfully!");
      // Reset form
      setKeyName("");
      setSelectedScopes(["catalog:read", "customers:auth", "checkout:calculate", "orders:create", "orders:read"]);
      setAllowedOriginsStr("*");
      await loadKeys();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!tenant?.id) return;
    if (!confirm("Are you sure you want to revoke this API key? Any external storefront or mobile app using it will immediately lose API access.")) {
      return;
    }

    try {
      setRevokingId(keyId);
      await apiKeyService.revokeKey(tenant.id, keyId);
      toast.success("API key revoked");
      await loadKeys();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to revoke API key");
    } finally {
      setRevokingId(null);
    }
  };

  const toggleScope = (scopeId: string) => {
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  const activeClientId = keys.find((k) => k.status === "ACTIVE")?.clientId || "xcl_live_YOUR_CLIENT_ID";

  return (
    <div className="flex flex-col p-4 md:p-8 max-w-[1280px] mx-auto w-full gap-6">
      {/* Settings Breadcrumbs & Tabs */}
      <SettingsNavTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 tracking-wider uppercase flex items-center gap-1.5">
              <Code2 size={13} />
              Headless Engine
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold flex items-center gap-1">
              <KeyRound size={11} />
              Scoped API Authentication
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight font-poppins">
            Headless Developer API & Storefront Keys
          </h1>
          <p className="text-xs md:text-sm text-muted font-inter mt-1 max-w-2xl">
            Power external e-commerce web storefronts, customer mobile apps, and kiosks using XONIT as your centralized operations backend for inventory, orders, checkout, and payments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadKeys}
            className="h-10 px-4 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-hover flex items-center gap-2 transition-all text-xs font-semibold"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            <span>Reload</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-inter font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 active:scale-95"
          >
            <Plus size={15} />
            <span>Generate New API Key</span>
          </button>
        </div>
      </div>

      {/* API Keys Table Card */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground font-poppins flex items-center gap-2">
              Active Headless API Credentials
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {keys.length}
              </span>
            </h2>
            <p className="text-xs text-muted font-inter mt-0.5">
              Each key authenticates incoming requests via <code className="font-mono text-primary">x-client-id</code> and <code className="font-mono text-primary">x-api-key</code> headers.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-muted font-inter">Loading keys...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl text-center bg-background/50">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <KeyRound size={24} />
            </div>
            <h3 className="text-sm font-bold text-foreground font-poppins">No API Keys Generated Yet</h3>
            <p className="text-xs text-muted font-inter max-w-sm mt-1">
              Generate an API key to connect your external Next.js website, Shopify theme, or Flutter app to XONIT.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Plus size={14} />
              <span>Create First Key</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-inter">
              <thead>
                <tr className="border-b border-border text-muted font-semibold">
                  <th className="pb-3 pr-4">Key Name</th>
                  <th className="pb-3 px-4">Client ID</th>
                  <th className="pb-3 px-4">Scopes</th>
                  <th className="pb-3 px-4">CORS Origins</th>
                  <th className="pb-3 px-4">Rate Limit</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-background/40 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-foreground font-poppins">{k.name}</div>
                      <div className="text-[10px] text-muted font-mono mt-0.5">
                        Created {new Date(k.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 py-1 w-fit font-mono text-[11px] text-foreground">
                        <span>{k.clientId}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(k.clientId, `cid-${k.id}`)}
                          className="text-muted hover:text-foreground"
                          title="Copy Client ID"
                        >
                          {copiedId === `cid-${k.id}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-muted">
                      {k.allowedOrigins.join(", ")}
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-foreground">
                      {k.rateLimitPerMin} req/m
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          k.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      {k.status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(k.id)}
                          disabled={revokingId === k.id}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Revoke Key"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Developer Quickstart & Endpoints */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground font-poppins flex items-center gap-2">
              <Terminal size={18} className="text-primary" />
              Integration Quickstarts & Code Samples
            </h2>
            <p className="text-xs text-muted font-inter mt-0.5">
              Ready-to-use snippets for your external storefront or mobile application.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setActiveCodeTab("curl")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeCodeTab === "curl" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              cURL
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab("nextjs")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeCodeTab === "nextjs" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              Next.js / TS
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab("flutter")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeCodeTab === "flutter" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              Flutter Dart
            </button>
          </div>
        </div>

        {/* Code Block Container */}
        <div className="relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs p-4 shadow-inner">
          <button
            type="button"
            onClick={() => {
              const code = activeCodeTab === "curl" ? curlSnippet(activeClientId) : activeCodeTab === "nextjs" ? nextjsSnippet(activeClientId) : flutterSnippet(activeClientId);
              copyToClipboard(code, "code-snippet");
            }}
            className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all text-[11px]"
          >
            {copiedId === "code-snippet" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copiedId === "code-snippet" ? "Copied" : "Copy Code"}</span>
          </button>

          <pre className="overflow-x-auto pr-24 leading-relaxed font-mono">
            {activeCodeTab === "curl" && curlSnippet(activeClientId)}
            {activeCodeTab === "nextjs" && nextjsSnippet(activeClientId)}
            {activeCodeTab === "flutter" && flutterSnippet(activeClientId)}
          </pre>
        </div>

        {/* REST API Endpoints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                GET
              </span>
              <span className="text-xs font-bold text-foreground font-mono">/headless/catalog/products</span>
            </div>
            <p className="text-[11px] text-muted font-inter">Live catalog with real-time stock balances across all branches.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                POST
              </span>
              <span className="text-xs font-bold text-foreground font-mono">/headless/checkout/calculate</span>
            </div>
            <p className="text-[11px] text-muted font-inter">Calculate subtotal, regional taxes, promos & shipping fees.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                POST
              </span>
              <span className="text-xs font-bold text-foreground font-mono">/headless/orders</span>
            </div>
            <p className="text-[11px] text-muted font-inter">Submit orders atomically with inventory reservation & webhook triggers.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                POST
              </span>
              <span className="text-xs font-bold text-foreground font-mono">/headless/auth/login</span>
            </div>
            <p className="text-[11px] text-muted font-inter">Storefront customer session login returning customer JWT.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20">
                POST
              </span>
              <span className="text-xs font-bold text-foreground font-mono">/headless/payments/payhere/initiate</span>
            </div>
            <p className="text-[11px] text-muted font-inter">Generates PayHere hash and payment payload using encrypted vault credentials.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                GET
              </span>
              <span className="text-xs font-bold text-foreground font-mono">/headless/payments/gateways</span>
            </div>
            <p className="text-[11px] text-muted font-inter">Returns enabled gateways (PayHere, Koko, LankaQR) for checkout selection.</p>
          </div>
        </div>
      </div>

      {/* CREATE API KEY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5 relative">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <KeyRound size={16} />
                </div>
                <h3 className="text-lg font-bold text-foreground font-poppins">Generate Headless API Key</h3>
              </div>
              <p className="text-xs text-muted font-inter">
                Create a scoped credential for external apps, storefronts, or backend microservices.
              </p>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
                  Key Identifier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Next.js Web Storefront (Production)"
                  className="w-full h-10 bg-background border border-border rounded-xl px-3 text-xs text-foreground outline-none focus:border-primary font-inter transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
                  Permissions & Granular Scopes
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_SCOPES.map((scope) => {
                    const isChecked = selectedScopes.includes(scope.id);
                    return (
                      <div
                        key={scope.id}
                        onClick={() => toggleScope(scope.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? "bg-primary/10 border-primary/30 text-foreground"
                            : "bg-background border-border text-muted hover:border-border/80"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="mt-0.5 rounded text-primary focus:ring-0"
                        />
                        <div>
                          <div className="font-bold text-[11px] font-poppins leading-tight">{scope.label}</div>
                          <div className="text-[10px] text-muted font-inter leading-tight mt-0.5">{scope.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground/80 mb-1 block">
                    CORS Allowed Origins
                  </label>
                  <input
                    type="text"
                    value={allowedOriginsStr}
                    onChange={(e) => setAllowedOriginsStr(e.target.value)}
                    placeholder="* or https://store.lk"
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground/80 mb-1 block">
                    Rate Limit (Req / Min)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-xs text-foreground font-mono outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-9 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <KeyRound size={14} />
                  <span>{creating ? "Creating..." : "Generate Key"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONE-TIME SECRET DISPLAY DIALOG */}
      {createdSecretData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface border border-emerald-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 relative">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground font-poppins">API Key Created Successfully</h3>
                <p className="text-xs text-muted font-inter mt-0.5">
                  Save your API Secret now. For security purposes, this secret is hashed with SHA-256 and will <strong>never be shown again</strong>.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>If you lose this key, you will have to generate a new one and revoke the previous key.</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">Client ID (Public Identifier)</label>
                <div className="flex items-center justify-between bg-background border border-border rounded-xl px-3 py-2 font-mono text-xs text-foreground">
                  <span>{createdSecretData.clientId}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdSecretData.clientId, "modal-cid")}
                    className="text-muted hover:text-foreground"
                  >
                    {copiedId === "modal-cid" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground/80 mb-1 block">API Secret Key (Private Token)</label>
                <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 font-mono text-xs text-emerald-400 select-all">
                  <span className="truncate pr-2">{createdSecretData.secretKey}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdSecretData.secretKey, "modal-secret")}
                    className="text-zinc-400 hover:text-white shrink-0"
                  >
                    {copiedId === "modal-secret" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border mt-1">
              <button
                type="button"
                onClick={() => setCreatedSecretData(null)}
                className="h-9 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-all shadow-sm"
              >
                I have saved my secret securely
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function curlSnippet(clientId: string) {
  return `# 1. Fetch Storefront Catalog with Live Branch Inventory
curl -X GET "https://api.xonit.space/api/v1/headless/catalog/products" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: xak_live_YOUR_SECRET"

# 2. Real-Time Cart Subtotal, Tax & Shipping Calculation
curl -X POST "https://api.xonit.space/api/v1/headless/checkout/calculate" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: xak_live_YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [{"productId": "PROD-101", "quantity": 2, "unitPrice": 4500}],
    "deliveryZone": "COLOMBO_METRO"
  }'

# 3. Direct Headless Order Placement
curl -X POST "https://api.xonit.space/api/v1/headless/orders" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: xak_live_YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer": {
      "name": "Kamal Perera",
      "email": "kamal@example.com",
      "phone": "+94771234567"
    },
    "items": [{"productId": "PROD-101", "quantity": 2, "unitPrice": 4500}],
    "paymentMethod": "PAYHERE"
  }'`;
}

function nextjsSnippet(clientId: string) {
  return `// lib/xonit.ts - Typescript Headless Client
const XONIT_API_URL = process.env.XONIT_API_URL || "https://api.xonit.space/api/v1/headless";
const CLIENT_ID = process.env.XONIT_CLIENT_ID || "${clientId}";
const API_KEY = process.env.XONIT_API_KEY || "xak_live_...";

export async function fetchHeadlessProducts() {
  const res = await fetch(\`\${XONIT_API_URL}/catalog/products\`, {
    headers: {
      "x-client-id": CLIENT_ID,
      "x-api-key": API_KEY,
    },
    next: { revalidate: 60 } // Next.js ISR cache
  });
  const data = await res.json();
  return data.data;
}

export async function placeHeadlessOrder(cartData: any) {
  const res = await fetch(\`\${XONIT_API_URL}/orders\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": CLIENT_ID,
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(cartData)
  });
  return res.json();
}`;
}

function flutterSnippet(clientId: string) {
  return `// lib/services/xonit_service.dart - Flutter / Dart SDK
import 'dart:convert';
import 'package:http/http.dart' as http;

class XonitService {
  static const String baseUrl = 'https://api.xonit.space/api/v1/headless';
  static const String clientId = '${clientId}';
  static const String apiKey = 'xak_live_YOUR_SECRET';

  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'x-client-id': clientId,
    'x-api-key': apiKey,
  };

  // Fetch products
  static Future<List<dynamic>> getProducts() async {
    final response = await http.get(
      Uri.parse('\$baseUrl/catalog/products'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return json['data'];
    }
    throw Exception('Failed to load products');
  }

  // Calculate cart checkout
  static Future<Map<String, dynamic>> calculateCheckout(Map<String, dynamic> cart) async {
    final response = await http.post(
      Uri.parse('\$baseUrl/checkout/calculate'),
      headers: headers,
      body: jsonEncode(cart),
    );
    return jsonDecode(response.body)['data'];
  }
}`;
}
