"use client";

import { MapPin, LayoutDashboard, ShoppingBag, Box, TerminalSquare, CreditCard, Users, FileText, Bell, Menu, X, ArrowLeft, LogOut, ChevronDown, Store } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export default function BranchAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSuperAdmin, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isExecutiveUser = user?.roles?.some((r: string) => {
    const norm = r.toUpperCase().replace(/[\s_]/g, "");
    return norm === "ADMIN" || norm === "SUPERADMIN" || norm === "TENANTADMIN" || norm === "SYSTEMOWNER";
  });

  const getInitials = (name?: string | null) => {
    if (!name) return "BA";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const branchTitle = mounted 
    ? (user?.branch?.name || (user?.branchId ? `Branch #${user.branchId.slice(0, 8)}` : "Branch Store"))
    : "Branch Store";

  const userRoleTitle = mounted
    ? (user?.roles?.[0] || "Branch Admin")
    : "Branch Admin";

  const navItems = [
    { name: "Dashboard", href: "/branch-admin", icon: LayoutDashboard },
    { name: "POS", href: "/pos", icon: TerminalSquare },
  ];

  const managementItems = [
    { name: "Orders", href: "/branch-admin/orders", icon: ShoppingBag },
    { name: "Inventory", href: "/branch-admin/inventory", icon: Box },
    { name: "Payments", href: "/branch-admin/payments", icon: CreditCard },
    { name: "Cashiers", href: "/branch-admin/cashiers", icon: Users },
    { name: "Reports", href: "/branch-admin/reports", icon: FileText },
  ];

  return (
    <div className="dashboard-theme flex h-screen w-full bg-background overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-[240px] z-50 bg-surface flex flex-col shrink-0 text-text-secondary overflow-y-auto border-r border-border transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative`}>
        <div className="px-5 h-[64px] flex items-center justify-between border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Store size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-inter font-bold text-sm tracking-tight text-foreground truncate">
                {branchTitle}
              </span>
              <span className="text-[10px] text-amber-500 font-mono font-medium">Branch Admin</span>
            </div>
          </div>
          <button className="md:hidden text-muted hover:text-foreground p-1" onClick={() => setIsSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Back to Executive Dashboard (for Tenant Admins) */}
        {mounted && isExecutiveUser && (
          <div className="p-3 border-b border-border/60 bg-amber-500/5">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-inter font-semibold text-xs transition-colors border border-amber-500/30"
            >
              <ArrowLeft size={14} />
              <span>Back to HQ Dashboard</span>
            </Link>
          </div>
        )}

        <div className="flex flex-col py-4 px-3 gap-1">
          <span className="px-3 text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Today</span>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/branch-admin" ? pathname === "/branch-admin" : pathname?.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium text-xs ${
                isActive ? "bg-primary text-white font-bold shadow-sm" : "text-muted hover:text-foreground hover:bg-background"
              }`}>
                <Icon size={16} /> {item.name}
              </Link>
            );
          })}

          <span className="px-3 text-[10px] font-bold text-muted uppercase tracking-wider mt-5 mb-2">Management</span>
          
          {managementItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium text-xs ${
                isActive ? "bg-primary text-white font-bold shadow-sm" : "text-muted hover:text-foreground hover:bg-background"
              }`}>
                <Icon size={16} /> {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        
        {/* Header */}
        <div className="h-[64px] bg-surface border-b border-border px-4 md:px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-muted hover:text-foreground hover:bg-background rounded-xl transition-colors" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex font-inter font-medium text-xs text-muted items-center gap-2 px-2.5 py-1 rounded-lg bg-background border border-border">
              <MapPin size={14} className="text-amber-500" />
              <span>{branchTitle} Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Dropdown */}
            <div className="relative group">
              <button 
                type="button"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-background transition-colors border border-border bg-surface shadow-sm"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-inter font-bold text-[10px]">
                  {mounted ? getInitials(user?.name) : "BA"}
                </div>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="font-inter font-semibold text-xs text-foreground leading-none">{mounted ? (user?.name || "Branch Manager") : "Branch Manager"}</span>
                  <span className="font-inter text-[10px] text-muted leading-none mt-1">{userRoleTitle}</span>
                </div>
                <ChevronDown size={13} className="text-muted ml-0.5" />
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-52 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1.5 z-50 flex flex-col">
                <div className="px-3.5 py-2 border-b border-border/60">
                  <span className="text-xs font-semibold text-foreground block truncate">
                    {mounted ? (user?.name || "Branch Manager") : "Branch Manager"}
                  </span>
                  <span className="text-[11px] text-muted block truncate font-mono mt-0.5">
                    {mounted ? (user?.email || "branch@xonit.space") : "branch@xonit.space"}
                  </span>
                </div>

                {mounted && isExecutiveUser && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-amber-500 hover:bg-background transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Executive HQ</span>
                  </Link>
                )}

                <Link
                  href="/pos"
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-foreground hover:bg-background transition-colors"
                >
                  <TerminalSquare size={14} className="text-amber-500" />
                  <span>POS Terminal</span>
                </Link>

                <button 
                  type="button"
                  onClick={async () => {
                    await logout('/login');
                    router.push("/login");
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors text-left w-full font-medium"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
