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
  ChevronDown,
  ChevronRight
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

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
      label: "Item Catalog",
      items: [
        { name: "Oil & Non-Oil Items", icon: Box, href: "/admin/products", permission: "products:view" },
        { name: "Categories & Grades", icon: Tags, href: "/admin/categories", permission: ["categories:manage", "products:view"] },
      ]
    },
    {
      label: "CRM & Accounts",
      items: [
        { name: "Customers & Garages", icon: Users, href: "/admin/customers", permission: "customers:view" },
      ]
    },
    {
      label: "System & Security",
      items: [
        { name: "Access Control (RBAC)", icon: Shield, href: "/admin/system/roles", permission: ["system:manage_roles", "system:manage_users"] },
        { name: "Staff Management", icon: UserCog, href: "/admin/system/users", permission: "system:manage_users" },
        { name: "System Settings", icon: Settings, href: "/admin/system/settings", permission: "system:platform_settings" },
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

  const primaryRole = user?.roles?.[0] || "Staff User";

  // Initialize expanded groups based on active route
  useEffect(() => {
    const activeGroup = visibleGroups.find(group => 
      group.items.some(item => item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href))
    );
    if (activeGroup && !expandedGroups.includes(activeGroup.label)) {
      setExpandedGroups(prev => [...prev, activeGroup.label]);
    }
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    );
  };

  return (
    <aside className={`fixed left-0 top-0 bottom-0 w-[240px] bg-surface border-r border-border flex flex-col z-50 text-text-secondary transition-transform duration-300 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      {/* Logo Area */}
      <div className="h-[67px] flex items-center justify-between px-6 border-b border-border shrink-0 bg-surface">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Box size={18} />
          </div>
          <span className="font-inter font-bold tracking-wider text-foreground text-sm uppercase">OIL POS & ERP</span>
        </Link>
        {setIsOpen && (
          <button className="md:hidden text-muted hover:text-foreground" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2 scrollbar-hide">
        {visibleGroups.map((group, idx) => {
          const isExpanded = expandedGroups.includes(group.label);
          return (
            <div key={idx} className="flex flex-col gap-1 mb-2">
              <button 
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between px-3 py-2 w-full rounded-lg hover:bg-stone-50 transition-colors group"
              >
                <span className="font-poppins font-semibold text-[11px] uppercase tracking-wider text-stone-500 group-hover:text-foreground transition-colors">
                  {group.label}
                </span>
                {isExpanded ? (
                  <ChevronDown size={14} className="text-stone-400" />
                ) : (
                  <ChevronRight size={14} className="text-stone-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="flex flex-col gap-0.5 mt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg transition-all ${isActive
                            ? "bg-stone-100 text-stone-900 font-bold"
                            : "text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-medium"
                          }`}
                      >
                        <Icon size={18} className={isActive ? "text-stone-900" : "text-stone-400"} />
                        <span className="font-inter text-sm">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
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
        <button 
          onClick={() => useAuthStore.getState().logout('/login')}
          className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1 shrink-0"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
