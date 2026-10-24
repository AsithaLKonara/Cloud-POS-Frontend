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
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Sparkles,
  Zap,
  Warehouse,
  Building2,
  Printer,
} from "lucide-react";
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
  resetPasswordSchema,
  ResetPasswordFormData,
} from "@/lib/validations";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step state: 1 = Enter Email, 2 = Enter OTP & New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form for Step 1: Request OTP
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  // Form for Step 2: Reset Password with OTP
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    setValue: setResetValue,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      resetToken: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle Step 1: Send OTP
  const onForgotSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setLoading(true);

    try {
      const res = await authService.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setResetValue("email", data.email);

      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setResetValue("resetToken", res.data.resetToken);
      }
      if (res.data?.otp) {
        setDevOtp(res.data.otp);
        // Pre-fill OTP for immediate testing convenience
        setResetValue("otp", res.data.otp);
      }

      setStep(2);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to request password reset. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Reset Password with OTP
  const onResetSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    setLoading(true);

    try {
      await authService.resetPassword({
        email: submittedEmail || data.email,
        resetToken: resetToken || data.resetToken,
        otp: data.otp,
        newPassword: data.password,
      });

      setStep(3);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to reset password. Please check your verification code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#050706] text-[#F4F5F1] flex flex-col lg:flex-row overflow-x-hidden selection:bg-[#00C987]/30 selection:text-[#00C987]">
      {/* =========================================================================
          LEFT COLUMN: Luxury Atmospheric Architecture (Matches Login Theme)
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
            <span>SECURE IDENTITY GATEWAY</span>
          </div>
        </div>

        {/* Center Presentation: Credential Recovery Guarantee */}
        <div className="relative z-10 my-10 lg:my-auto max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#11211B] border border-[#26322C] text-xs text-[#00C987] font-ibm mb-6">
            <KeyRound className="w-3.5 h-3.5 text-[#00C987]" />
            <span>CREDENTIAL RECOVERY PROTOCOL</span>
          </div>

          <h1 className="font-manrope font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#F4F5F1] tracking-tight leading-[1.14]">
            Secure staff access. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4F5F1] via-[#F4F5F1] to-[#A5B1AA]">
              Recover credentials in seconds.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#A5B1AA] leading-relaxed">
            Forgot your terminal password? Request a time-locked verification code to reset your workstation credentials. All token requests are cryptographically validated with automated session revocation.
          </p>

          {/* 4 Security Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8">
            <div className="p-3.5 rounded-xl bg-[#050706]/80 border border-[#26322C] hover:border-[#00C987]/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#11211B] text-[#00C987] border border-[#26322C]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-manrope font-bold text-xs text-[#F4F5F1]">Time-Locked OTP</h3>
                  <p className="text-[11px] text-[#A5B1AA] mt-0.5">15-minute Redis token TTL</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050706]/80 border border-[#26322C] hover:border-[#42C0C8]/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#11211B] text-[#42C0C8] border border-[#26322C]">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-manrope font-bold text-xs text-[#F4F5F1]">Session Revocation</h3>
                  <p className="text-[11px] text-[#A5B1AA] mt-0.5">Immediate token invalidation</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050706]/80 border border-[#26322C] hover:border-[#00C987]/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#11211B] text-[#00C987] border border-[#26322C]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-manrope font-bold text-xs text-[#F4F5F1]">Instant Terminal Sync</h3>
                  <p className="text-[11px] text-[#A5B1AA] mt-0.5">New password active nationwide</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050706]/80 border border-[#26322C] hover:border-[#42C0C8]/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#11211B] text-[#42C0C8] border border-[#26322C]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-manrope font-bold text-xs text-[#F4F5F1]">Bcrypt Hash Salt</h3>
                  <p className="text-[11px] text-[#A5B1AA] mt-0.5">Zero plaintext password storage</p>
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
              <span>Multi-Factor Recovery Architecture</span>
            </span>
            <span>•</span>
            <span>AES-256 Envelope Encryption</span>
          </div>
          <span className="font-ibm text-xs text-[#00C987]">v2.4.0-ENTERPRISE</span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Clean Multi-Step Recovery Form
          ========================================================================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-[#050706] overflow-y-auto">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-ibm uppercase tracking-widest text-[#A5B1AA]">
            Credential Recovery
          </span>
          <Link
            href="/login"
            className="text-xs text-[#A5B1AA] hover:text-[#00C987] flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-4">
          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h2 className="font-manrope font-extrabold text-2xl sm:text-3xl text-[#F4F5F1] tracking-tight">
                  Reset Password
                </h2>
                <p className="text-xs sm:text-sm text-[#A5B1AA] mt-1.5 leading-relaxed">
                  Enter your registered staff email address. We will generate a secure 6-digit verification code to reset your terminal access.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 mb-5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="forgotEmail" className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                    Staff Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="forgotEmail"
                      type="email"
                      placeholder="e.g. retail.admin@xonit.space"
                      {...registerForgot("email")}
                      className={`w-full h-11 pl-10 pr-4 bg-[#0B100F] border ${
                        forgotErrors.email ? "border-red-500" : "border-[#26322C]"
                      } rounded-xl text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/40 focus:outline-none focus:border-[#00C987] focus:ring-1 focus:ring-[#00C987] transition-all`}
                    />
                  </div>
                  {forgotErrors.email && (
                    <p className="text-red-400 text-xs mt-1 font-medium">{forgotErrors.email.message}</p>
                  )}
                </div>

                <button
                  id="requestOtpBtn"
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#F4F5F1] hover:bg-white text-[#050706] font-manrope font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#00C987]/20 disabled:opacity-50 mt-4 group"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#050706]/30 border-t-[#050706] rounded-full animate-spin" />
                      <span>Generating Secure OTP...</span>
                    </span>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-ibm text-[#00C987] bg-[#11211B] border border-[#26322C] px-2.5 py-0.5 rounded-full uppercase">
                    Verification Sent
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-[#A5B1AA] hover:text-[#00C987] transition-colors"
                  >
                    Change email
                  </button>
                </div>
                <h2 className="font-manrope font-extrabold text-2xl sm:text-3xl text-[#F4F5F1] tracking-tight">
                  Enter Verification Code
                </h2>
                <p className="text-xs sm:text-sm text-[#A5B1AA] mt-1.5 leading-relaxed">
                  A 6-digit code has been generated for <span className="text-[#F4F5F1] font-medium">{submittedEmail}</span>. Enter it below with your new password.
                </p>
              </div>

              {/* Developer OTP Helper Banner for Instant Testing */}
              {devOtp && (
                <div className="p-3 mb-4 rounded-xl bg-[#11211B] border border-[#00C987]/30 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00C987]" />
                    <span className="text-[#A5B1AA]">Development OTP:</span>
                    <span className="font-mono font-bold text-[#00C987] text-sm tracking-widest">{devOtp}</span>
                  </div>
                  <span className="text-[10px] text-[#A5B1AA] uppercase">Pre-filled</span>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 mb-5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
                {/* 6-Digit Verification Code */}
                <div>
                  <label htmlFor="otpInput" className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                    6-Digit Verification Code *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="otpInput"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      {...registerReset("otp")}
                      className={`w-full h-11 pl-10 pr-4 bg-[#0B100F] border ${
                        resetErrors.otp ? "border-red-500" : "border-[#26322C]"
                      } rounded-xl text-base font-mono tracking-widest text-[#00C987] placeholder-[#A5B1AA]/40 focus:outline-none focus:border-[#00C987] focus:ring-1 focus:ring-[#00C987] transition-all`}
                    />
                  </div>
                  {resetErrors.otp && (
                    <p className="text-red-400 text-xs mt-1 font-medium">{resetErrors.otp.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPasswordInput" className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                    New Password * <span className="text-[#A5B1AA] text-[11px] font-normal">(min 12 chars, uppercase, number & symbol)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="newPasswordInput"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      {...registerReset("password")}
                      className={`w-full h-11 pl-10 pr-10 bg-[#0B100F] border ${
                        resetErrors.password ? "border-red-500" : "border-[#26322C]"
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
                  {resetErrors.password && (
                    <p className="text-red-400 text-xs mt-1 font-medium">{resetErrors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPasswordInput" className="block text-xs font-medium text-[#F4F5F1] mb-1.5">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A5B1AA]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPasswordInput"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      {...registerReset("confirmPassword")}
                      className={`w-full h-11 pl-10 pr-4 bg-[#0B100F] border ${
                        resetErrors.confirmPassword ? "border-red-500" : "border-[#26322C]"
                      } rounded-xl text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/40 focus:outline-none focus:border-[#00C987] focus:ring-1 focus:ring-[#00C987] transition-all`}
                    />
                  </div>
                  {resetErrors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1 font-medium">{resetErrors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  id="resetPasswordBtn"
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#F4F5F1] hover:bg-white text-[#050706] font-manrope font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#00C987]/20 disabled:opacity-50 mt-4 group"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#050706]/30 border-t-[#050706] rounded-full animate-spin" />
                      <span>Updating Credentials...</span>
                    </span>
                  ) : (
                    <>
                      <span>Confirm & Update Password</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-[#00C987]/10 border border-[#00C987]/30 flex items-center justify-center mx-auto mb-5 text-[#00C987]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-manrope font-extrabold text-2xl text-[#F4F5F1] tracking-tight mb-2">
                Password Successfully Reset
              </h2>
              <p className="text-xs sm:text-sm text-[#A5B1AA] max-w-sm mx-auto mb-6 leading-relaxed">
                Your credentials have been securely updated in the database. All existing workstation sessions have been revoked.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl bg-[#00C987] text-[#050706] font-manrope font-bold text-sm hover:bg-[#00C987]/90 transition-all shadow-md shadow-[#00C987]/20"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-[#26322C] flex items-center justify-between text-xs text-[#A5B1AA]">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#00C987]" />
            <span>Cryptographic Key Isolation</span>
          </div>
          <Link href="/login" className="text-[#00C987] hover:underline font-medium">
            Sign In with Existing Password →
          </Link>
        </div>
      </div>
    </main>
  );
}
