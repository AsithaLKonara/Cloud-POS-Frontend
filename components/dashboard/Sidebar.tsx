"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useCurrentTenant } from "@/hooks/useTenantSettings";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Box,
  Store,
  MonitorSmartphone,
  CreditCard,
  Users,
  Gift,
  Megaphone,
  BarChart3,
  UserCog,
  Shield,
  Settings,
  FileText,
  Layers,
  ArchiveRestore,
  Truck,
  RotateCcw,
  MessageSquare,
  PanelsTopLeft,
  HardDrive,
  X,
  LogOut,
  Globe,
  Sparkles,
  Cpu,
  KeyRound,
  Scale,
  BookOpen,
  Clock,
  Boxes,
  Lock,
} from "lucide-react";

interface NavItem {
  name: string;
  icon: any;
  href: string;
  permission?: string | string[];
  requiredTier?: "STARTER" | "GROWTH" | "ENTERPRISE";
}

const TIER_ORDER: Record<string, number> = {
  FREE_TRIAL: 0,
  STARTER: 1,
  STANDARD: 2,
  GROWTH: 2,
  PROFESSIONAL: 2,
  ENTERPRISE: 3,
};

const isTierMet = (currentTier: string | undefined, requiredTier: string | undefined): boolean => {
  if (!requiredTier) return true;
  const currentLevel = TIER_ORDER[currentTier?.toUpperCase() || "STARTER"] ?? 1;
  const requiredLevel = TIER_ORDER[requiredTier.toUpperCase()] ?? 1;
  return currentLevel >= requiredLevel;
};

export default function Sidebar({ isOpen, setIsOpen, session }: { isOpen?: boolean; setIsOpen?: (v: boolean) => void; session?: any }) {
  const pathname = usePathname();
  const { user, hasPermission, hasRole, isSuperAdmin } = useAuthStore();
  const { data: tenant } = useCurrentTenant();
  const [mounted, setMounted] = useState(false);
  const [cachedUser, setCachedUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("laural_user");
        if (raw) setCachedUser(JSON.parse(raw));
      } catch (e) {}
    }
  }, []);

  const effectiveUser = user || session?.user || cachedUser;

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return "US";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: "Overview",
      items: [
        { name: "Branch Dashboard", icon: LayoutDashboard, href: "/branch-admin", permission: "pos:sales_mode" },
        { name: "Executive Dashboard", icon: LayoutDashboard, href: "/admin", permission: "reports:view_financial" },
        { name: "Executive P&L Statement", icon: BarChart3, href: "/admin/reports/pnl", permission: "reports:view_financial" },
        { name: "Analytics & Reports", icon: FileText, href: "/admin/reports", permission: ["reports:view_dashboard", "reports:view_financial"] },
        { name: "AI Support Copilot", icon: Sparkles, href: "/admin/ai-assistant", permission: ["reports:view_dashboard", "system:platform_settings"] },
      ],
    },
    {
      label: "Finance & ERP",
      items: [
        { name: "General Ledger", icon: Scale, href: "/admin/erp/general-ledger", permission: ["reports:view_financial", "reports:view_dashboard"], requiredTier: "GROWTH" },
        { name: "AP & AR Aging", icon: Clock, href: "/admin/erp/aging", permission: ["reports:view_financial", "reports:view_dashboard"], requiredTier: "GROWTH" },
        { name: "Stocktaking", icon: Boxes, href: "/admin/erp/stocktaking", permission: ["inventory:view_stock", "inventory:adjust_stock"], requiredTier: "GROWTH" },
      ],
    },
    {
      label: "Retail & POS",
      items: [
        { name: "POS Terminal", icon: MonitorSmartphone, href: "/pos", permission: "pos:sales_mode" },
        { name: "Branch Operations", icon: Store, href: "/branch-admin", permission: "pos:sales_mode" },
        { name: "POS Sales & Orders", icon: ShoppingCart, href: "/admin/orders", permission: "orders:view" },
        { name: "Returns & Exchanges", icon: RotateCcw, href: "/admin/returns", permission: "returns:view" },
        { name: "Cash & Payments", icon: CreditCard, href: "/admin/payments", permission: "payments:view_transactions" },
      ],
    },
    {
      label: "Inventory & Outlets",
      items: [
        { name: "Branch Stock", icon: ArchiveRestore, href: "/admin/inventory", permission: "inventory:view_stock" },
        { name: "Branches & Outlets", icon: Store, href: "/admin/branches", permission: "branches:view" },
      ],
    },
    {
      label: "Catalog & Pricing",
      items: [
        { name: "Products & Items", icon: Box, href: "/admin/products", permission: "products:view" },
        { name: "Categories & Tags", icon: Tags, href: "/admin/categories", permission: ["categories:manage", "products:view"] },
      ],
    },
    {
      label: "CRM & Accounts",
      items: [
        { name: "Customers & Accounts", icon: Users, href: "/admin/customers", permission: "customers:view" },
      ],
    },
    {
      label: "System & Settings",
      items: [
        { name: "Tenant Settings", icon: Settings, href: "/admin/settings", permission: "system:platform_settings" },
        { name: "External Integrations", icon: Cpu, href: "/admin/settings/integrations", permission: "system:platform_settings", requiredTier: "GROWTH" },
        { name: "Headless Developer API", icon: KeyRound, href: "/admin/settings/developer-api", permission: "system:platform_settings", requiredTier: "ENTERPRISE" },
        { name: "Access Control (RBAC)", icon: Shield, href: "/admin/system/roles", permission: ["system:manage_roles", "system:manage_users"] },
        { name: "Staff Management", icon: UserCog, href: "/admin/system/users", permission: "system:manage_users" },
        { name: "Audit Trail", icon: FileText, href: "/admin/system/audit", permission: "system:view_audit_logs" },
      ],
    },
  ];

  const isBranchUser = effectiveUser?.roles?.some((r: string) => {
    const norm = r.toUpperCase().replace(/[\s_]/g, "");
    return norm === "BRANCHADMIN" || norm === "BRANCHMANAGER" || norm === "CASHIER";
  }) && !isSuperAdmin() && !effectiveUser?.roles?.some((r: string) => {
    const norm = r.toUpperCase().replace(/[\s_]/g, "");
    return norm === "SUPERADMIN" || norm === "SUPERPLATFORMADMIN" || norm === "PLATFORMADMIN" || norm === "SYSTEMOWNER" || norm === "ADMIN";
  });

  const checkPermission = (perm?: string | string[], href?: string) => {
    if (!mounted) return true;
    
    // If branch user, enforce strict branch boundary on HQ executive views
    if (isBranchUser && href) {
      const hqOnlyHrefs = [
        "/admin",
        "/admin/reports/pnl",
        "/admin/erp/general-ledger",
        "/admin/erp/aging",
        "/admin/branches",
        "/admin/settings",
        "/admin/settings/integrations",
        "/admin/settings/developer-api",
        "/admin/system/roles"
      ];
      if (hqOnlyHrefs.includes(href)) return false;
    }

    if (!perm || isSuperAdmin()) return true;

    const userPerms: string[] = effectiveUser?.permissions || [];
    if (Array.isArray(perm)) {
      return perm.some((p) => userPerms.includes(p) || hasPermission(p));
    }
    return userPerms.includes(perm) || hasPermission(perm);
  };

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => checkPermission(item.permission, item.href)),
    }))
    .filter((group) => group.items.length > 0);

  // Compute the single best-matching active navigation item
  const allNavItems = React.useMemo(() => visibleGroups.flatMap((group) => group.items), [visibleGroups]);
  const activeHref = React.useMemo(() => {
    if (!pathname) return null;
    const cleanPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

    const matchingItems = allNavItems.filter((item) => {
      const cleanHref = item.href.endsWith("/") && item.href !== "/" ? item.href.slice(0, -1) : item.href;
      if (cleanHref === "/admin") {
        return cleanPath === "/admin";
      }
      return cleanPath === cleanHref || cleanPath.startsWith(cleanHref + "/");
    });

    if (matchingItems.length === 0) return null;
    matchingItems.sort((a, b) => b.href.length - a.href.length);
    return matchingItems[0].href;
  }, [pathname, allNavItems]);

  const primaryRole = effectiveUser?.roles?.[0] || effectiveUser?.role || (isSuperAdmin() ? "Super Admin" : "Staff User");
  // Platform superadmin portal should only appear for platform operators, never inside tenant staff store operations
  const userIsPlatformSuper = (isSuperAdmin() || effectiveUser?.email === "admin@xonit.space") && !effectiveUser?.tenantId;

  // Multi-tenant organization identity values
  const tenantName = tenant?.name || effectiveUser?.tenant?.name || "XONIT Operations";
  const branchName = effectiveUser?.branch?.name || (effectiveUser?.branchId ? `Branch #${effectiveUser.branchId.slice(0, 6)}` : "All Outlets");
  const currentTier = (tenant?.subscriptionTier || (effectiveUser?.tenant as any)?.subscriptionTier || "STARTER").toUpperCase();

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 w-[240px] bg-surface border-r border-border flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Multi-Tenant Organization & Outlet Branding Header */}
      <div className="h-[70px] flex items-center justify-between px-4 border-b border-border shrink-0 bg-surface">
        <Link href="/admin" className="flex items-center gap-2.5 min-w-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 via-primary/10 to-amber-600/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500 font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            {tenantName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-inter font-bold text-xs text-foreground truncate group-hover:text-amber-500 transition-colors">
                {tenantName}
              </span>
              <span className="text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider shrink-0">
                {currentTier}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted truncate mt-0.5">
              <Store size={10} className="shrink-0 text-muted" />
              <span className="truncate">{branchName}</span>
            </div>
          </div>
        </Link>
        {setIsOpen && (
          <button
            className="md:hidden text-muted hover:text-foreground p-1 rounded-lg"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation (Permanently Expanded Categories with SaaS Tier Badges) */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-4 scrollbar-thin">
        {mounted && userIsPlatformSuper && (
          <div className="mb-1">
            <Link
              href="/superadmin"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/15 via-fuchsia-600/10 to-indigo-600/15 border border-violet-500/30 text-violet-400 hover:text-violet-300 hover:border-violet-400/50 transition-all shadow-sm group"
            >
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Globe size={14} className="text-violet-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold tracking-wide uppercase leading-tight flex items-center gap-1">
                  XONIT Platform
                  <Sparkles size={10} className="text-amber-400" />
                </span>
                <span className="text-[9px] text-zinc-400 truncate">Super Admin Center</span>
              </div>
            </Link>
          </div>
        )}

        {visibleGroups.map((group, idx) => {
          return (
            <div key={idx} className="flex flex-col gap-1">
              {/* Category Header Label */}
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted/70 select-none">
                {group.label}
              </div>

              {/* Category Items */}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeHref === item.href;
                  const tierUnlocked = isTierMet(currentTier, item.requiredTier);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/25 shadow-sm"
                          : "text-muted hover:text-foreground hover:bg-background/80 font-medium border border-transparent"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={isActive ? "text-amber-600 dark:text-amber-400 shrink-0" : "text-muted shrink-0"}
                      />
                      <span className="font-inter truncate flex-1">{item.name}</span>

                      {/* SaaS Plan Tier Badge */}
                      {item.requiredTier && item.requiredTier !== "STARTER" && (
                        <span
                          className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0 ${
                            tierUnlocked
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-muted/15 text-muted/80 border border-border flex items-center gap-0.5"
                          }`}
                          title={`Requires ${item.requiredTier} Plan`}
                        >
                          {!tierUnlocked && <Lock size={8} className="shrink-0" />}
                          {item.requiredTier === "ENTERPRISE" ? "ENT" : "PRO"}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-border shrink-0 bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-background transition-colors border border-transparent hover:border-border min-w-0 flex-1">
          <div
            className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-white font-poppins font-semibold text-xs shadow-sm shrink-0"
            suppressHydrationWarning
          >
            {mounted ? getInitials(effectiveUser?.name) : "US"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-inter font-semibold text-xs text-foreground leading-tight truncate" suppressHydrationWarning>
              {mounted ? (effectiveUser?.name || (effectiveUser?.email ? effectiveUser.email.split("@")[0] : "Staff Member")) : "Staff Member"}
            </span>
            <span className="font-inter text-[10px] text-muted truncate" suppressHydrationWarning>
              {mounted ? primaryRole : "Staff Member"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          {hasPermission("system:platform_settings") && (
            <Link
              href="/admin/settings"
              className="p-1.5 text-muted hover:text-foreground hover:bg-background rounded-lg transition-colors"
              title="Tenant Settings"
            >
              <Settings size={16} />
            </Link>
          )}
          <button
            onClick={() => useAuthStore.getState().logout("/login")}
            className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
