"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
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
} from "lucide-react";

interface NavItem {
  name: string;
  icon: any;
  href: string;
  permission?: string | string[];
}

export default function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (v: boolean) => void }) {
  const pathname = usePathname();
  const { user, hasPermission, hasRole, isSuperAdmin } = useAuthStore();

  const getInitials = (name?: string | null) => {
    if (!name) return "US";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const navGroups = [
    {
      label: "Overview",
      items: [
        { name: "Executive Dashboard", icon: LayoutDashboard, href: "/admin", permission: ["reports:view_dashboard", "reports:view_financial"] },
        { name: "Executive P&L Statement", icon: BarChart3, href: "/admin/reports/pnl", permission: ["reports:view_dashboard", "reports:view_financial"] },
        { name: "Analytics & Reports", icon: FileText, href: "/admin/reports", permission: ["reports:view_dashboard", "reports:view_financial"] },
      ]
    },
    {
      label: "Retail & POS",
      items: [
        { name: "POS Terminal", icon: MonitorSmartphone, href: "/pos", permission: "pos:sales_mode" },
        { name: "POS Sales & Orders", icon: ShoppingCart, href: "/admin/orders", permission: "orders:view" },
        { name: "Returns & Exchanges", icon: RotateCcw, href: "/admin/returns", permission: "returns:view" },
        { name: "Cash & Payments", icon: CreditCard, href: "/admin/payments", permission: "payments:view_transactions" },
      ]
    },
    {
      label: "Inventory & Outlets",
      items: [
        { name: "Branch Stock", icon: ArchiveRestore, href: "/admin/inventory", permission: "inventory:view_stock" },
        { name: "Branches & Outlets", icon: Store, href: "/admin/branches", permission: "branches:view" },
      ]
    },
    {
      label: "Catalog & Pricing",
      items: [
        { name: "Products & Items", icon: Box, href: "/admin/products", permission: "products:view" },
        { name: "Categories & Tags", icon: Tags, href: "/admin/categories", permission: ["categories:manage", "products:view"] },
      ]
    },
    {
      label: "CRM & Accounts",
      items: [
        { name: "Customers & Accounts", icon: Users, href: "/admin/customers", permission: "customers:view" },
      ]
    },
    {
      label: "System & Settings",
      items: [
        { name: "Tenant Settings", icon: Settings, href: "/admin/settings" },
        { name: "Access Control (RBAC)", icon: Shield, href: "/admin/system/roles", permission: ["system:manage_roles", "system:manage_users"] },
        { name: "Staff Management", icon: UserCog, href: "/admin/system/users", permission: "system:manage_users" },
        { name: "Audit Trail", icon: FileText, href: "/admin/system/audit", permission: "system:view_audit_logs" },
      ]
    }
  ];

  const checkPermission = (perm?: string | string[]) => {
    if (!perm || isSuperAdmin()) return true;
    if (Array.isArray(perm)) {
      return perm.some(p => hasPermission(p));
    }
    return hasPermission(perm);
  };

  const visibleGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => checkPermission(item.permission))
  })).filter(group => group.items.length > 0);

  // Compute the single best-matching active navigation item
  const allNavItems = React.useMemo(() => visibleGroups.flatMap(group => group.items), [visibleGroups]);
  const activeHref = React.useMemo(() => {
    if (!pathname) return null;
    const cleanPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

    const matchingItems = allNavItems.filter(item => {
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

  const primaryRole = user?.roles?.[0] || "Staff User";
  const userIsSuper = isSuperAdmin() || user?.email === "admin@xonit.space";

  return (
    <aside className={`fixed left-0 top-0 bottom-0 w-[240px] bg-surface border-r border-border flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      {/* Logo Area */}
      <div className="h-[64px] flex items-center justify-between px-5 border-b border-border shrink-0 bg-surface">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <Image
            src="/logo/xonit-white-trimmed.png"
            alt="XONIT POS"
            width={110}
            height={26}
            className="h-6 w-auto object-contain dark:brightness-100 dark:invert-0 brightness-0 transition-opacity group-hover:opacity-85"
            priority
          />
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            POS
          </span>
        </Link>
        {setIsOpen && (
          <button className="md:hidden text-muted hover:text-foreground p-1 rounded-lg" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation (Permanently Expanded Categories) */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-4 scrollbar-thin">
        {userIsSuper && (
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

              {/* Category Items (Always Expanded) */}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeHref === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/25 shadow-sm"
                          : "text-muted hover:text-foreground hover:bg-background/80 font-medium border border-transparent"
                      }`}
                    >
                      <Icon 
                        size={16} 
                        className={isActive ? "text-amber-600 dark:text-amber-400 shrink-0" : "text-muted shrink-0"} 
                      />
                      <span className="font-inter truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-border shrink-0 bg-surface flex items-center justify-between">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors border border-transparent hover:border-border min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-white font-poppins font-semibold text-sm shadow-sm shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-inter font-semibold text-sm text-foreground leading-tight truncate">{user?.name || "Staff Member"}</span>
            <span className="font-inter text-xs text-muted truncate">{primaryRole}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <Link
            href="/admin/settings"
            className="p-2 text-muted hover:text-foreground hover:bg-background rounded-lg transition-colors"
            title="Tenant Settings"
          >
            <Settings size={18} />
          </Link>
          <button 
            onClick={() => useAuthStore.getState().logout('/login')}
            className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
