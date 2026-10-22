"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  CreditCard,
  Server,
  FileText,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  Database,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

interface SuperAdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  tenantCount?: number;
}

export default function SuperAdminSidebar({
  activeTab,
  setActiveTab,
  isOpen = true,
  setIsOpen,
  tenantCount = 0,
}: SuperAdminSidebarProps) {
  const { user, logout } = useAuthStore();
  const [showPromoCard, setShowPromoCard] = useState(true);

  const getInitials = (name?: string | null) => {
    if (!name) return "SA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 w-[240px] h-screen bg-[#090A0C] border-r border-[#1C2025] flex flex-col transition-transform duration-300 shrink-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Brand Header */}
      <div className="h-[64px] px-5 flex items-center justify-between border-b border-[#1C2025] shrink-0">
        <Link href="/superadmin" className="flex items-center gap-2 group">
          <Image
            src="/logo/xonit-white-trimmed.png"
            alt="XONIT SPACE"
            width={110}
            height={26}
            className="h-6 w-auto object-contain brightness-110 group-hover:opacity-90 transition-opacity"
            priority
          />
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30 uppercase tracking-wider">
            SPACE
          </span>
        </Link>
        {setIsOpen && (
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white p-1 rounded-md"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6 scrollbar-thin">
        {/* Dashboards Section */}
        <div className="flex flex-col gap-1">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Dashboards
          </div>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "overview"
                ? "bg-[#181A1D] text-white border border-[#2B3037] shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131518]"
            }`}
          >
            <LayoutDashboard size={15} className={activeTab === "overview" ? "text-white" : "text-zinc-500"} />
            <span>Dashboard 1 (Overview)</span>
          </button>
          <button
            onClick={() => setActiveTab("tenants")}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "tenants"
                ? "bg-[#181A1D] text-white border border-[#2B3037] shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131518]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Building2 size={15} className={activeTab === "tenants" ? "text-white" : "text-zinc-500"} />
              <span>Dashboard 2 (Tenants)</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#20242A] text-zinc-300 font-mono">
              {tenantCount}
            </span>
          </button>
        </div>

        {/* Platform Apps Section */}
        <div className="flex flex-col gap-1">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Platform Apps
          </div>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "subscriptions"
                ? "bg-[#181A1D] text-white border border-[#2B3037] shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131518]"
            }`}
          >
            <CreditCard size={15} className={activeTab === "subscriptions" ? "text-white" : "text-zinc-500"} />
            <span>Subscriptions (LKR)</span>
          </button>

          <button
            onClick={() => setActiveTab("financials")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "financials"
                ? "bg-[#181A1D] text-white border border-[#2B3037] shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131518]"
            }`}
          >
            <BarChart3 size={15} className={activeTab === "financials" ? "text-white" : "text-zinc-500"} />
            <span>Platform SaaS P&L</span>
          </button>

          <button
            onClick={() => setActiveTab("telemetry")}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "telemetry"
                ? "bg-[#181A1D] text-white border border-[#2B3037] shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131518]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Server size={15} className={activeTab === "telemetry" ? "text-white" : "text-zinc-500"} />
              <span>Cluster Telemetry</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* System & Pages Section */}
        <div className="flex flex-col gap-1">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            System & Tools
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#131518] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Layers size={15} className="text-zinc-500" />
              <span>Landing Page</span>
            </div>
            <ExternalLink size={12} className="text-zinc-600" />
          </Link>

          <Link
            href="/admin"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#131518] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Shield size={15} className="text-zinc-500" />
              <span>Tenant View</span>
            </div>
            <ChevronRight size={13} className="text-zinc-600" />
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#131518] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Settings size={15} className="text-zinc-500" />
              <span>Tenant Settings</span>
            </div>
            <ChevronRight size={13} className="text-zinc-600" />
          </Link>
        </div>

        {/* Promo / Platform Status Card */}
        {showPromoCard && (
          <div className="mt-auto p-3.5 rounded-xl bg-[#131518] border border-[#22262B] relative group">
            <button
              onClick={() => setShowPromoCard(false)}
              className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-300 p-0.5"
              aria-label="Dismiss card"
            >
              <X size={12} />
            </button>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
              <Database size={14} />
            </div>
            <h4 className="text-xs font-semibold text-white tracking-tight">
              Cluster v2.4.0 Engine
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              PostgreSQL & Redis cluster running with multi-tenant schema isolation.
            </p>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[#1C2025] shrink-0 bg-[#090A0C]">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#131518] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name || "Super Admin"}
              </span>
              <span className="text-[10px] text-zinc-500 truncate">
                admin@xonit.space
              </span>
            </div>
          </div>
          <button
            onClick={() => logout("/login")}
            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-md transition-colors shrink-0"
            title="Sign out of Platform Control"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
