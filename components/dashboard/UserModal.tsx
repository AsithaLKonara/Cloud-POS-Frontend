"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Info, Loader2 } from "lucide-react";
import roleService, { RoleItem, SystemUserItem } from "@/services/role.service";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: SystemUserItem | null;
  availableRoles?: RoleItem[];
  availableBranches?: any[];
}

export default function UserModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  availableRoles = [],
  availableBranches = [],
}: UserModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      const parts = (initialData.name || "").split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setEmail(initialData.email);
      setPhone(initialData.phone || "");
      setSelectedRoleId(initialData.roleIds?.[0] || availableRoles[0]?.id || "");
      setSelectedBranchId(initialData.branchId || "");
      setStatus(initialData.status || "ACTIVE");
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setSelectedRoleId(availableRoles[0]?.id || "");
      setSelectedBranchId("");
      setStatus("ACTIVE");
    }
    setError(null);
  }, [initialData, isOpen, availableRoles]);

  if (!isOpen) return null;

  const currentRole = availableRoles.find((r) => r.id === selectedRoleId);
  const isSuperAdmin = currentRole?.name === "Super Admin";

  async function handleSave() {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName || !email.trim()) {
      setError("Name and Email are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: fullName,
        email: email.trim(),
        phone: phone.trim() || undefined,
        status,
        roleIds: selectedRoleId ? [selectedRoleId] : undefined,
        branchId: isSuperAdmin ? null : (selectedBranchId || null),
      };

      if (initialData?.id) {
        await roleService.updateUser(initialData.id, payload);
      } else {
        await roleService.createUser({ ...payload, password: "Password123!" }); // Set a default secure password for new users
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to save user.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[550px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="font-inter font-bold text-lg text-foreground flex items-center gap-2">
              <UserPlus size={18} className="text-primary" />
              {initialData ? "Edit User Access" : "Invite System User"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-elevated rounded-lg text-muted hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-background custom-scrollbar">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-xs font-semibold text-foreground">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Jane"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-surface-elevated text-foreground placeholder:text-muted font-inter"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-xs font-semibold text-foreground">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Doe"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-surface-elevated text-foreground placeholder:text-muted font-inter"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-foreground">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!initialData?.id}
              placeholder="staff@example.com"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-surface-elevated text-foreground placeholder:text-muted font-inter disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-foreground">Phone (Optional)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94770000000"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-surface-elevated text-foreground placeholder:text-muted font-inter"
            />
          </div>

          <div className="h-px bg-border w-full"></div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-foreground">Role Assignment</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-surface-elevated text-foreground font-inter"
            >
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.level || "Custom"} Access)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-foreground">Branch Scope</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={isSuperAdmin}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-surface-elevated text-foreground font-inter disabled:opacity-50"
            >
              <option value="">Global (All Branches)</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {isSuperAdmin && (
              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg mt-1">
                <Info size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="font-inter text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                  Super Admins are automatically assigned to Global scope and can access all branches.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-foreground">Account Status</label>
            <div className="flex items-center gap-4 bg-surface-elevated border border-border p-3 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={status === "ACTIVE" || status === "Active"}
                  onChange={() => setStatus("ACTIVE")}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm font-inter text-foreground">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="SUSPENDED"
                  checked={status === "SUSPENDED" || status === "Suspended"}
                  onChange={() => setStatus("SUSPENDED")}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm font-inter text-rose-600 dark:text-rose-400 font-medium">Suspended</span>
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 bg-surface shrink-0 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-surface border border-border rounded-lg font-inter font-medium text-sm text-foreground hover:bg-surface-elevated transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !firstName.trim() || !email.trim()}
            className="px-5 py-2 bg-primary text-white rounded-lg font-inter font-medium text-sm hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {initialData ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}
