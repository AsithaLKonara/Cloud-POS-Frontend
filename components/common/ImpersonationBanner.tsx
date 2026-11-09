"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, ArrowRight, Sparkles, Building2, UserCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/store/toast.store";

export default function ImpersonationBanner() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationData, setImpersonationData] = useState<{
    tenantName?: string;
    tenantSlug?: string;
    userEmail?: string;
    impersonatorEmail?: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkStatus = () => {
      if (typeof window === "undefined") return;
      const stored = localStorage.getItem("xonit_impersonation_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setIsImpersonating(true);
          setImpersonationData(parsed);
          return;
        } catch {
          // ignore
        }
      }
      if (user && (user as any).isImpersonated) {
        setIsImpersonating(true);
        setImpersonationData({
          tenantName: user.tenant?.name || "Target Tenant",
          tenantSlug: user.tenant?.slug || "",
          userEmail: user.email,
          impersonatorEmail: (user as any).impersonator?.email || "Super Admin",
        });
        return;
      }
      setIsImpersonating(false);
      setImpersonationData(null);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 300);
    window.addEventListener("storage", checkStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkStatus);
    };
  }, [user]);

  const handleExitImpersonation = () => {
    try {
      const backupToken = localStorage.getItem("xonit_impersonator_token");
      const backupUserStr = localStorage.getItem("xonit_impersonator_user");

      if (backupToken && backupUserStr) {
        // Restore Super Admin cookies
        document.cookie = `laural_access_token=${backupToken}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `laural_role=SUPER_ADMIN; path=/; max-age=3600; SameSite=Lax`;

        // Restore Super Admin User state
        const backupUser = JSON.parse(backupUserStr);
        localStorage.setItem("laural_user", JSON.stringify(backupUser));
        useAuthStore.getState().setAuth(backupUser);
      }

      // Cleanup impersonation markers
      localStorage.removeItem("xonit_impersonation_session");
      localStorage.removeItem("xonit_impersonator_token");
      localStorage.removeItem("xonit_impersonator_user");
      localStorage.removeItem("laural_tenant_id");
      localStorage.removeItem("laural_tenant_slug");
      localStorage.removeItem("active_tenant_id");
      localStorage.removeItem("active_tenant_slug");

      setIsImpersonating(false);
      setImpersonationData(null);

      toast.success("Exited impersonation mode. Restored SuperAdmin workspace.");
      window.location.href = "/superadmin";
    } catch (err: any) {
      toast.error("Failed to exit impersonation: " + err.message);
    }
  };

  if (!mounted || !isImpersonating) return null;

  return (
    <div 
      data-testid="impersonation-banner"
      className="sticky top-0 z-[9999] w-full bg-gradient-to-r from-amber-950/90 via-violet-950/90 to-amber-950/90 backdrop-blur-md border-b border-amber-500/40 text-amber-200 px-4 py-2.5 shadow-2xl transition-all animate-fadeIn"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <ShieldAlert size={14} className="animate-pulse" />
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Masquerade Mode
            </span>
            <span className="text-zinc-300">
              Impersonating store:{" "}
              <strong className="text-white font-semibold">
                {impersonationData?.tenantName || "Tenant Store"}
              </strong>
              {impersonationData?.tenantSlug && (
                <span className="text-zinc-400 font-mono ml-1">
                  ({impersonationData.tenantSlug})
                </span>
              )}
            </span>
            <span className="text-zinc-500 hidden md:inline">•</span>
            <span className="text-zinc-400 hidden sm:inline">
              Session User:{" "}
              <span className="text-amber-200 font-mono">
                {impersonationData?.userEmail || user?.email}
              </span>
            </span>
            <span className="text-zinc-500 hidden lg:inline">•</span>
            <span className="text-zinc-500 text-[11px] hidden lg:inline">
              Audit log active: Initiated by {impersonationData?.impersonatorEmail || "SuperAdmin"}
            </span>
          </div>
        </div>

        <button
          onClick={handleExitImpersonation}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-all shadow-md hover:shadow-amber-500/20 shrink-0 active:scale-95"
        >
          <LogOut size={13} />
          <span>Exit Impersonation & Return to Space</span>
        </button>
      </div>
    </div>
  );
}
