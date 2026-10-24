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
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Building2,
  Store,
  CheckCircle2,
  Sparkles,
  Utensils,
  Scissors,
  ShoppingBag,
  Pill,
  Apple,
  Truck,
  Warehouse,
  Printer,
} from "lucide-react";
import { registerSchema, RegisterFormData } from "@/lib/validations";
import { useAuthStore } from "@/store/auth.store";
import { generateDeviceFingerprint } from "@/lib/fingerprint";

const BUSINESS_ARCHETYPES = [
  { id: "RETAIL", label: "Retail & Apparel", icon: ShoppingBag, color: "text-[#42C0C8]" },
  { id: "RESTAURANT_CAFE", label: "Restaurant & Cafe", icon: Utensils, color: "text-amber-400" },
  { id: "SALON_SPA", label: "Salon & Spa", icon: Scissors, color: "text-rose-400" },
  { id: "PHARMACY_CLINIC", label: "Pharmacy & Clinic", icon: Pill, color: "text-emerald-400" },
  { id: "GROCERY_SUPERMARKET", label: "Grocery & Mart", icon: Apple, color: "text-green-400" },
  { id: "WHOLESALE_DISTRIBUTION", label: "Wholesale Depot", icon: Truck, color: "text-sky-400" },
];

export default function RegisterPage() {
  const router = useRouter();
  const registerAction = useAuthStore((state) => state.register);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedArchetype, setSelectedArchetype] = useState<string>("RETAIL");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      businessName: "",
      businessType: "RETAIL",
    },
  });

  const handleSelectArchetype = (archetypeId: string) => {
    setSelectedArchetype(archetypeId);
    setValue("businessType", archetypeId);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setLoading(true);

    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      const result = await registerAction({
        ...data,
        businessType: selectedArchetype,
        deviceFingerprint,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 1200);
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.response?.data?.error;
      const msg =
        serverMsg ||
        (err.isAxiosError
          ? "Network connection error. Please verify backend service."
          : err.message) ||
        "Registration failed. Please check your information.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#050706] text-[#F4F5F1] flex flex-col lg:flex-row overflow-x-hidden selection:bg-[#00C987]/30 selection:text-[#00C987]">
      {/* =========================================================================
          LEFT COLUMN: Visual Presentation & Brand Architecture (Matching Login)
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
            <span>14-DAY FULL TRIAL · NO CARD REQUIRED</span>
          </div>
        </div>

        {/* Center Presentation: Headline & Capability Highlights */}
        <div className="relative z-10 my-10 lg:my-auto max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#11211B] border border-[#26322C] text-xs text-[#00C987] font-ibm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#00C987]" />
            <span>ENTERPRISE STORE ONBOARDING</span>
          </div>

          <h1 className="font-manrope font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#F4F5F1] tracking-tight leading-[1.14]">
            Deploy your cloud counter. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4F5F1] via-[#F4F5F1] to-[#A5B1AA]">
              From first scan to multi-store.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#A5B1AA] leading-relaxed">
            Create your isolated tenant workspace in under 60 seconds. Experience sub-second barcode checkout, zero-click thermal printing, LankaQR settlement, and automated stock transfers.
          </p>

          {/* 4 Feature Cards */}
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
              <span>Banking Grade SSL & Cryptographic Isolation</span>
            </span>
            <span>•</span>
            <span>Local Sri Lanka Compliance</span>
          </div>
          <span className="font-ibm text-xs text-[#00C987]">v2.4.0-ENTERPRISE</span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Clean Registration Form
          ========================================================================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-[#050706] overflow-y-auto">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-ibm uppercase tracking-widest text-[#A5B1AA]">
            Merchant Registration
          </span>
          <Link
            href="/login"
            className="text-xs text-[#A5B1AA] hover:text-[#00C987] flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Already have an account? Sign In</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-4">
          <div className="mb-6">
            <h2 className="font-manrope font-extrabold text-2xl sm:text-3xl text-[#F4F5F1] tracking-tight">
              Create Your Store Account
            </h2>
            <p className="text-xs sm:text-sm text-[#A5B1AA] mt-1.5 leading-relaxed">
              Start your 14-day free trial. Setup takes less than 60 seconds with instant database isolation.
            </p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="p-4 mb-5 bg-[#00C987]/10 border border-[#00C987]/30 rounded-xl text-[#00C987] text-xs flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00C987]" />
              <span>Workspace provisioned successfully! Directing to store dashboard...</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 mb-5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Business / Store Name */}
            <div>
              <label htmlFor="businessName" className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                Business / Store Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  id="businessName"
                  type="text"
                  placeholder="e.g. Royal Silks Boutique, Colombo Cafe"
                  {...register("businessName")}
                  className="w-full h-11 pl-10 pr-4 bg-[#0B100F] border border-[#26322C] rounded-xl text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/40 focus:outline-none focus:border-[#00C987] focus:ring-1 focus:ring-[#00C987] transition-all"
                />
              </div>
            </div>

            {/* Business Archetype Selector */}
            <div>
              <label className="block text-xs font-medium text-[#F4F5F1] mb-2">
                Industry Archetype
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUSINESS_ARCHETYPES.map((arch) => {
                  const Icon = arch.icon;
                  const isSelected = selectedArchetype === arch.id;
                  return (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => handleSelectArchetype(arch.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-[#11211B] border-[#00C987] text-[#00C987] shadow-sm shadow-[#00C987]/10"
                          : "bg-[#0B100F] border-[#26322C] text-[#A5B1AA] hover:text-[#F4F5F1] hover:border-[#26322C]/90"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${arch.color}`} />
                      <span className="truncate text-[11px]">{arch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Merchant Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                Merchant / Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Asitha Konara"
                  {...register("fullName")}
                  className={`w-full h-11 pl-10 pr-4 bg-[#0B100F] border ${
                    errors.fullName ? "border-red-500" : "border-[#26322C]"
                  } rounded-xl text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/40 focus:outline-none focus:border-[#00C987] focus:ring-1 focus:ring-[#00C987] transition-all`}
                />
              </div>
              {errors.fullName && (
                <p className="text-red-400 text-xs mt-1 font-medium">{errors.fullName.message}</p>
              )}
            </div>

            {/* Work Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                Work Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="merchant@example.com"
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

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                Contact Phone <span className="text-[#A5B1AA] font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  placeholder="0771234567"
                  {...register("phone")}
                  className="w-full h-11 pl-10 pr-4 bg-[#0B100F] border border-[#26322C] rounded-xl text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/40 focus:outline-none focus:border-[#00C987] focus:ring-1 focus:ring-[#00C987] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                Password * <span className="text-[#A5B1AA] text-[11px] font-normal">(min 12 chars, uppercase, number & symbol)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
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
              id="registerSubmitBtn"
              type="submit"
              disabled={loading || success}
              className="w-full h-11 bg-[#F4F5F1] hover:bg-white text-[#050706] font-manrope font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#00C987]/20 disabled:opacity-50 mt-4 group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#050706]/30 border-t-[#050706] rounded-full animate-spin" />
                  <span>Provisioning Merchant Cloud...</span>
                </span>
              ) : success ? (
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Workspace Created!</span>
                </span>
              ) : (
                <>
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Privacy & Terms Note */}
          <p className="text-[11px] text-[#A5B1AA] text-center mt-4 leading-relaxed">
            By signing up, you agree to XONIT's Terms of Service and Privacy Policy. All multi-branch data is cryptographic envelope encrypted.
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-[#26322C] flex items-center justify-between text-xs text-[#A5B1AA]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00C987]" />
            <span>Tenant DB Isolation Protocol</span>
          </div>
          <Link href="/login" className="text-[#00C987] hover:underline font-medium">
            Sign In to Existing Terminal →
          </Link>
        </div>
      </div>
    </main>
  );
}
