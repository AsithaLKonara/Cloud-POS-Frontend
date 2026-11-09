"use client";

import React, { useState, useEffect } from "react";
import {
  superAdminService,
  TenantEntitlementItem,
  TenantEntitlementsData,
} from "@/services/superadmin.service";
import { toast } from "@/store/toast.store";
import {
  X,
  SlidersHorizontal,
  Check,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Lock,
  RefreshCw,
  Building2,
  CheckCircle2,
} from "lucide-react";

interface TenantEntitlementsModalProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    subscriptionTier?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TenantEntitlementsModal({
  tenant,
  onClose,
  onSuccess,
}: TenantEntitlementsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<TenantEntitlementsData | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchEntitlements = async () => {
      try {
        setLoading(true);
        const res = await superAdminService.getTenantEntitlements(tenant.id);
        if (isMounted) {
          setData(res);
          setOverrides(res.overrides || {});
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load tenant entitlements");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEntitlements();
    return () => {
      isMounted = false;
    };
  }, [tenant.id]);

  const handleSetOverride = (featureKey: string, val: boolean | null) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (val === null) {
        delete next[featureKey];
      } else {
        next[featureKey] = val;
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await superAdminService.updateTenantEntitlements(tenant.id, overrides);
      toast.success(`Updated feature entitlements for ${tenant.name}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save tenant entitlements");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        data-testid="tenant-entitlements-modal"
        className="w-full max-w-3xl rounded-2xl bg-[#0F1115] border border-[#1E2228] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#1E2228] flex items-center justify-between bg-[#14161B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Feature Entitlements & Overrides</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase font-bold">
                  {tenant.subscriptionTier || "STARTER"} TIER
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Target Merchant: <strong className="text-white font-medium">{tenant.name}</strong> (@{tenant.slug})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informational Notice */}
        <div className="px-5 py-3 bg-amber-950/20 border-b border-amber-500/20 text-amber-200/90 text-xs flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400 shrink-0" />
          <span>
            Overrides supersede plan tier limits. Setting <strong>Force Enable</strong> unlocks advanced features (e.g. Headless API) on Starter tiers without upgrading.
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw size={20} className="animate-spin text-amber-500" />
              <span>Fetching tenant entitlements...</span>
            </div>
          ) : !data ? (
            <div className="p-12 text-center text-zinc-500 text-xs">Failed to load entitlements data.</div>
          ) : (
            data.entitlements.map((item) => {
              const currentOverride = overrides[item.key]; // true, false, or undefined
              const hasOverride = currentOverride !== undefined;
              const isGloballyDisabled = !item.isGloballyEnabled;

              // Compute preview effective status
              let previewEffective = item.tierIncluded;
              let statusLabel = item.tierIncluded ? "Active via Plan" : `Locked (${item.minTier})`;
              let statusColor = item.tierIncluded
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-zinc-800 text-zinc-400 border-zinc-700";

              if (isGloballyDisabled) {
                previewEffective = false;
                statusLabel = "Globally Disabled";
                statusColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
              } else if (currentOverride === true) {
                previewEffective = true;
                statusLabel = "Forced ON (Override)";
                statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              } else if (currentOverride === false) {
                previewEffective = false;
                statusLabel = "Forced OFF (Override)";
                statusColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
              }

              return (
                <div
                  key={item.key}
                  data-testid={`entitlement-row-${item.key}`}
                  className="p-3.5 rounded-xl bg-[#14161B] border border-[#1E2228] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                      <span className="text-[10px] font-mono text-zinc-500">[{item.key}]</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* 3-State Override Selector */}
                  <div className="flex items-center gap-1 bg-[#191D23] p-1 rounded-lg border border-[#272D37] shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      data-testid={`btn-default-${item.key}`}
                      onClick={() => handleSetOverride(item.key, null)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        !hasOverride
                          ? "bg-zinc-700 text-white font-semibold shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                      title="Inherit from subscription tier"
                    >
                      Plan Default
                    </button>

                    <button
                      type="button"
                      data-testid={`btn-enable-${item.key}`}
                      onClick={() => handleSetOverride(item.key, true)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        currentOverride === true
                          ? "bg-emerald-600 text-white font-semibold shadow-sm"
                          : "text-zinc-400 hover:text-emerald-400"
                      }`}
                      title="Force Enable for this tenant"
                    >
                      Force Enable
                    </button>

                    <button
                      type="button"
                      data-testid={`btn-disable-${item.key}`}
                      onClick={() => handleSetOverride(item.key, false)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        currentOverride === false
                          ? "bg-rose-600 text-white font-semibold shadow-sm"
                          : "text-zinc-400 hover:text-rose-400"
                      }`}
                      title="Force Revoke for this tenant"
                    >
                      Force Disable
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1E2228] bg-[#14161B] flex items-center justify-between">
          <div className="text-[11px] text-zinc-400">
            {Object.keys(overrides).length > 0 ? (
              <span className="text-amber-400 font-semibold">
                {Object.keys(overrides).length} active override(s) configured
              </span>
            ) : (
              <span>All features inheriting from {tenant.subscriptionTier || "STARTER"} tier</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg border border-[#272D37] text-zinc-300 hover:bg-zinc-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              data-testid="save-entitlements-btn"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
              <span>{saving ? "Saving Changes..." : "Save Entitlements"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

