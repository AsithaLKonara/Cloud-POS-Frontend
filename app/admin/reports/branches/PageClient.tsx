"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import { useBranchReport } from "@/hooks/useReports";
import { Download, Building2 } from "lucide-react";
import dynamic from "next/dynamic";

const BranchesChart = dynamic(() => import("./BranchesChart"), { 
  ssr: false, 
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-stone-50 rounded-lg animate-pulse text-stone-400">Loading chart...</div> 
});

export default function BranchReportPage() {
  const [dateRange, setDateRange] = useState("30");
  const { startDate, endDate } = useMemo(() => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: end };
  }, [dateRange]);

  const { data, isPending, error } = useBranchReport(startDate, endDate);

  const handleDownloadCSV = () => {
    if (!data) return;
    const csvRows = ["Branch ID,Branch Name,Type,Total Revenue,Total Orders"];
    data.forEach(row => {
      csvRows.push(`${row.branchId},${row.branchName},${row.type},${row.revenue},${row.orders}`);
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `branch_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isPending) return <div className="p-10 font-poppins text-stone-500 flex flex-col gap-2"><span>Loading report data...</span><span className="text-xs text-stone-400">If this takes more than 10 seconds, check if the backend API is running.</span></div>;
  if (error || !data) return <div className="p-10 font-poppins text-red-500">Failed to load report. {(error as any)?.message || "Unknown error"}</div>;

  const totalGlobalRevenue = data.reduce((sum, b) => sum + b.revenue, 0);

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Branch Performance Report" 
          description="Revenue and order volume analysis across all physical and virtual locations."
        />
        <div className="flex items-center gap-3">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 px-4 border border-border rounded-lg bg-surface text-sm font-inter text-foreground outline-none focus:border-primary"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <button onClick={handleDownloadCSV} className="h-10 px-4 bg-primary text-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-stone-800 transition-colors">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map((branch) => (
          <div key={branch.branchId} className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center text-foreground">
                <Building2 size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-foreground font-poppins text-sm">{branch.branchName}</h4>
                <span className="text-xs text-muted font-inter px-2 py-0.5 bg-surface-elevated rounded-full">{branch.type}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-foreground font-poppins">Rs. {branch.revenue.toLocaleString()}</p>
              <p className="text-xs text-muted font-inter">{branch.orders} Total Orders</p>
            </div>
            <div 
              className="absolute bottom-0 left-0 h-1 bg-accent" 
              style={{ width: `${totalGlobalRevenue > 0 ? (branch.revenue / totalGlobalRevenue) * 100 : 0}%` }}
            />
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground font-poppins mb-6">Revenue by Branch</h3>
        {data && data.length > 0 ? (
          <BranchesChart data={data} />
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center bg-background rounded-lg border border-dashed border-border">
            <p className="text-muted font-inter font-medium">0 Data Available</p>
          </div>
        )}
      </div>
    </div>
  );
}
