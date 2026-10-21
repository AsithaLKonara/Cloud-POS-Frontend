"use client";

import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  LogOut,
  ShoppingBag,
  Package,
  Info,
  AlertTriangle,
  Sun,
  Moon,
  MonitorSmartphone,
  Store,
  Sparkles,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/components/theme/ThemeProvider";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

export default function Header({ onMenuClick, session }: { onMenuClick?: () => void, session?: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getInitials = (name?: string | null) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getPageTitle = (path: string) => {
    if (path === "/admin") return "Executive Dashboard";
    if (path.includes("/pnl")) return "Executive P&L Statement";
    if (path.includes("/reports")) return "Analytics & Reports";
    if (path.includes("/orders")) return "POS Sales & Orders";
    if (path.includes("/inventory")) return "Multi-Branch Stock";
    if (path.includes("/branches")) return "Branches & Outlets";
    if (path.includes("/products")) return "Oil & Non-Oil Catalog";
    if (path.includes("/categories")) return "Categories & Grades";
    if (path.includes("/customers")) return "Customers & Garages";
    if (path.includes("/roles")) return "Access Control (RBAC)";
    if (path.includes("/users")) return "Staff Management";
    if (path.includes("/settings")) return "System Settings";
    if (path.includes("/returns")) return "Returns & Exchanges";
    if (path.includes("/payments")) return "Cash & Payments";
    return "Operations";
  };

  const branchName = user?.branch?.name || (user?.branchId ? `Branch #${user.branchId.slice(0, 8)}` : "Multi-Branch HQ");

  return (
    <header className="h-[64px] bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm z-40 transition-colors">
      
      {/* Left — Hamburger & Route Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            className="md:hidden p-2 -ml-2 text-muted hover:text-foreground hover:bg-background rounded-xl transition-colors border border-transparent hover:border-border"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Mobile Brand Logo */}
        <Link href="/admin" className="md:hidden flex items-center pr-1">
          <Image
            src="/logo/xonit-white-trimmed.png"
            alt="XONIT POS"
            width={85}
            height={20}
            className="h-5 w-auto object-contain dark:brightness-100 dark:invert-0 brightness-0"
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Store size={14} className="shrink-0" />
            <span className="truncate max-w-[160px] md:max-w-[200px]">{branchName}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted font-medium">
            <span className="text-border">/</span>
            <span className="text-foreground font-semibold">{getPageTitle(pathname || "")}</span>
          </div>
        </div>
      </div>

      {/* Right — Search + POS Shortcut + Theme Toggle + Notif + User */}
      <div className="flex items-center gap-2.5 md:gap-3 ml-auto">
        
        {/* Global Search Bar */}
        <div className="hidden md:flex items-center gap-2 w-[240px] lg:w-[280px] h-[36px] bg-background border border-border rounded-xl px-3 transition-all focus-within:border-amber-500/60 focus-within:bg-surface focus-within:shadow-sm">
          <Search size={14} className="text-muted shrink-0" />
          <input 
            type="text" 
            placeholder="Search orders, SKU, oil grade…"
            className="flex-1 bg-transparent border-none outline-none font-inter text-xs text-foreground placeholder:text-muted"
          />
          <kbd className="hidden sm:flex items-center px-1.5 py-0.5 bg-border/60 rounded text-[9px] font-semibold text-muted font-mono shrink-0">
            ⌘K
          </kbd>
        </div>

        {/* Quick Launch POS Terminal */}
        <Link
          href="/pos"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-sm transition-all"
        >
          <MonitorSmartphone size={15} />
          <span>Launch POS</span>
        </Link>

        {/* Light / Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl border border-border bg-surface hover:bg-background text-muted hover:text-foreground flex items-center justify-center transition-colors shadow-sm"
          title={theme === "dark" ? "Switch to Calm Light Theme" : "Switch to Deep Dark Theme"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun size={17} className="text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={17} className="text-slate-700 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative group">
          <button 
            type="button"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-surface hover:bg-background transition-colors text-muted hover:text-foreground shadow-sm"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface" />
            )}
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col overflow-hidden">
            <div className="p-3.5 border-b border-border flex items-center justify-between bg-background">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={() => markAllAsRead()} className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold">
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted flex flex-col items-center">
                  <Bell size={22} className="opacity-30 mb-2" />
                  <p className="text-xs">No pending notifications</p>
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 border-b border-border/60 last:border-0 hover:bg-background transition-colors flex gap-2.5 cursor-pointer ${!notif.isRead ? 'bg-amber-500/5' : ''}`}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id);
                      if (notif.link) router.push(notif.link);
                    }}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'ORDER' ? <ShoppingBag size={15} className="text-amber-500" /> : 
                       notif.type === 'INVENTORY' ? <Package size={15} className="text-warning" /> :
                       notif.type === 'ALERT' ? <AlertTriangle size={15} className="text-error" /> :
                       <Info size={15} className="text-info" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-0.5">
                        <p className="text-xs font-semibold truncate text-foreground">
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-muted shrink-0 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Staff User Chip & Dropdown */}
        <div className="relative group">
          <button 
            type="button"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-background transition-colors border border-border bg-surface shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-inter font-bold text-[10px]">
              {getInitials(user?.name || session?.user?.name)}
            </div>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="font-inter font-semibold text-xs text-foreground leading-none">{user?.name || session?.user?.name || "Staff User"}</span>
              <span className="font-inter text-[10px] text-muted leading-none mt-1">{user?.roles?.[0] || session?.user?.role || "Staff"}</span>
            </div>
            <ChevronDown size={13} className="text-muted ml-0.5" />
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-52 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1.5 z-50 flex flex-col">
            <div className="px-3.5 py-2 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground block truncate">
                {user?.name || "Staff Member"}
              </span>
              <span className="text-[11px] text-muted block truncate font-mono mt-0.5">
                {user?.email || "staff@oilpos.lk"}
              </span>
            </div>

            <Link
              href="/pos"
              className="flex items-center gap-2 px-3.5 py-2 text-xs text-foreground hover:bg-background transition-colors"
            >
              <MonitorSmartphone size={15} className="text-amber-500" />
              <span>POS Terminal</span>
            </Link>

            <button 
              type="button"
              onClick={async () => {
                const { logout } = useAuthStore.getState();
                await logout('/login');
                router.push("/login");
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors text-left w-full font-medium"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
