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
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Store,
  Utensils,
  Scissors,
  Pill,
  Apple,
  Truck,
} from "lucide-react";
import { registerSchema, RegisterFormData } from "@/lib/validations";
import { authService } from "@/services/auth.service";
import { generateDeviceFingerprint } from "@/lib/fingerprint";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("retail");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setLoading(true);

    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      await authService.register({
        ...data,
        deviceFingerprint,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.response?.data?.error;
      const msg =
        serverMsg ||
        (err.isAxiosError
          ? "Network connection error. Please verify backend service."
          : err.message) ||
        "Failed to register. Please check your information.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col lg:flex-row overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* LEFT COLUMN: Value Proposition & Trial Benefits */}
      <div className="w-full lg:w-[48%] xl:w-[50%] relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-gradient-to-br from-[#060D1F] via-[#030611] to-[#010308] overflow-hidden">
        {/* Glow & Grid */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

        {/* Brand Header */}
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
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Universal POS & ERP</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>14-DAY FULL ACCESS TRIAL</span>
          </div>
        </div>

        {/* Presentation & Industry Selection */}
        <div className="relative z-10 my-8 lg:my-auto max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Start Your Free Trial with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">Zero Setup Fees</span>.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            No credit card required. Experience sub-second checkout, live multi-branch inventory, zero-click thermal printing, and LankaQR digital payments.
          </p>

          {/* Industry Archetype Selector */}
          <div className="mt-8">
            <p className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-3">
              Select Your Business Archetype:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: "retail", label: "Retail & Apparel", icon: Store },
                { id: "restaurant", label: "Restaurant & Cafe", icon: Utensils },
                { id: "salon", label: "Salon & Spa", icon: Scissors },
                { id: "pharmacy", label: "Pharmacy & Clinic", icon: Pill },
                { id: "grocery", label: "Grocery & Mart", icon: Apple },
                { id: "wholesale", label: "Wholesale Depot", icon: Truck },
              ].map((ind) => {
                const Icon = ind.icon;
                const isSelected = selectedIndustry === ind.id;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => setSelectedIndustry(ind.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-500/60 text-cyan-200 shadow-sm"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span className="truncate">{ind.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trial Value Checkpoints */}
          <div className="mt-8 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Full ERP & Multi-Branch Inventory Enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>ESC/POS Hardware Bridge & Dynamic LankaQR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Cancel Anytime or Upgrade Seamlessly to Scalable LKR Plans</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>XONIT SPACE TECHNOLOGIES (PVT) LTD</span>
          <span className="text-emerald-400">SL-DATA-CENTER OK</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Registration Form */}
      <div className="w-full lg:w-[52%] xl:w-[50%] flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#030712] relative">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-400 mt-1.5">
              Launch your store terminal in seconds.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Account created successfully! Redirecting to setup dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name / Business Owner <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Kasun Perera"
                  {...register("fullName")}
                  className={`w-full bg-slate-900/80 border text-slate-100 placeholder:text-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
                    errors.fullName ? "border-rose-500/50" : "border-slate-800 hover:border-slate-700"
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="kasun@mystore.lk"
                  {...register("email")}
                  className={`w-full bg-slate-900/80 border text-slate-100 placeholder:text-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
                    errors.email ? "border-rose-500/50" : "border-slate-800 hover:border-slate-700"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Mobile Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="0771234567"
                  {...register("phone")}
                  className={`w-full bg-slate-900/80 border text-slate-100 placeholder:text-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
                    errors.phone ? "border-rose-500/50" : "border-slate-800 hover:border-slate-700"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 12 chars (Upper, lower, number, symbol)"
                  {...register("password")}
                  className={`w-full bg-slate-900/80 border text-slate-100 placeholder:text-slate-600 rounded-xl pl-10 pr-11 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
                    errors.password ? "border-rose-500/50" : "border-slate-800 hover:border-slate-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Start Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center text-xs text-slate-400">
            Already have an active tenant or cashier login?{" "}
            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4 ml-1 transition-colors"
            >
              Sign In to Terminal
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
