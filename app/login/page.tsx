"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Droplets,
  ShieldCheck,
  Zap,
  Building2,
  Store,
  CheckCircle2,
  Sparkles,
  KeyRound,
  MapPin,
} from "lucide-react";
import { loginSchema, LoginFormData } from "@/lib/validations";
import { useAuthStore } from "@/store/auth.store";
import { generateDeviceFingerprint } from "@/lib/fingerprint";

interface DevAccount {
  role: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  email: string;
  branch: string;
  scope: string;
  icon: typeof ShieldCheck;
}

const DEV_ACCOUNTS: DevAccount[] = [
  {
    role: "Super Admin",
    badgeColor: "text-amber-400",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/30",
    email: "superadmin@oilpos.lk",
    branch: "Multi-Branch HQ",
    scope: "System-wide / All Branches",
    icon: Sparkles,
  },
  {
    role: "Branch Manager (CMB)",
    badgeColor: "text-blue-400",
    badgeBg: "bg-blue-500/10",
    badgeBorder: "border-blue-500/30",
    email: "manager.colombo@oilpos.lk",
    branch: "Colombo Central Hub (CMB-01)",
    scope: "Branch Admin & Inventory",
    icon: Building2,
  },
  {
    role: "Branch Manager (KDY)",
    badgeColor: "text-indigo-400",
    badgeBg: "bg-indigo-500/10",
    badgeBorder: "border-indigo-500/30",
    email: "manager.kandy@oilpos.lk",
    branch: "Kandy Super AutoCare (KDY-01)",
    scope: "Branch Admin & Inventory",
    icon: Building2,
  },
  {
    role: "Cashier (CMB)",
    badgeColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/30",
    email: "cashier.colombo@oilpos.lk",
    branch: "Colombo Central Hub (CMB-01)",
    scope: "POS Terminal & Shifts",
    icon: Store,
  },
  {
    role: "Cashier (KDY)",
    badgeColor: "text-teal-400",
    badgeBg: "bg-teal-500/10",
    badgeBorder: "border-teal-500/30",
    email: "cashier.kandy@oilpos.lk",
    branch: "Kandy Super AutoCare (KDY-01)",
    scope: "POS Terminal & Shifts",
    icon: Store,
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

  const handleSelectAccount = (account: DevAccount) => {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", "Password@123", { shouldValidate: true });
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
        (err.isAxiosError ? "Network error. Please try again." : err.message) ||
        "Failed to sign in. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Column: Login Form */}
        <div className="lg:col-span-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
              <Droplets className="w-8 h-8 text-slate-950" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Cloud POS & ERP
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
              Oil Retail & Inter-Branch Management
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Staff Email / ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="staff@oilpos.lk"
                  {...register("email")}
                  className={`w-full h-11 pl-10 pr-4 bg-slate-950/60 border ${
                    errors.email ? "border-red-500" : "border-slate-800"
                  } rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full h-11 pl-10 pr-10 bg-slate-950/60 border ${
                    errors.password ? "border-red-500" : "border-slate-800"
                  } rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors`}
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
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Role-Based Access Protected</span>
            </div>
            <span>v2.0 POS</span>
          </div>
        </div>

        {/* Right Column: Dev Quick-Fill Credentials */}
        <div className="lg:col-span-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Development Quick-Insert
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
              CLICK TO INSERT
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Click any account below to autofill email and password (<code>Password@123</code>) instantly.
          </p>

          <div className="space-y-2.5">
            {DEV_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              const isSelected = selectedEmail === acc.email;

              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 group relative ${
                    isSelected
                      ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10"
                      : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${acc.badgeBg} ${acc.badgeBorder} border`}>
                        <Icon className={`w-3.5 h-3.5 ${acc.badgeColor}`} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block group-hover:text-amber-400 transition-colors">
                          {acc.role}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          {acc.email}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                        <CheckCircle2 className="w-3 h-3" />
                        Inserted
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
                        Select →
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[170px] text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{acc.branch}</span>
                    </span>
                    <span className="text-slate-500 truncate max-w-[180px]">
                      {acc.scope}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Master Dev Password:</span>
            </div>
            <code className="text-xs font-mono font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Password@123
            </code>
          </div>
        </div>
      </div>
    </main>
  );
}
