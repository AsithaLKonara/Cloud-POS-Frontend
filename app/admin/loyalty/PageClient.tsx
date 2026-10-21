"use client";
import AdminStatCards from "@/components/admin/AdminStatCards";

import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/Badges";
import { useLoyaltyMembers, useLoyaltyKpis } from "@/hooks/useLoyalty";
import { useState } from "react";
import { useDebounce } from "use-debounce";

export default function LoyaltyPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);

  const { data: membersResponse, isLoading: isMembersLoading } = useLoyaltyMembers({
    search: debouncedSearch,
    page,
    limit: 10
  });

  const { data: kpisResponse, isLoading: isKpisLoading } = useLoyaltyKpis();

  const members = membersResponse?.data || [];
  const meta = membersResponse?.meta || { currentPage: 1, totalPages: 1 };
  const kpis = kpisResponse?.data || {
    totalMembers: "0",
    pointsIssued: "0",
    pointsRedeemed: "0",
    outstandingLiability: "Rs. 0"
  };

  const columns = [
    { header: "Customer", accessor: "customer" as const, className: "font-semibold text-stone-900" },
    { header: "Phone", accessor: "phone" as const, className: "font-mono" },
    { header: "Points", accessor: "points" as const, className: "font-bold text-violet-600" },
    { 
      header: "Tier", 
      accessor: (row: any) => {
        let variant: 'success' | 'warning' | 'neutral' = 'neutral';
        if (row.tier === 'Gold' || row.tier === 'Platinum') variant = 'warning'; // Amber for Gold
        if (row.tier === 'Silver') variant = 'neutral';
        return <StatusBadge label={row.tier} variant={variant} />;
      }
    },
    { header: "Last Activity", accessor: "lastActivity" as const },
  ];

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-8">
      
      <PageHeader 
        title="Loyalty Program" 
        description="Manage rewards, customer tiers, and points distribution."
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={kpis.totalMembers} trend="All time" trendType="positive" />
        <StatCard label="Points Issued" value={kpis.pointsIssued} trend="All time" trendType="neutral" />
        <StatCard label="Points Redeemed" value={kpis.pointsRedeemed} trend="Estimated" trendType="positive" />
        <StatCard label="Outstanding Liability" value={kpis.outstandingLiability} trend="Estimated cost" trendType="neutral" />
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mt-2">
        <div className="px-6 py-4 border-b border-border bg-surface-elevated flex items-center justify-between">
          <h3 className="font-bold text-foreground font-inter">Loyalty Members</h3>
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-xs font-inter w-64 bg-surface text-foreground outline-none focus:border-primary" 
          />
        </div>

      <DataTable 
          data={members}
          columns={columns}
          keyExtractor={(row) => row.phone + row.customer}
          pagination={{ 
            currentPage: meta.page, 
            totalPages: meta.totalPages || 1,
            onPageChange: (newPage) => setPage(newPage)
          }}
        />
      </div>

    </div>
  );
}
