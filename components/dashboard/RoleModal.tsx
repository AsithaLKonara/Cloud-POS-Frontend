"use client";

import { useState, useEffect } from "react";
import { X, Shield, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import roleService, { RoleItem } from "@/services/role.service";

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: RoleItem | null;
}

// ─── Module groups mapping to backend permission codes ─────────────────────────────────
const MODULE_GROUPS = [
  {
    group: "Orders & Fulfillment",
    color: "bg-blue-50 text-blue-800",
    modules: [
      { label: "Orders — View", code: "orders:view", action: "View" },
      { label: "Orders — Create", code: "orders:create", action: "Create" },
      { label: "Orders — Edit Status", code: "orders:edit_status", action: "Edit" },
      { label: "Orders — Cancel / Refund", code: "orders:cancel_refund", action: "Delete" },
      { label: "Returns & RMA — View", code: "returns:view", action: "View" },
      { label: "Returns & RMA — Approve / Reject", code: "returns:approve_reject", action: "Edit" },
      { label: "Returns & RMA — Issue Refund", code: "returns:issue_refund", action: "Edit" },
      { label: "Shipping — View Queue", code: "shipping:view_queue", action: "View" },
      { label: "Shipping — Dispatch (Fardar)", code: "shipping:dispatch_fardar", action: "Create" },
      { label: "Shipping — Print Labels", code: "shipping:print_labels", action: "View" },
    ],
  },
  {
    group: "Point of Sale (POS)",
    color: "bg-violet-50 text-violet-800",
    modules: [
      { label: "POS — Open / Close Shift", code: "pos:shift_open_close", action: "Edit" },
      { label: "POS — Sales Mode", code: "pos:sales_mode", action: "Create" },
      { label: "POS — Returns Mode", code: "pos:returns_mode", action: "Create" },
      { label: "POS — Exchange Mode", code: "pos:exchange_mode", action: "Create" },
      { label: "POS — Dispatch Mode", code: "pos:dispatch_mode", action: "Create" },
      { label: "POS — Hold & Resume Sale", code: "pos:hold_resume", action: "Edit" },
      { label: "POS — Apply Discounts", code: "pos:apply_discounts", action: "Edit" },
      { label: "POS — View Sales History", code: "pos:view_sales_history", action: "View" },
    ],
  },
  {
    group: "Catalog & Products",
    color: "bg-amber-50 text-amber-800",
    modules: [
      { label: "Products — View", code: "products:view", action: "View" },
      { label: "Products — Create", code: "products:create", action: "Create" },
      { label: "Products — Edit", code: "products:edit", action: "Edit" },
      { label: "Products — Delete", code: "products:delete", action: "Delete" },
      { label: "Categories — Manage", code: "categories:manage", action: "Edit" },
      { label: "Collections — Manage", code: "collections:manage", action: "Edit" },
    ],
  },
  {
    group: "Inventory",
    color: "bg-green-50 text-green-800",
    modules: [
      { label: "Inventory — View Stock Levels", code: "inventory:view_stock", action: "View" },
      { label: "Inventory — Receive Stock (PO)", code: "inventory:receive_po", action: "Create" },
      { label: "Inventory — Stock Transfers", code: "inventory:stock_transfers", action: "Edit" },
      { label: "Inventory — Report Damage / Loss", code: "inventory:report_damage", action: "Create" },
      { label: "Inventory — Adjust Stock", code: "inventory:adjust_stock", action: "Edit" },
    ],
  },
  {
    group: "Payments",
    color: "bg-emerald-50 text-emerald-800",
    modules: [
      { label: "Payments — View Transactions", code: "payments:view_transactions", action: "View" },
      { label: "Payments — Process Refund", code: "payments:process_refund", action: "Edit" },
      { label: "Payments — Retry Failed Payment", code: "payments:retry_failed", action: "Edit" },
      { label: "Payments — View Gateway Reports", code: "payments:view_gateway_reports", action: "View" },
    ],
  },
  {
    group: "Customers & Loyalty",
    color: "bg-pink-50 text-pink-800",
    modules: [
      { label: "Customers — View", code: "customers:view", action: "View" },
      { label: "Customers — Edit", code: "customers:edit", action: "Edit" },
      { label: "Customers — Suspend", code: "customers:suspend", action: "Delete" },
      { label: "Loyalty — View Points", code: "loyalty:view_points", action: "View" },
      { label: "Loyalty — Adjust Points", code: "loyalty:adjust_points", action: "Edit" },
      { label: "Loyalty — Manage Tiers", code: "loyalty:manage_tiers", action: "Edit" },
    ],
  },
  {
    group: "Promotions & Marketing",
    color: "bg-orange-50 text-orange-800",
    modules: [
      { label: "Promotions — View", code: "promotions:view", action: "View" },
      { label: "Promotions — Create Coupon", code: "promotions:create_coupon", action: "Create" },
      { label: "Promotions — Create Campaign", code: "promotions:create_campaign", action: "Create" },
      { label: "Promotions — Deactivate", code: "promotions:deactivate", action: "Delete" },
    ],
  },
  {
    group: "Reviews",
    color: "bg-sky-50 text-sky-800",
    modules: [
      { label: "Reviews — View", code: "reviews:view", action: "View" },
      { label: "Reviews — Approve", code: "reviews:approve", action: "Edit" },
      { label: "Reviews — Reject", code: "reviews:reject", action: "Delete" },
      { label: "Reviews — Reply", code: "reviews:reply", action: "Create" },
    ],
  },
  {
    group: "Reports & Analytics",
    color: "bg-indigo-50 text-indigo-800",
    modules: [
      { label: "Reports — View Dashboard", code: "reports:view_dashboard", action: "View" },
      { label: "Reports — Export Data", code: "reports:export_data", action: "View" },
      { label: "Reports — View Financial", code: "reports:view_financial", action: "View" },
    ],
  },
  {
    group: "Content Management (CMS)",
    color: "bg-teal-50 text-teal-800",
    modules: [
      { label: "CMS — View", code: "cms:view", action: "View" },
      { label: "CMS — Edit Hero Slides", code: "cms:edit_hero", action: "Edit" },
      { label: "CMS — Edit Promo Banners", code: "cms:edit_promo", action: "Edit" },
      { label: "CMS — Edit Homepage Layout", code: "cms:edit_homepage", action: "Edit" },
      { label: "CMS — Edit Static Pages", code: "cms:edit_static", action: "Edit" },
    ],
  },
  {
    group: "Media Library",
    color: "bg-cyan-50 text-cyan-800",
    modules: [
      { label: "Media — View Library", code: "media:view_library", action: "View" },
      { label: "Media — Upload Files", code: "media:upload", action: "Create" },
      { label: "Media — Delete Files", code: "media:delete", action: "Delete" },
      { label: "Media — Assign to Sections", code: "media:assign", action: "Edit" },
    ],
  },
  {
    group: "Branches",
    color: "bg-stone-100 text-stone-800",
    modules: [
      { label: "Branches — View", code: "branches:view", action: "View" },
      { label: "Branches — Create", code: "branches:create", action: "Create" },
      { label: "Branches — Edit", code: "branches:edit", action: "Edit" },
      { label: "Branches — Delete", code: "branches:delete", action: "Delete" },
    ],
  },
  {
    group: "System Administration",
    color: "bg-red-50 text-red-800",
    modules: [
      { label: "System — View Audit Logs", code: "system:view_audit_logs", action: "View" },
      { label: "System — Manage Users", code: "system:manage_users", action: "Edit" },
      { label: "System — Manage Roles", code: "system:manage_roles", action: "Edit" },
      { label: "System — Platform Settings", code: "system:platform_settings", action: "Edit" },
    ],
  },
];

export default function RoleModal({ isOpen, onClose, onSuccess, initialData }: RoleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form on open / change
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setStatus(initialData.status || "Active");
      setSelectedCodes(new Set(initialData.permissions || []));
    } else {
      setName("");
      setDescription("");
      setStatus("Active");
      setSelectedCodes(new Set());
    }
    setError(null);
    // Expand first few groups by default
    setExpandedGroups({
      "Orders & Fulfillment": true,
      "Point of Sale (POS)": true,
      "Catalog & Products": true,
    });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  function toggleExpand(groupName: string) {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  }

  function toggleCode(code: string) {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  function toggleGroupAll(group: typeof MODULE_GROUPS[0], grant: boolean) {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      group.modules.forEach(m => {
        if (grant) {
          next.add(m.code);
        } else {
          next.delete(m.code);
        }
      });
      return next;
    });
  }

  function isGroupFullyChecked(group: typeof MODULE_GROUPS[0]) {
    return group.modules.every(m => selectedCodes.has(m.code));
  }

  function isGroupPartiallyChecked(group: typeof MODULE_GROUPS[0]) {
    const some = group.modules.some(m => selectedCodes.has(m.code));
    return some && !isGroupFullyChecked(group);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Role name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const permissionCodes = Array.from(selectedCodes);

      if (initialData?.id) {
        await roleService.updateRole(initialData.id, {
          name: name.trim(),
          description: description.trim(),
          status,
          permissionCodes,
        });
      } else {
        await roleService.createRole({
          name: name.trim(),
          description: description.trim(),
          status,
          permissionCodes,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to save role.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[850px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="font-inter font-bold text-lg text-foreground">
                {initialData ? `Edit Role: ${initialData.name}` : "Create Custom Role"}
              </h2>
              <p className="font-inter text-xs text-muted">
                Configure role access levels and permission matrix
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-elevated rounded-lg text-muted hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-background custom-scrollbar">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Role Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-elevated p-4 rounded-xl border border-border">
            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-xs font-semibold text-foreground">Role Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={initialData?.isSystem}
                placeholder="e.g. Regional Merchandiser"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-surface text-foreground placeholder:text-muted font-inter disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-xs font-semibold text-foreground">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-surface text-foreground font-inter"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-inter text-xs font-semibold text-foreground">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Role responsibilities and department scope..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-surface text-foreground placeholder:text-muted font-inter resize-none"
              />
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h3 className="font-inter font-bold text-foreground text-sm">Permission Modules</h3>
                <span className="font-inter text-xs text-muted">
                  {selectedCodes.size} permission flags enabled
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => MODULE_GROUPS.forEach(g => toggleGroupAll(g, true))}
                  className="px-3 py-1 text-xs font-inter font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Grant All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCodes(new Set())}
                  className="px-3 py-1 text-xs font-inter font-semibold bg-surface border border-border text-foreground rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  Revoke All
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {MODULE_GROUPS.map(group => {
                const isExpanded = expandedGroups[group.group];
                const allChecked = isGroupFullyChecked(group);
                const someChecked = isGroupPartiallyChecked(group);
                const countGranted = group.modules.filter(m => selectedCodes.has(m.code)).length;

                return (
                  <div key={group.group} className="border border-border rounded-xl overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 bg-surface-elevated cursor-pointer hover:bg-surface-elevated/80 transition-colors"
                      onClick={() => toggleExpand(group.group)}
                    >
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={el => { if (el) el.indeterminate = someChecked; }}
                        onChange={e => { e.stopPropagation(); toggleGroupAll(group, e.target.checked); }}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 accent-primary cursor-pointer rounded"
                      />
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${group.color}`}>
                        {group.group}
                      </span>
                      <span className="font-inter text-xs text-muted ml-auto">
                        {countGranted}/{group.modules.length} permissions
                      </span>
                      {isExpanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
                    </div>

                    {isExpanded && (
                      <div className="p-3 bg-surface grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-border">
                        {group.modules.map(mod => {
                          const isChecked = selectedCodes.has(mod.code);
                          return (
                            <label
                              key={mod.code}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer text-xs font-inter ${
                                isChecked ? "bg-primary-soft border-primary/40 text-foreground font-semibold" : "border-border hover:bg-surface-elevated text-muted"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCode(mod.code)}
                                className="w-3.5 h-3.5 accent-primary cursor-pointer"
                              />
                              <span className="truncate">{mod.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 bg-surface shrink-0 flex items-center justify-between">
          <p className="font-inter text-xs text-muted">{selectedCodes.size} permissions selected</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-surface border border-border rounded-lg font-inter font-medium text-sm text-foreground hover:bg-surface-elevated transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="px-5 py-2 bg-primary text-white rounded-lg font-inter font-medium text-sm hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {initialData ? "Save Permissions" : "Create Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
