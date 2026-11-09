"use client";

import React, { useState, useEffect } from "react";
import {
  superAdminService,
  GlobalFeatureFlag,
} from "@/services/superadmin.service";
import { toast } from "@/store/toast.store";
import {
  Sparkles,
  Cpu,
  CreditCard,
  QrCode,
  MessageSquare,
  Scale,
  Boxes,
  Truck,
  UtensilsCrossed,
  Printer,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Power,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  "AI & Automation": Sparkles,
  "Developer & APIs": Cpu,
  "Fintech & Payments": CreditCard,
  "Communications": MessageSquare,
  "Enterprise ERP": Scale,
  "Supply Chain": Boxes,
  "Hospitality": UtensilsCrossed,
  "Hardware & POS": Printer,
};

export default function SuperAdminFeatureFlags() {
  const [flags, setFlags] = useState<GlobalFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getFeatureFlags();
      setFlags(data || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load global feature flags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flag: GlobalFeatureFlag) => {
    const nextState = !flag.isGloballyEnabled;
    const actionLabel = nextState ? "ENABLE" : "DISABLE (KILL-SWITCH)";

    if (
      !nextState &&
      !window.confirm(
        `Are you sure you want to globally ${actionLabel} ${flag.name}? This will immediately turn off this feature for ALL tenants across the entire platform.`
      )
    ) {
      return;
    }

    try {
      setTogglingKey(flag.key);
      const updated = await superAdminService.updateGlobalFeatureFlag(
        flag.key,
        nextState
      );
      setFlags((prev) =>
        prev.map((f) => (f.key === flag.key ? { ...f, isGloballyEnabled: updated.isGloballyEnabled } : f))
      );
      if (nextState) {
        toast.success(`Platform master switch for ${flag.name} ENABLED.`);
      } else {
        toast.warning(`Platform master switch for ${flag.name} DISABLED.`);
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to update ${flag.name}`);
    } finally {
      setTogglingKey(null);
    }
  };

  const categories = ["ALL", ...Array.from(new Set(flags.map((f) => f.category)))];

  const filteredFlags = flags.filter((f) => {
    const matchesCategory = selectedCategory === "ALL" || f.category === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCount = flags.filter((f) => f.isGloballyEnabled).length;
  const disabledCount = flags.filter((f) => !f.isGloballyEnabled).length;

  return (
    <div className="space-y-6">
      {/* Platform Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-400">Total Platform Modules</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">{flags.length}</div>
          <span className="text-[11px] text-zinc-500 mt-2">Modular engine components</span>
        </div>

        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-400">Active Services</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{activeCount}</div>
          <span className="text-[11px] text-emerald-500/80 mt-2 flex items-center gap-1">
            <CheckCircle2 size={11} /> 100% operational
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-400">Master Kill-Switched</span>
          <div className={`text-2xl font-bold font-mono mt-1 ${disabledCount > 0 ? "text-rose-400" : "text-zinc-500"}`}>
            {disabledCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-2">
            {disabledCount > 0 ? "Under emergency platform isolation" : "No active outages"}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-400">Granular Overrides</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">Multi-Tenant</div>
          <span className="text-[11px] text-zinc-400 mt-2">Per-tenant override support</span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121417] p-3 rounded-xl border border-[#1E2227]">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search feature flags by name, key, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181B1F] border border-[#262B33] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-[#181B1F] p-1 rounded-lg border border-[#262B33]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? "bg-amber-500 text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={fetchFlags}
            disabled={loading}
            className="p-2 rounded-lg bg-[#181B1F] hover:bg-[#20242A] border border-[#262B33] text-zinc-300 hover:text-white transition-colors"
            title="Refresh flags"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Feature Flag Grid */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw size={20} className="animate-spin text-amber-500" />
          <span>Loading platform feature flags...</span>
        </div>
      ) : filteredFlags.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#121417] border border-[#1E2227] text-zinc-500 text-xs">
          No feature flags matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFlags.map((flag) => {
            const Icon = CATEGORY_ICONS[flag.category] || Cpu;
            const isToggling = togglingKey === flag.key;
            const isKillSwitched = !flag.isGloballyEnabled;

            return (
              <div
                key={flag.key}
                data-testid={`feature-card-${flag.key}`}
                className={`p-5 rounded-2xl border transition-all ${
                  isKillSwitched
                    ? "bg-rose-950/15 border-rose-500/30 hover:border-rose-500/50"
                    : "bg-[#121417] border-[#1E2227] hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isKillSwitched
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white truncate">{flag.name}</h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1C2025] text-zinc-400 border border-[#2B3037]">
                          {flag.key}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {flag.description}
                      </p>
                    </div>
                  </div>

                  {/* Master Kill-Switch Toggle */}
                  <div className="flex flex-col items-end shrink-0">
                    <button
                      onClick={() => handleToggle(flag)}
                      disabled={isToggling}
                      data-testid={`toggle-${flag.key}`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        flag.isGloballyEnabled ? "bg-emerald-500" : "bg-rose-600"
                      }`}
                      title={flag.isGloballyEnabled ? "Click to kill-switch globally" : "Click to re-enable globally"}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          flag.isGloballyEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 font-mono ${
                        flag.isGloballyEnabled ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {flag.isGloballyEnabled ? "OPERATIONAL" : "KILL-SWITCHED"}
                    </span>
                  </div>
                </div>

                {/* Footer Info & Badges */}
                <div className="mt-4 pt-3 border-t border-[#1E2227] flex items-center justify-between text-[11px] text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#181B1F] text-zinc-300 border border-[#262B33]">
                      {flag.category}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span>
                      Min Tier:{" "}
                      <strong className="text-amber-300 font-semibold">{flag.minTier}</strong>
                    </span>
                  </div>

                  {isKillSwitched && (
                    <div className="flex items-center gap-1 text-rose-400 text-[10px] font-semibold">
                      <ShieldAlert size={12} />
                      <span>Disabled Platform-wide</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

