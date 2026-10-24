"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Building2,
  Store,
  CheckCircle2,
  Sparkles,
  Utensils,
  Scissors,
  ShoppingBag,
  Layers,
  Cpu,
  Printer,
  ChevronLeft,
  ArrowLeft,
  Warehouse,
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
    badgeColor: "text-[#00C987]",
    badgeBg: "bg-[#00C987]/10",
    badgeBorder: "border-[#00C987]/30",
    email: "admin@xonit.space",
    tenantSlug: "xonit-platform",
    businessType: "Global Platform Control",
    scope: "All Tenants & Billing Control",
    icon: Sparkles,
    defaultPassword: "Admin@123456",
  },
  {
    role: "Retail Boutique Admin",
    badgeColor: "text-[#42C0C8]",
    badgeBg: "bg-[#42C0C8]/10",
    badgeBorder: "border-[#42C0C8]/30",
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
    badgeBg: "bg-amber-400/10",
    badgeBorder: "border-amber-400/30",
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
    badgeBg: "bg-rose-400/10",
    badgeBorder: "border-rose-400/30",
    email: "salon.admin@xonit.space",
    tenantSlug: "luxe-spa-wellness",
    businessType: "Salon & Wellness",
    scope: "Stylists, Appointments & Services",
    icon: Scissors,
    defaultPassword: "Password@123",
  },
  {
    role: "POS Terminal Cashier",
    badgeColor: "text-[#00C987]",
    badgeBg: "bg-[#00C987]/10",
    badgeBorder: "border-[#00C987]/30",
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

      const roles = (result.user.roles || []).map((r: string) => r.toUpperCase().replace(/[\s_]/g, ""));
      if (roles.includes("SUPERADMIN") || roles.includes("SYSTEMOWNER") || result.user.email === "admin@xonit.space") {
        router.push("/superadmin");
      } else if (roles.includes("CASHIER") || roles.includes("POSOPERATOR")) {
        router.push("/pos");
      } else if (roles.includes("BRANCHMANAGER")) {
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
    <main className="min-h-screen w-full bg-[#050706] text-[#F4F5F1] font-inter flex flex-col lg:flex-row overflow-x-hidden selection:bg-[#00C987]/30 selection:text-[#00C987] antialiased">
      {/* =========================================================================
          LEFT COLUMN: Cinematic Editorial Branding (Obsidian × Emerald)
          ========================================================================= */}
      <div className="w-full lg:w-[50%] xl:w-[52%] relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#26322C] bg-[#0B100F] overflow-hidden">
        {/* Background Atmospheric Layer: Wallpaper texture & Emerald Bloom */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 opacity-25 mix-blend-screen">
            <Image
              src="/gradient-wallpaper.png"
              alt="Atmospheric Background"
              fill
              priority
              className="object-cover object-top"
            />
          </div>
          <div
            className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full filter blur-[130px] opacity-20 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(0, 201, 135, 0.4) 0%, rgba(66, 192, 200, 0.15) 60%, transparent 80%)",
            }}
          />
          <div
            className="absolute top-[40%] -right-[15%] w-[45vw] h-[45vw] rounded-full filter blur-[140px] opacity-15 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(66, 192, 200, 0.3) 0%, transparent 75%)",
            }}
          />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#26322c15_1px,transparent_1px),linear-gradient(to_bottom,#26322c15_1px,transparent_1px)] bg-[size:40px_40px]" />
          {/* Giant Monospace Watermark */}
          <div className="absolute top-[20%] -left-10 select-none opacity-[0.035] font-ibm font-black text-[16vw] leading-none text-white pointer-events-none uppercase">
            XONIT
          </div>
        </div>

        {/* Brand Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C987] rounded-md">
            <Image
              src="/logo/xonit-white-trimmed.png"
              alt="XONIT POS"
              width={130}
              height={26}
              className="h-6 sm:h-7 w-auto object-contain brightness-110 group-hover:opacity-90 transition-opacity"
              priority
            />
            <span className="text-[10px] font-ibm font-bold px-1.5 py-0.5 rounded bg-[#11211B] text-[#00C987] border border-[#26322C] tracking-wider uppercase">
              POS
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs font-ibm text-[#00C987] bg-[#11211B] border border-[#26322C] px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C987] animate-pulse" />
            <span>CLOUD CLUSTER · CMB-01 ONLINE</span>
          </div>
        </div>

        {/* Center Presentation: Headline & Operational Pillars */}
        <div className="relative z-10 my-10 lg:my-auto max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#11211B] border border-[#26322C] text-xs text-[#00C987] font-ibm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C987]" />
            <span>UNIVERSAL ENTERPRISE TERMINAL</span>
          </div>

          <h1 className="font-manrope font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#F4F5F1] tracking-tight leading-[1.14]">
            Unified counter operations. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4F5F1] via-[#F4F5F1] to-[#A5B1AA]">
              From scan to daily close.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#A5B1AA] leading-relaxed">
            Sign in to access your role-based workstation. Whether managing multi-branch retail, dining floors with KOT routing, or bulk distribution, XONIT keeps every terminal in sync.
          </p>

          {/* 4 Capability Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8">
            <div className="p-3.5 rounded-xl bg-[#050706]/80 border border-[#26322C] hover:border-[#00C987]/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#11211B] text-[#00C987] border border-[#26322C]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-manrope font-bold text-xs text-[#F4F5F1]">Sub-Second Checkout</h3>
                  <p className="text-[11px] text-[#A5B1AA] mt-0.5">Barcode scanning & multi-tender pay</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050706]/80 border border-[#26322C] hover:border-[#42C0C8]/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#11211B] text-[#42C0C8] border border-[#26322C]">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-manrope font-bold text-xs text-[#F4F5F1]">Multi-Branch Inventory</h3>
                  <p className="text-[11px] text-[#A5B1AA] mt-0.5">Zero-discrepancy stock transfers</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050706]/80 border border-[#26322C] hover:border-[#00C987]/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#11211B] text-[#00C987] border border-[#26322C]">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-manrope font-bold text-xs text-[#F4F5F1]">Hardware Print Bridge</h3>
                  <p className="text-[11px] text-[#A5B1AA] mt-0.5">Zero-click silent 80mm ESC/POS</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050706]/80 border border-[#26322C] hover:border-[#42C0C8]/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#11211B] text-[#42C0C8] border border-[#26322C]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-manrope font-bold text-xs text-[#F4F5F1]">LankaQR & Local Pay</h3>
                  <p className="text-[11px] text-[#A5B1AA] mt-0.5">Koko BNPL, Card & LKR settlement</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Strip */}
        <div className="relative z-10 pt-6 border-t border-[#26322C] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A5B1AA]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#F4F5F1]">
              <ShieldCheck className="w-4 h-4 text-[#00C987]" />
              <span>Banking Grade SSL & Tenant Isolation</span>
            </span>
            <span>•</span>
            <span>Hardware POS Printing Ready</span>
          </div>
          <span className="font-ibm text-xs text-[#00C987]">v2.4.0-ENTERPRISE</span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Clean Sign In Form & 1-Click Multi-Tenant Accounts
          ========================================================================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-[#050706] overflow-y-auto">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-ibm uppercase tracking-widest text-[#A5B1AA]">
            Terminal Access Portal
          </span>
          <Link
            href="/"
            className="text-xs text-[#A5B1AA] hover:text-[#00C987] flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Website</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-4">
          <div className="mb-6">
            <h2 className="font-manrope font-extrabold text-2xl sm:text-3xl text-[#F4F5F1] tracking-tight">
              Sign In to Terminal
            </h2>
            <p className="text-xs sm:text-sm text-[#A5B1AA] mt-1.5 leading-relaxed">
              Enter your staff credentials or click any demo role below for 1-click test access.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 mb-5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form action="#" method="POST" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Optional Workspace / Tenant Identifier */}
            <div>
              <label className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                Workspace / Tenant Slug <span className="text-[#A5B1AA] font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. colombo-central or velvet-threads"
                  {...register("tenantSlug")}
                  className="w-full h-11 pl-10 pr-4 bg-[#0B100F] border border-[#26322C] rounded-xl text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/40 focus:outline-none focus:border-[#00C987] focus:ring-1 focus:ring-[#00C987] transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                Staff Email / Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="staff@xonit.space"
                  {...register("email")}
                  className={`w-full h-11 pl-10 pr-4 bg-[#0B100F] border ${
                    errors.email ? "border-red-500" : "border-[#26322C]"
                  } rounded-xl text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/40 focus:outline-none focus:border-[#00C987] focus:ring-1 focus:ring-[#00C987] transition-all`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#F4F5F1]">
                  Password *
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#00C987] hover:underline font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  {...register("password")}
                  className={`w-full h-11 pl-10 pr-10 bg-[#0B100F] border ${
                    errors.password ? "border-red-500" : "border-[#26322C]"
                  } rounded-xl text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/40 focus:outline-none focus:border-[#00C987] focus:ring-1 focus:ring-[#00C987] transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A5B1AA] hover:text-[#F4F5F1] transition-colors"
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
              className="w-full h-11 bg-[#F4F5F1] hover:bg-white text-[#050706] font-manrope font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#00C987]/20 disabled:opacity-50 mt-3 group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#050706]/30 border-t-[#050706] rounded-full animate-spin" />
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
              MULTI-TENANCY SEEDED CREDENTIALS: 1-Click Instant Auto-Fill
              ========================================================================= */}
          <div className="mt-8 pt-6 border-t border-[#26322C]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F4F5F1]">
                <Zap className="w-3.5 h-3.5 text-[#00C987]" />
                <span>Multi-Tenancy Demo Accounts</span>
              </div>
              <span className="text-[10px] font-ibm px-2 py-0.5 rounded bg-[#11211B] text-[#00C987] border border-[#26322C] font-bold">
                1-CLICK AUTOFILL
              </span>
            </div>

            <p className="text-[11px] text-[#A5B1AA] mb-3 leading-relaxed">
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
                        ? "bg-[#11211B] border-[#00C987] shadow-md shadow-[#00C987]/10"
                        : "bg-[#0B100F] border-[#26322C] hover:border-[#26322C]/90 hover:bg-[#11211B]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${acc.badgeBg} ${acc.badgeBorder} border`}>
                          <Icon className={`w-3.5 h-3.5 ${acc.badgeColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#F4F5F1] group-hover:text-[#00C987] transition-colors">
                              {acc.role}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#050706] text-[#A5B1AA] border border-[#26322C]">
                              {acc.businessType}
                            </span>
                          </div>
                          <span className="text-[11px] font-ibm text-[#A5B1AA] block mt-0.5">
                            {acc.email}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00C987] bg-[#00C987]/15 px-2 py-0.5 rounded-full border border-[#00C987]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Filled
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#A5B1AA] group-hover:text-[#F4F5F1] transition-colors">
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
        <div className="pt-6 border-t border-[#26322C] flex items-center justify-between text-xs text-[#A5B1AA]">
          <div className="flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-[#00C987]" />
            <span>ESC/POS Bridge: 127.0.0.1:18181</span>
          </div>
          <Link href="/register" className="text-[#00C987] hover:underline font-medium">
            Start 14-Day Free Trial →
          </Link>
        </div>
      </div>
    </main>
  );
}
