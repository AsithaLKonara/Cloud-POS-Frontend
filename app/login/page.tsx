"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Store,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Utensils,
  Scissors,
  ShoppingBag,
  Layers,
  Cpu,
  Printer,
  ChevronRight,
} from "lucide-react";
import { loginSchema, LoginFormData } from "@/lib/validations";
import { useAuthStore } from "@/store/auth.store";
import { generateDeviceFingerprint } from "@/lib/fingerprint";

interface MultiTenantDevAccount {
  role: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  email: string;
  tenantSlug: string;
  businessType: string;
  scope: string;
  icon: any;
  defaultPassword?: string;
}

const DEV_ACCOUNTS: MultiTenantDevAccount[] = [
  {
    role: "Super Platform Admin",
    badgeColor: "text-cyan-400",
    badgeBg: "bg-cyan-500/10",
    badgeBorder: "border-cyan-500/30",
    email: "admin@xonit.space",
    tenantSlug: "xonit-platform",
    businessType: "Global Platform Control",
    scope: "All Tenants & Billing Control",
    icon: Sparkles,
    defaultPassword: "Admin@123456",
  },
  {
    role: "Retail Boutique Admin",
    badgeColor: "text-purple-400",
    badgeBg: "bg-purple-500/10",
    badgeBorder: "border-purple-500/30",
    email: "retail.admin@xonit.space",
    tenantSlug: "velvet-threads",
    businessType: "Retail & Apparel",
    scope: "Catalog, Stock & POS",
    icon: ShoppingBag,
    defaultPassword: "Password@123",
  },
  {
    role: "Restaurant & Cafe Manager",
    badgeColor: "text-amber-400",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/30",
    email: "bistro.admin@xonit.space",
    tenantSlug: "artisan-bistro",
    businessType: "Food & Beverage",
    scope: "KOT, Tables & Split Bills",
    icon: Utensils,
    defaultPassword: "Password@123",
  },
  {
    role: "Salon & Spa Director",
    badgeColor: "text-rose-400",
    badgeBg: "bg-rose-500/10",
    badgeBorder: "border-rose-500/30",
    email: "salon.admin@xonit.space",
    tenantSlug: "luxe-spa-wellness",
    businessType: "Salon & Wellness",
    scope: "Stylists, Appointments & Services",
    icon: Scissors,
    defaultPassword: "Password@123",
  },
  {
    role: "POS Terminal Cashier",
    badgeColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/30",
    email: "cashier.colombo@xonit.space",
    tenantSlug: "colombo-central",
    businessType: "Checkout Register",
    scope: "Fast Cashier Shift CMB-01",
    icon: Store,
    defaultPassword: "Password@123",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const loginAction = useAuthStore((state) => state.login);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleSelectAccount = (account: MultiTenantDevAccount) => {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.defaultPassword || "Password@123", { shouldValidate: true });
    if (account.tenantSlug) {
      setValue("tenantSlug", account.tenantSlug);
    }
    setSelectedEmail(account.email);
    setError(null);
  };

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);

    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      const result = await loginAction({
        ...data,
        deviceFingerprint,
      });

      const roles = (result.user.roles || []).map((r: string) => r.toUpperCase());
      if (roles.includes("CASHIER") || roles.includes("POS_OPERATOR")) {
        router.push("/pos");
      } else if (roles.includes("BRANCH_MANAGER")) {
        router.push("/branch-admin");
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.response?.data?.error;
      const msg =
        serverMsg ||
        (err.isAxiosError ? "Network connection error. Please verify backend service." : err.message) ||
        "Failed to sign in. Please verify your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col lg:flex-row overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* =========================================================================
          LEFT COLUMN: Company Details inspiring XONIT SPACE
          ========================================================================= */}
      <div className="w-full lg:w-[52%] xl:w-[55%] relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-gradient-to-br from-[#060D1F] via-[#030611] to-[#010308] overflow-hidden">
        {/* Ambient Space Glow & Grid Background */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

        {/* Brand Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-5 h-5 text-white" viewBox="0 0 32 32" fill="none">
                <path d="M7.5 7.5L12.5 7.5L24.5 24.5L19.5 24.5Z" fill="currentColor" />
                <path d="M24.5 7.5L19.5 7.5L15.3 13.5L17.8 17L24.5 7.5Z" fill="currentColor" opacity="0.85" />
                <path d="M14.2 18.5L11.7 15L7.5 24.5L12.5 24.5L14.2 18.5Z" fill="currentColor" opacity="0.85" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                XONIT <span className="text-cyan-400 font-medium text-sm px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">SPACE</span>
              </span>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Enterprise POS & ERP</p>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CLOUD POS CLUSTER • CMB-01</span>
          </div>
        </div>

        {/* Center Presentation: XONIT SPACE Value Proposition */}
        <div className="relative z-10 my-10 lg:my-auto max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Universal Multi-Tenant Operating System</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Powering Any Business in <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">Sri Lanka</span> at Scale.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal">
            Whether running high-volume fashion boutiques, bustling cafes with split-billing, luxury salons with appointment scheduling, or multi-branch wholesale depots — XONIT unifies checkout, inventory, and automated GAAP accounting.
          </p>

          {/* Key Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Sub-100ms POS Engine</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Split bills, table maps & thermal slips</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Strict Multi-Tenancy</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Isolated databases & compound keys</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Local Hardware Bridge</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">80mm printer, scales & barcode scanner</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">LankaQR & Local Fintech</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">PayHere, Koko BNPL & instant LKR settlement</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Reliability Proof */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>SOC2 Type II & Banking Grade SSL</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Node-Print Client Ready</span>
          </div>
          <span className="font-mono text-slate-500">v2.4.0-ENTERPRISE</span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Cardless Full-Column Clean Login Form & Dev Seed Switcher
          ========================================================================= */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-[#040814]/95 backdrop-blur-2xl overflow-y-auto">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs uppercase font-mono tracking-widest text-slate-500">
            Terminal Access Portal
          </span>
          <Link
            href="/"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>Back to SaaS Overview</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Cardless Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-4">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sign In to Terminal
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              Enter your workspace credentials or click any demo role below for 1-click access.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 mb-5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Optional Workspace / Tenant Identifier */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Workspace / Tenant Slug <span className="text-slate-500 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. colombo-central or velvet-threads"
                  {...register("tenantSlug")}
                  className="w-full h-11 pl-10 pr-4 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Staff Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="staff@xonit.space"
                  {...register("email")}
                  className={`w-full h-11 pl-10 pr-4 bg-slate-900/60 border ${
                    errors.email ? "border-red-500" : "border-slate-800"
                  } rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  {...register("password")}
                  className={`w-full h-11 pl-10 pr-10 bg-slate-900/60 border ${
                    errors.password ? "border-red-500" : "border-slate-800"
                  } rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-3 group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Terminal Signature...</span>
                </span>
              ) : (
                <>
                  <span>Sign In to XONIT Terminal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* =========================================================================
              MULTI-TENANCY SEEDED CREDENTIALS: Click to Instant Auto-Fill
              ========================================================================= */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multi-Tenancy Seeded Credentials</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-bold">
                1-CLICK AUTOFILL
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Test universal workflows across different industry archetypes:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {DEV_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = selectedEmail === acc.email;

                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 group relative ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                        : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${acc.badgeBg} ${acc.badgeBorder} border`}>
                          <Icon className={`w-3.5 h-3.5 ${acc.badgeColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {acc.role}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {acc.businessType}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            {acc.email}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          Filled
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
                          Insert →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-cyan-500" />
            <span>ESC/POS Bridge: Ready (127.0.0.1:18181)</span>
          </div>
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Start 14-Day Free Trial →
          </Link>
        </div>
      </div>
    </main>
  );
}
