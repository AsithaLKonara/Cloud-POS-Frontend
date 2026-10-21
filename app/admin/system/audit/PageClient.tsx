"use client";
import AdminStatCards from "@/components/admin/AdminStatCards";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/dashboard/PageHeader";
import FilterBar from "@/components/dashboard/FilterBar";
import DataTable from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/Badges";
import AuditLogDetailModal from "@/components/admin/AuditLogDetailModal";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAudit";

export default function AuditPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [timeframeFilter, setTimeframeFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: auditData, isLoading } = useAuditLogs({
    search: searchQuery || undefined,
    action: actionFilter === "All Actions" ? undefined : (actionFilter || undefined),
    timeframe: timeframeFilter === "All Time" ? undefined : (timeframeFilter || undefined),
    page: page
  });

  const logs = auditData?.data || [];
  const meta = auditData?.meta || { totalPages: 1, page: 1 };

  const formattedLogs = logs.map((log: any) => ({
    id: log.id,
    timestamp: new Date(log.createdAt).toLocaleString(),
    user: log.userId || "System",
    action: log.action,
    resource: log.entity,
    details: log.entityId ? `${log.action} ${log.entity} ID: ${log.entityId}` : `${log.action} ${log.entity}`,
    raw: log
  }));

  const columns = [
    { header: "Timestamp", accessor: "timestamp" as const },
    { header: "User", accessor: "user" as const },
    { 
      header: "Action", 
      accessor: (row: any) => (
        <StatusBadge 
          label={row.action} 
          variant={row.action === "DELETE" ? "error" : row.action === "UPDATE" ? "warning" : row.action === "CREATE" ? "success" : "neutral"} 
        />
      ) 
    },
    { header: "Resource", accessor: "resource" as const },
    { header: "Details", accessor: "details" as const },
  ];

  const filters = (
    <>
      <select 
        value={actionFilter}
        onChange={e => { setActionFilter(e.target.value); setPage(1); }}
        className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-inter text-stone-700 outline-none focus:ring-1 focus:ring-stone-400"
      >
        <option value="">All Actions</option>
        <option value="CREATE">CREATE</option>
        <option value="UPDATE">UPDATE</option>
        <option value="DELETE">DELETE</option>
        <option value="SYSTEM">SYSTEM</option>
        <option value="LOGIN">LOGIN</option>
      </select>
      <select 
        value={timeframeFilter}
        onChange={e => { setTimeframeFilter(e.target.value); setPage(1); }}
        className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-inter text-stone-700 outline-none focus:ring-1 focus:ring-stone-400"
      >
        <option value="">All Time</option>
        <option value="Last 24 Hours">Last 24 Hours</option>
        <option value="Last 7 Days">Last 7 Days</option>
        <option value="Last 30 Days">Last 30 Days</option>
      </select>
    </>
  );

  const [selectedLog, setSelectedLog] = useState<any>(null);

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full">
      <PageHeader 
        title="Audit Logs" 
        description="Immutable record of all system-level modifications and critical operations."
      />

      <div className="mb-6"><AdminStatCards metrics={[
  { title: "Total", value: "---", theme: "white-blue" },
  { title: "Active", value: "---", theme: "white-stone" },
  { title: "Pending", value: "---", theme: "orange" }
]} /></div>
      <FilterBar 
        placeholder="Search logs by user or resource..." 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters} 
      />

      <DataTable 
        data={formattedLogs}
        columns={columns}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => setSelectedLog(row)}
        pagination={{ 
          currentPage: meta.page, 
          totalPages: meta.totalPages || 1,
          onPageChange: (newPage) => setPage(newPage) 
        }}
      />

      {selectedLog && (
        <AuditLogDetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </div>
  );
}
