"use client";
import AdminStatCards from "@/components/admin/AdminStatCards";

import { useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/Badges";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/dashboard/DataTable";
import { useBranches, useDeleteBranch } from "@/hooks/useInventory";
import BranchModal from "@/components/dashboard/BranchModal";
import { globalDialog } from "@/store/dialog.store";

export default function BranchesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const { data: realBranches, isLoading } = useBranches();
  const deleteMutation = useDeleteBranch();

  const handleEdit = (branch: any) => {
    const rawBranch = realBranches?.find((b: any) => b.code === branch.id);
    setEditingBranch(rawBranch);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (await globalDialog.confirm("Are you sure you want to deactivate this branch?")) {
      const rawBranch = realBranches?.find((b: any) => b.code === id);
      if (rawBranch) {
        await deleteMutation.mutateAsync(rawBranch.id);
      }
    }
  };

  const branches = realBranches?.map((b: any) => ({
    id: b.code,
    name: b.name,
    location: b.address || "Unknown",
    manager: b.managerName || "N/A",
    terminals: b.posCount || 0,
    staff: b.staffCount || 0,
    status: b.isActive ? "Operational" : "Inactive",
    revenue: `Rs. ${(b.revenue || 0).toLocaleString()}`,
    rawRevenue: b.revenue || 0,
  })) || [];

  const totalBranches = branches.length;
  const totalPosTerminals = branches.reduce((sum: number, b: any) => sum + b.terminals, 0);
  const totalStaff = branches.reduce((sum: number, b: any) => sum + b.staff, 0);
  const totalRevenue = branches.reduce((sum: number, b: any) => sum + b.rawRevenue, 0);

  const columns = [
    { header: "ID", accessor: "id" as const, className: "font-mono text-muted text-xs" },
    { header: "Branch Name", accessor: "name" as const, className: "font-semibold text-foreground" },
    { header: "Location", accessor: "location" as const },
    { header: "Manager", accessor: "manager" as const },
    {
      header: "POS Terminals",
      accessor: (row: any) => (
        <span className="font-bold text-foreground font-mono">{row.terminals}</span>
      ),
    },
    { header: "Staff", accessor: "staff" as const },
    { header: "Revenue (This Month)", accessor: "revenue" as const, className: "font-bold text-foreground font-mono" },
    {
      header: "Status",
      accessor: (row: any) => (
        <StatusBadge
          label={row.status}
          variant={row.status === "Operational" ? "success" : "neutral"}
        />
      ),
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleEdit(row)} 
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Edit
          </button>
          <span className="text-stone-300">·</span>
          <button 
            onClick={() => handleDelete(row.id)} 
            className="text-xs text-red-600 hover:underline font-medium"
            disabled={deleteMutation.isPending}
          >
            Deactivate
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-6">
      <PageHeader
        title="Branches"
        description="Manage physical store locations, POS terminals, and branch staff."
        action={
          <button 
            onClick={() => {
              setEditingBranch(null);
              setIsModalOpen(true);
            }}
            className="bg-stone-900 text-white hover:bg-stone-800 px-4 py-2.5 rounded-lg font-inter text-sm font-medium transition-colors"
          >
            + Add Branch
          </button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Branches" value={isLoading ? "-" : totalBranches.toString()} trend="Active locations" trendType="neutral" />
        <StatCard label="Active POS Terminals" value={isLoading ? "-" : totalPosTerminals.toString()} trend="Across all branches" trendType="neutral" />
        <StatCard label="Total Staff" value={isLoading ? "-" : totalStaff.toString()} trend="All active branches" trendType="neutral" />
        <StatCard label="Total Revenue" value={isLoading ? "-" : `Rs. ${totalRevenue.toLocaleString()}`} trend="This month" trendType="neutral" />
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.filter((b: any) => b.status === "Operational").map((branch: any) => (
          <div key={branch.id} className="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-inter font-bold text-foreground text-lg">{branch.name}</h3>
                <p className="font-inter text-sm text-muted">{branch.location}</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_6px_2px_rgba(16,185,129,0.3)]"></div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              <div className="flex flex-col">
                <span className="font-inter text-xs text-muted uppercase tracking-wider">Terminals</span>
                <span className="font-inter font-bold text-foreground font-mono text-xl">{branch.terminals}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-inter text-xs text-muted uppercase tracking-wider">Staff</span>
                <span className="font-inter font-bold text-foreground font-mono text-xl">{branch.staff}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-inter text-xs text-muted uppercase tracking-wider">Revenue</span>
                <span className="font-inter font-bold text-foreground font-mono text-sm">{branch.revenue}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="font-inter text-xs text-muted">Manager: <span className="text-foreground font-medium">{branch.manager}</span></span>
              <button onClick={() => handleEdit(branch)} className="text-xs font-medium text-primary hover:underline">View Details →</button>
            </div>
          </div>
        ))}
      </div>

      {/* Full Data Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 bg-background border-b border-border flex items-center justify-between">
          <h3 className="font-inter font-bold text-foreground">All Branches</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted">Loading branches...</div>
        ) : (
          <>
          <div className="mb-6"><AdminStatCards metrics={[
  { title: "Total", value: branches.length.toString(), theme: "white-blue" },
  { title: "Active", value: branches.filter((b: any) => b.status === "OPERATIONAL").length.toString(), theme: "white-stone" },
  { title: "Pending", value: branches.filter((b: any) => b.status !== "OPERATIONAL").length.toString(), theme: "orange" }
]} /></div>
      <DataTable
            columns={columns}
            data={branches}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => console.log("Branch selected:", row)}
          />
          </>
        )}
      </div>

      <BranchModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        branchToEdit={editingBranch} 
      />
    </div>
  );
}
