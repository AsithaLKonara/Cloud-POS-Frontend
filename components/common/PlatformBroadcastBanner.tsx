"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Wrench,
  Sparkles,
  Info,
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  superAdminService,
  BroadcastAnnouncement,
} from "@/services/superadmin.service";
import { useAuthStore } from "@/store/auth.store";

export default function PlatformBroadcastBanner() {
  const { user } = useAuthStore();
  const [broadcasts, setBroadcasts] = useState<BroadcastAnnouncement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Load dismissed list from sessionStorage
    try {
      const stored = sessionStorage.getItem("dismissed_broadcasts");
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch (e) {
      // ignore storage errors
    }

    const fetchBroadcasts = async () => {
      try {
        const tenantId = user?.tenantId || undefined;
        const data = await superAdminService.getActiveBroadcasts(tenantId);
        if (Array.isArray(data)) {
          setBroadcasts(data);
        }
      } catch (err) {
        // Silently swallow fetch errors so layout doesn't break
      }
    };

    fetchBroadcasts();

    // Poll every 5 minutes for new emergency alerts
    const interval = setInterval(fetchBroadcasts, 300000);
    return () => clearInterval(interval);
  }, [user?.tenantId]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem("dismissed_broadcasts", JSON.stringify(updated));
    } catch (e) {}
  };

  // Filter out dismissed non-sticky banners
  const visibleBroadcasts = broadcasts.filter((b) => {
    if (b.isSticky) return true; // sticky cannot be dismissed
    return !dismissedIds.includes(b.id);
  });

  if (visibleBroadcasts.length === 0) {
    return null;
  }

  // Current active broadcast to display in banner
  const activeItem = visibleBroadcasts[currentIndex % visibleBroadcasts.length];
  if (!activeItem) return null;

  const getTypeStyle = (type: BroadcastAnnouncement["type"]) => {
    switch (type) {
      case "CRITICAL_ALERT":
        return {
          icon: AlertTriangle,
          bg: "bg-rose-950/90 border-rose-500/50 text-rose-200",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          iconColor: "text-rose-400",
          button: "bg-rose-600 hover:bg-rose-500 text-white",
        };
      case "MAINTENANCE":
        return {
          icon: Wrench,
          bg: "bg-amber-950/90 border-amber-500/50 text-amber-200",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          iconColor: "text-amber-400",
          button: "bg-amber-600 hover:bg-amber-500 text-white",
        };
      case "NEW_FEATURE":
        return {
          icon: Sparkles,
          bg: "bg-emerald-950/90 border-emerald-500/50 text-emerald-200",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          iconColor: "text-emerald-400",
          button: "bg-emerald-600 hover:bg-emerald-500 text-white",
        };
      case "INFO":
      default:
        return {
          icon: Info,
          bg: "bg-blue-950/90 border-blue-500/50 text-blue-200",
          badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
          iconColor: "text-blue-400",
          button: "bg-blue-600 hover:bg-blue-500 text-white",
        };
    }
  };

  const style = getTypeStyle(activeItem.type);
  const Icon = style.icon;

  return (
    <div
      data-testid="platform-broadcast-banner"
      className={`w-full border-b backdrop-blur-md px-4 py-2.5 transition-all relative z-40 ${style.bg}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        {/* Left Side: Icon + Title + Message */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="shrink-0 p-1 rounded-md bg-black/20">
            <Icon size={16} className={`${style.iconColor} ${activeItem.type === "CRITICAL_ALERT" ? "animate-pulse" : ""}`} />
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${style.badge}`}>
              {activeItem.type.replace("_", " ")}
            </span>

            <span className="font-bold text-white tracking-tight">
              {activeItem.title}
            </span>

            <span className="opacity-90 line-clamp-1 sm:line-clamp-none">
              — {activeItem.message}
            </span>
          </div>
        </div>

        {/* Right Side: Multi-alert pagination + Action URL + Dismiss */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {visibleBroadcasts.length > 1 && (
            <div className="flex items-center gap-1 text-[11px] font-mono opacity-80 mr-1">
              <span>
                {currentIndex + 1} / {visibleBroadcasts.length}
              </span>
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev > 0 ? prev - 1 : visibleBroadcasts.length - 1))
                }
                className="p-0.5 rounded hover:bg-white/10"
                aria-label="Previous Notice"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % visibleBroadcasts.length)}
                className="p-0.5 rounded hover:bg-white/10"
                aria-label="Next Notice"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {activeItem.actionUrl && (
            <a
              href={activeItem.actionUrl}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors shadow-sm ${style.button}`}
            >
              <span>{activeItem.actionLabel || "View Details"}</span>
              <ExternalLink size={11} />
            </a>
          )}

          {!activeItem.isSticky && (
            <button
              onClick={(e) => handleDismiss(activeItem.id, e)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              title="Dismiss announcement"
              aria-label="Dismiss banner"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
