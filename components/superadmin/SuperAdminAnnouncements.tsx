"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Wrench,
  Trash2,
  Edit2,
  Clock,
  ExternalLink,
  Layers,
  X,
  RefreshCw,
  Eye,
  Radio,
  Calendar,
} from "lucide-react";
import {
  superAdminService,
  BroadcastAnnouncement,
} from "@/services/superadmin.service";
import { toast } from "@/store/toast.store";

export default function SuperAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [audienceFilter, setAudienceFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BroadcastAnnouncement | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<BroadcastAnnouncement>>({
    title: "",
    message: "",
    type: "INFO",
    targetAudience: "ALL_TENANTS",
    targetTier: "STARTER",
    targetBusinessType: "RETAIL",
    isSticky: false,
    isActive: true,
    actionUrl: "",
    actionLabel: "",
    startsAt: new Date().toISOString().slice(0, 16),
    expiresAt: "",
  });

  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getAnnouncements();
      setAnnouncements(data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      message: "",
      type: "INFO",
      targetAudience: "ALL_TENANTS",
      targetTier: "STARTER",
      targetBusinessType: "RETAIL",
      isSticky: false,
      isActive: true,
      actionUrl: "",
      actionLabel: "",
      startsAt: new Date().toISOString().slice(0, 16),
      expiresAt: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BroadcastAnnouncement) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      message: item.message,
      type: item.type,
      targetAudience: item.targetAudience,
      targetTier: item.targetTier || "STARTER",
      targetBusinessType: item.targetBusinessType || "RETAIL",
      isSticky: item.isSticky,
      isActive: item.isActive,
      actionUrl: item.actionUrl || "",
      actionLabel: item.actionLabel || "",
      startsAt: item.startsAt ? new Date(item.startsAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : "",
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await superAdminService.toggleAnnouncement(id);
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success(updated.isActive ? "Announcement activated" : "Announcement paused");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this broadcast notice?")) return;
    try {
      await superAdminService.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Broadcast announcement deleted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.message?.trim()) {
      toast.error("Title and message are required.");
      return;
    }

    try {
      setSaving(true);
      const payload: Partial<BroadcastAnnouncement> = {
        ...formData,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : new Date().toISOString(),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      if (editingItem) {
        const updated = await superAdminService.updateAnnouncement(editingItem.id, payload);
        setAnnouncements((prev) => prev.map((a) => (a.id === editingItem.id ? updated : a)));
        toast.success("Announcement updated successfully");
      } else {
        const created = await superAdminService.createAnnouncement(payload);
        setAnnouncements((prev) => [created, ...prev]);
        toast.success("Broadcast notice published");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  // KPI Calculations
  const totalCount = announcements.length;
  const activeCount = announcements.filter((a) => a.isActive).length;
  const urgentCount = announcements.filter((a) => a.isActive && (a.type === "CRITICAL_ALERT" || a.type === "MAINTENANCE")).length;
  const stickyCount = announcements.filter((a) => a.isActive && a.isSticky).length;

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || a.type === typeFilter;
    const matchesAudience = audienceFilter === "ALL" || a.targetAudience === audienceFilter;
    return matchesSearch && matchesType && matchesAudience;
  });

  const getTypeBadge = (type: BroadcastAnnouncement["type"]) => {
    switch (type) {
      case "CRITICAL_ALERT":
        return {
          icon: AlertTriangle,
          label: "Critical Alert",
          badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          bannerClass: "border-rose-500/40 bg-rose-950/40 text-rose-200",
        };
      case "MAINTENANCE":
        return {
          icon: Wrench,
          label: "Maintenance",
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          bannerClass: "border-amber-500/40 bg-amber-950/40 text-amber-200",
        };
      case "NEW_FEATURE":
        return {
          icon: Sparkles,
          label: "New Feature",
          badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          bannerClass: "border-emerald-500/40 bg-emerald-950/40 text-emerald-200",
        };
      case "INFO":
      default:
        return {
          icon: Info,
          label: "Platform Info",
          badgeBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
          bannerClass: "border-sky-500/40 bg-sky-950/40 text-sky-200",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#20242A]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Platform Announcements & Broadcast Banners
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Broadcast instant notices, maintenance downtimes, and urgent alerts across all tenant dashboards and POS cashiers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnnouncements}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-[#15171B] border border-[#2B3037] hover:border-zinc-500 transition-all"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            data-testid="create-announcement-btn"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>Create Announcement</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0E1013] border border-[#1C2025] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Total Broadcasts
            </div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              {totalCount}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Historical platform notices
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-800/50 text-zinc-400 border border-zinc-700/50">
            <Layers size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1013] border border-[#1C2025] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Active Live Banners
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              {activeCount}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Currently broadcasted
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio size={18} className="animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1013] border border-[#1C2025] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Urgent / Maintenance
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">
              {urgentCount}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Critical & outage warnings
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1013] border border-[#1C2025] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Sticky Mandatory
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
              {stickyCount}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Undismissible until expired
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0E1013] p-3 rounded-xl border border-[#1C2025]">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by title, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-zinc-500" />
            <span className="text-[11px] text-zinc-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#15171B] border border-[#252930] rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">All Types</option>
              <option value="CRITICAL_ALERT">Critical Alert</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="NEW_FEATURE">New Feature</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400">Audience:</span>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="bg-[#15171B] border border-[#252930] rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">All Audiences</option>
              <option value="ALL_TENANTS">All Tenants</option>
              <option value="TIER_SPECIFIC">Tier Specific</option>
              <option value="BUSINESS_TYPE">Business Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500 bg-[#0E1013] rounded-xl border border-[#1C2025]">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-zinc-400" />
            Loading broadcast announcements...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500 bg-[#0E1013] rounded-xl border border-[#1C2025]">
            <Megaphone size={28} className="mx-auto mb-2 text-zinc-600" />
            <p className="font-semibold text-zinc-400">No broadcast announcements found</p>
            <p className="mt-1">Create an announcement to broadcast alerts to tenants and POS operators.</p>
          </div>
        ) : (
          filteredAnnouncements.map((item) => {
            const badge = getTypeBadge(item.type);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={item.id}
                data-testid={`announcement-card-${item.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  item.isActive
                    ? "bg-[#0E1013] border-[#252930] hover:border-zinc-600"
                    : "bg-[#0A0B0D] border-[#181B1F] opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 border ${badge.badgeBg}`}>
                      <BadgeIcon size={18} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white tracking-tight truncate">
                          {item.title}
                        </span>

                        <span
                          className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border uppercase tracking-wider ${badge.badgeBg}`}
                        >
                          {badge.label}
                        </span>

                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {item.targetAudience === "ALL_TENANTS"
                            ? "All Tenants"
                            : item.targetAudience === "TIER_SPECIFIC"
                            ? `Tier: ${item.targetTier || "Any"}`
                            : `Type: ${item.targetBusinessType || "Any"}`}
                        </span>

                        {item.isSticky && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Sticky (Undismissible)
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Starts: {new Date(item.startsAt).toLocaleDateString()}
                        </span>
                        {item.expiresAt ? (
                          <span className="flex items-center gap-1 text-amber-500/80">
                            <Clock size={12} />
                            Expires: {new Date(item.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-zinc-600">No expiration</span>
                        )}
                        {item.createdBy && <span>By: {item.createdBy}</span>}
                        {item.actionUrl && (
                          <a
                            href={item.actionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-orange-400 hover:underline"
                          >
                            <span>Action: {item.actionLabel || item.actionUrl}</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Live Toggle */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      data-testid={`toggle-announcement-active-${item.id}`}
                      onClick={(e) => handleToggleActive(item.id, e)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        item.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white"
                      }`}
                      title={item.isActive ? "Deactivate Broadcast" : "Activate Broadcast"}
                    >
                      <Radio size={12} className={item.isActive ? "animate-pulse" : ""} />
                      <span>{item.isActive ? "Live" : "Paused"}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          data-testid="announcement-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#0D0F12] border border-[#252930] rounded-2xl w-full max-w-xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-md"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#1E2229]">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Megaphone size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingItem ? "Edit Broadcast Notice" : "Create Broadcast Announcement"}
                </h3>
                <p className="text-xs text-zinc-400">
                  Target announcements to specific merchant tiers or platform-wide.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Infrastructure Maintenance (02:00 UTC)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Message Body <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide detailed instructions or notice information for merchants and cashiers..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Announcement Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as BroadcastAnnouncement["type"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="INFO">Platform Info (Blue)</option>
                    <option value="MAINTENANCE">Maintenance Alert (Amber)</option>
                    <option value="CRITICAL_ALERT">Critical / Urgent Alert (Rose)</option>
                    <option value="NEW_FEATURE">New Feature Release (Emerald)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetAudience: e.target.value as BroadcastAnnouncement["targetAudience"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="ALL_TENANTS">All Platform Tenants</option>
                    <option value="TIER_SPECIFIC">Subscription Tier Specific</option>
                    <option value="BUSINESS_TYPE">Business Type Specific</option>
                  </select>
                </div>
              </div>

              {formData.targetAudience === "TIER_SPECIFIC" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Target Subscription Tier
                  </label>
                  <select
                    value={formData.targetTier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetTier: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="STARTER">Starter Tier Only</option>
                    <option value="GROWTH">Growth Tier Only</option>
                    <option value="ENTERPRISE">Enterprise Tier Only</option>
                  </select>
                </div>
              )}

              {formData.targetAudience === "BUSINESS_TYPE" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Target Business Type
                  </label>
                  <select
                    value={formData.targetBusinessType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetBusinessType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="RETAIL">Retail Outlets</option>
                    <option value="RESTAURANT">Restaurants & Cafes</option>
                    <option value="PHARMACY">Pharmacies</option>
                    <option value="SERVICES">Services</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Action URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /admin/system/integrations"
                    value={formData.actionUrl || ""}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Action Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Upgrade Now / Read Docs"
                    value={formData.actionLabel || ""}
                    onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Starts At
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt || ""}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#15171B] border border-[#252930] text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#15171B] border border-[#252930]">
                <div>
                  <div className="text-xs font-semibold text-white">Sticky Banner</div>
                  <div className="text-[11px] text-zinc-400">
                    Cannot be dismissed by merchants until it expires.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isSticky}
                  onChange={(e) => setFormData({ ...formData, isSticky: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-zinc-900 border-zinc-700"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#15171B] border border-[#252930]">
                <div>
                  <div className="text-xs font-semibold text-white">Active (Live Immediately)</div>
                  <div className="text-[11px] text-zinc-400">
                    Broadcast banner will display in all matching tenant consoles.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-zinc-900 border-zinc-700"
                />
              </div>

              {/* Live Preview */}
              <div className="pt-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1">
                  <Eye size={12} />
                  <span>Merchant Banner Preview</span>
                </div>
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                    getTypeBadge(formData.type || "INFO").bannerClass
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formData.title || "Announcement Title"}</span>
                    <span className="opacity-80 line-clamp-1">{formData.message || "Message body..."}</span>
                  </div>
                  {formData.actionUrl && (
                    <span className="text-[11px] underline font-medium shrink-0">
                      {formData.actionLabel || "Learn More"}
                    </span>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1E2229]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  data-testid="save-announcement-btn"
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? "Update Broadcast" : "Publish Announcement"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
