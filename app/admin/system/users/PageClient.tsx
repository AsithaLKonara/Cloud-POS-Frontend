"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import FilterBar from "@/components/dashboard/FilterBar";
import DataTable from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/Badges";
import {
  Plus,
  Users,
  Shield,
  Loader2,
  Trash2,
  Edit2,
  RefreshCw,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Store,
  UserCog,
} from "lucide-react";
import UserModal from "@/components/dashboard/UserModal";
import roleService, { RoleItem, SystemUserItem } from "@/services/role.service";
import { globalDialog } from "@/store/dialog.store";
import { useDebounce } from "@/hooks/useDebounce";
import { useBranches } from "@/hooks/useInventory";
import Link from "next/link";

export default function StaffManagementPage() {
  const [users, setUsers] = useState<SystemUserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");

  const { data: branchesResp } = useBranches();
  const branches: any[] = Array.isArray(branchesResp)
    ? branchesResp
    : (branchesResp as any)?.data || [];

  // Modals
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUserItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedRoles, fetchedUsers] = await Promise.all([
        roleService.getRoles(),
        roleService.getUsers(
          debouncedSearchTerm || undefined,
          roleFilter !== "All" ? roleFilter : undefined,
          branchFilter !== "All" ? branchFilter : undefined
        ),
      ]);
      setRoles(fetchedRoles);
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error("Failed to load staff users:", err);
      setError(err.response?.data?.message || err.message || "Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, roleFilter, branchFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteUser = async (user: SystemUserItem) => {
    const confirmed = await globalDialog.confirm(
      `Are you sure you want to delete ${user.name}? This will revoke their access to POS and Admin portals immediately.`,
      "Remove Staff Member"
    );
    if (!confirmed) return;

    try {
      await roleService.deleteUser(user.id);
      await globalDialog.alert(`${user.name} has been removed.`, "Staff Deleted");
      fetchData();
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      await globalDialog.alert(err.response?.data?.message || "Could not delete user.", "Delete Failed");
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "ST";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const columns = useMemo(
    () => [
      {
        header: "Staff Member",
        className: "whitespace-nowrap",
        accessor: (row: SystemUserItem) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 font-bold text-xs shrink-0 shadow-sm">
              {getInitials(row.name)}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm leading-tight">
                {row.name}
              </span>
              <span className="text-xs text-muted font-mono mt-0.5">{row.email}</span>
            </div>
          </div>
        ),
      },
      {
        header: "Role",
        className: "whitespace-nowrap",
        accessor: (row: SystemUserItem) => {
          const roleName = row.role || "Staff";
          const isExec =
            roleName.toLowerCase().includes("admin") || roleName.toLowerCase().includes("owner");
          const isCashier = roleName.toLowerCase().includes("cashier");

          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                isExec
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                  : isCashier
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
              }`}
            >
              <Shield size={12} />
              {roleName}
            </span>
          );
        },
      },
      {
        header: "Assigned Branch",
        className: "whitespace-nowrap",
        accessor: (row: SystemUserItem) => {
          const branchName = row.branch;
          if (!branchName || branchName === "All Branches" || branchName === "None") {
            return (
              <span className="inline-flex items-center gap-1 text-xs text-muted font-medium px-2 py-0.5 rounded bg-background border border-border">
                <Store size={12} className="text-amber-500" />
                All Branches (HQ)
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-xs text-foreground font-medium px-2 py-0.5 rounded bg-surface border border-border">
              <Building2 size={12} className="text-muted" />
              {branchName}
            </span>
          );
        },
      },
      {
        header: "Phone",
        className: "whitespace-nowrap",
        accessor: (row: SystemUserItem) => (
          <span className="text-xs text-muted font-mono">
            {row.phone || "—"}
          </span>
        ),
      },
      {
        header: "Status",
        className: "whitespace-nowrap",
        accessor: (row: SystemUserItem) => {
          const isActive = row.status?.toUpperCase() === "ACTIVE";
          return (
            <StatusBadge
              label={isActive ? "Active" : row.status || "Inactive"}
              variant={isActive ? "success" : "error"}
              dot
            />
          );
        },
      },
      {
        header: "Actions",
        className: "whitespace-nowrap text-right",
        accessor: (row: SystemUserItem) => (
          <div className="flex items-center justify-end gap-2">
            <button
              className="p-1.5 rounded-lg border border-border hover:bg-background text-foreground transition-colors text-xs flex items-center gap-1.5 font-medium shadow-sm"
              title="Edit Staff Member"
              onClick={(e) => {
                e.stopPropagation();
                setEditingUser(row);
                setUserModalOpen(true);
              }}
            >
              <Edit2 size={13} className="text-muted" />
              <span>Edit</span>
            </button>
            <button
              className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors text-xs shadow-sm"
              title="Delete Staff Member"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteUser(row);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status?.toUpperCase() === "ACTIVE").length;
    const cashiers = users.filter((u) => u.role?.toLowerCase().includes("cashier")).length;
    const branchAdmins = users.filter(
      (u) =>
        u.role?.toLowerCase().includes("branch") ||
        u.role?.toLowerCase().includes("manager")
    ).length;

    return [
      { title: "Total Staff", value: total.toString(), icon: Users, theme: "blue" },
      { title: "Active Accounts", value: active.toString(), icon: UserCheck, theme: "emerald" },
      { title: "Branch Managers", value: branchAdmins.toString(), icon: Building2, theme: "amber" },
      { title: "Cashiers & POS", value: cashiers.toString(), icon: UserCog, theme: "purple" },
    ];
  }, [users]);

  const pageActions = (
    <div className="flex items-center gap-2">
      <Link
        href="/admin/system/roles"
        className="px-3.5 py-2 rounded-xl border border-border hover:bg-surface text-foreground font-inter text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
      >
        <Shield size={14} className="text-amber-500" />
        <span>Manage Roles</span>
      </Link>
      <button
        onClick={() => fetchData()}
        className="p-2 border border-border hover:bg-surface rounded-xl text-foreground transition-colors shadow-sm"
        title="Refresh Staff List"
      >
        <RefreshCw size={15} className={loading ? "animate-spin text-amber-500" : "text-muted"} />
      </button>
      <button
        onClick={() => {
          setEditingUser(null);
          setUserModalOpen(true);
        }}
        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl font-inter text-xs font-extrabold transition-all shadow-sm flex items-center gap-2"
      >
        <Plus size={15} /> Add Staff Member
      </button>
    </div>
  );

  return (
    <div className="flex flex-col p-4 md:p-8 max-w-[1400px] mx-auto w-full gap-6">
      <PageHeader
        title="Staff & User Management"
        description="Oversee employee accounts, assign branch terminals, and configure role-based access."
        action={pageActions}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-black text-foreground font-poppins">
                  {loading ? "..." : stat.value}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-amber-500 shadow-inner">
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <FilterBar
        placeholder="Search staff by name, email, or phone..."
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        filters={
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-surface border border-border rounded-xl py-2 px-3 text-xs font-inter font-semibold text-foreground outline-none focus:border-amber-500 shadow-sm"
            >
              <option value="All">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-surface border border-border rounded-xl py-2 px-3 text-xs font-inter font-semibold text-foreground outline-none focus:border-amber-500 shadow-sm"
            >
              <option value="All">All Branches</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="font-inter text-xs font-medium">Loading staff registry...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-1">
              <Users size={22} />
            </div>
            <p className="font-poppins font-bold text-base text-foreground">No staff members found</p>
            <p className="text-xs text-muted max-w-sm">
              {searchTerm || roleFilter !== "All" || branchFilter !== "All"
                ? "No users match your filter criteria. Try resetting the filters."
                : "Get started by adding your first cashier, store manager, or administrator."}
            </p>
            <button
              onClick={() => {
                setEditingUser(null);
                setUserModalOpen(true);
              }}
              className="mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl font-inter text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Staff Member
            </button>
          </div>
        ) : (
          <DataTable
            data={users}
            columns={columns}
            keyExtractor={(row) => row.id}
            pagination={{ currentPage: 1, totalPages: 1 }}
          />
        )}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={fetchData}
        initialData={editingUser}
        availableRoles={roles}
        availableBranches={branches}
      />
    </div>
  );
}
