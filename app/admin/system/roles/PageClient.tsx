"use client";
import AdminStatCards from "@/components/admin/AdminStatCards";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import FilterBar from "@/components/dashboard/FilterBar";
import DataTable from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/Badges";
import { Plus, Users, Shield, Loader2, Trash2, RefreshCw } from "lucide-react";
import RoleModal from "@/components/dashboard/RoleModal";
import UserModal from "@/components/dashboard/UserModal";
import roleService, { RoleItem, SystemUserItem } from "@/services/role.service";
import { globalDialog } from "@/store/dialog.store";
import { useDebounce } from "@/hooks/useDebounce";
import { useBranches } from "@/hooks/useInventory";

export default function AccessControlPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");

  // State
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [users, setUsers] = useState<SystemUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");

  const { data: branchesResp } = useBranches();
  const branches = branchesResp?.data || branchesResp || [];

  // Modals
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);

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
      console.error("Failed to load access control data:", err);
      setError(err.response?.data?.message || err.message || "Failed to load roles and users.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, roleFilter, branchFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteRole = async (role: RoleItem) => {
    if (role.isSystem) {
      globalDialog.alert("System roles cannot be deleted.");
      return;
    }

    if (await globalDialog.confirm(`Are you sure you want to delete role '${role.name}'?`)) {
      try {
        await roleService.deleteRole(role.id);
        fetchData();
      } catch (err: any) {
        globalDialog.alert(err.response?.data?.message || "Failed to delete role.");
      }
    }
  };

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const columns = [
    {
      header: "Role Name",
      className: "whitespace-nowrap",
      accessor: (row: RoleItem) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-900">{row.name}</span>
          {row.isSystem && (
            <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono font-medium">
              System
            </span>
          )}
        </div>
      ),
    },
    { header: "Description", accessor: "description" as const, className: "whitespace-nowrap" },
    {
      header: "Assigned Users",
      className: "whitespace-nowrap",
      accessor: (row: RoleItem) => (
        <span className="font-medium text-stone-700">{row.users || 0} user(s)</span>
      ),
    },
    {
      header: "Permissions Level",
      className: "whitespace-nowrap",
      accessor: (row: RoleItem) => (
        <StatusBadge
          label={row.level}
          variant={row.level === "High" ? "error" : row.level === "Medium" ? "warning" : "info"}
        />
      ),
    },
    {
      header: "Status",
      className: "whitespace-nowrap",
      accessor: (row: RoleItem) => (
        <StatusBadge
          label={row.status}
          variant={row.status === "Active" ? "success" : "neutral"}
          dot
        />
      ),
    },
    {
      header: "Actions",
      className: "whitespace-nowrap",
      accessor: (row: RoleItem) => (
        <div className="flex items-center gap-3">
          <button
            className="text-xs text-blue-600 hover:underline font-medium"
            onClick={(e) => {
              e.stopPropagation();
              setEditingRole(row);
              setRoleModalOpen(true);
            }}
          >
            Edit Permissions
          </button>
          {!row.isSystem && (
            <button
              className="text-xs text-red-500 hover:text-red-700"
              title="Delete Role"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteRole(row);
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const userColumns = [
    {
      header: "Name",
      className: "whitespace-nowrap",
      accessor: (row: SystemUserItem) => (
        <span className="font-semibold text-stone-900">{row.name}</span>
      ),
    },
    { header: "Email", accessor: "email" as const, className: "whitespace-nowrap" },
    {
      header: "Role",
      className: "whitespace-nowrap",
      accessor: (row: SystemUserItem) => (
        <span className="font-semibold text-stone-700">{row.role}</span>
      ),
    },
    { header: "Branch", accessor: "branch" as const, className: "whitespace-nowrap" },
    {
      header: "Status",
      className: "whitespace-nowrap",
      accessor: (row: SystemUserItem) => (
        <StatusBadge
          label={row.status}
          variant={row.status === "ACTIVE" || row.status === "Active" ? "success" : "error"}
          dot
        />
      ),
    },
    {
      header: "Actions",
      className: "whitespace-nowrap",
      accessor: (row: SystemUserItem) => (
        <div className="flex items-center gap-2">
          <button
            className="text-xs text-blue-600 hover:underline font-medium"
            onClick={(e) => {
              e.stopPropagation();
              setEditingUser(row);
              setUserModalOpen(true);
            }}
          >
            Manage Access
          </button>
        </div>
      ),
    },
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => fetchData()}
        className="p-2 border border-stone-200 hover:bg-stone-100 rounded-lg text-stone-700 transition-colors"
        title="Refresh Data"
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
      </button>
      <button
        onClick={() => {
          if (activeTab === "roles") {
            setEditingRole(null);
            setRoleModalOpen(true);
          } else {
            setEditingUser(null);
            setUserModalOpen(true);
          }
        }}
        className="bg-stone-900 text-white hover:bg-stone-800 active:scale-95 px-5 py-2 rounded-lg font-inter text-sm font-semibold transition-all whitespace-nowrap shadow-md shadow-stone-900/20 flex items-center gap-2"
      >
        <Plus size={16} /> {activeTab === "roles" ? "Create Role" : "Invite User"}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full">
      <PageHeader
        title="Access Control Center"
        description="Manage system users, define roles, and configure granular permissions across the platform."
        action={pageActions}
      />

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-stone-200 mb-6">
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-3 font-inter text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "roles"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <Shield size={16} /> Roles & Permissions ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 font-inter text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "users"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <Users size={16} /> System Users ({users.length})
        </button>
      </div>

      <div className="mb-6">
        <AdminStatCards metrics={[
          { 
            title: "Total", 
            value: loading ? "..." : (activeTab === "roles" ? roles.length : users.length).toString(), 
            theme: "white-blue" 
          },
          { 
            title: "Active", 
            value: loading ? "..." : (activeTab === "roles" ? roles.filter(r => r.status === "Active").length : users.filter(u => u.status?.toLowerCase() === "active").length).toString(), 
            theme: "white-stone" 
          },
          { 
            title: activeTab === "roles" ? "System" : "Pending", 
            value: loading ? "..." : (activeTab === "roles" ? roles.filter(r => r.isSystem).length : users.filter(u => u.status?.toLowerCase() === "pending").length).toString(), 
            theme: "orange" 
          }
        ]} />
      </div>
      <FilterBar
        placeholder={activeTab === "roles" ? "Search roles..." : "Search users by name or email..."}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        filters={
          activeTab === "users" ? (
            <>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-surface border border-border rounded-lg py-2 px-3 text-sm font-inter text-foreground outline-none focus:border-primary"
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
                className="bg-surface border border-border rounded-lg py-2 px-3 text-sm font-inter text-foreground outline-none focus:border-primary"
              >
                <option value="All">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </>
          ) : <></>
        }
      />

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="font-inter text-sm font-medium">Loading access control matrix...</p>
          </div>
        ) : activeTab === "roles" ? (
          <DataTable
            data={filteredRoles}
            columns={columns}
            keyExtractor={(row) => row.id}
            pagination={{ currentPage: 1, totalPages: 1 }}
          />
        ) : (
          <DataTable
            data={users}
            columns={userColumns}
            keyExtractor={(row) => row.id}
            pagination={{ currentPage: 1, totalPages: 1 }}
          />
        )}
      </div>

      {/* Role Modal */}
      <RoleModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        onSuccess={fetchData}
        initialData={editingRole}
      />

      {/* User Modal */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onSuccess={fetchData}
        initialData={editingUser}
        availableRoles={roles}
        availableBranches={branches}
      />
    </div>
  );
}
