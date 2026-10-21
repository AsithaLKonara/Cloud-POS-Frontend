"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import { usePosReport } from "@/hooks/useReports";
import { Download, MonitorSmartphone } from "lucide-react";
import dynamic from "next/dynamic";

const PosChart = dynamic(() => import("./PosChart"), { 
  ssr: false, 
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-stone-50 rounded-lg animate-pulse text-stone-400">Loading chart...</div> 
});

export default function PosReportPage() {
  const [dateRange, setDateRange] = useState("30");
  const { startDate, endDate } = useMemo(() => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: end };
  }, [dateRange]);

  const { data, isPending, error } = usePosReport(startDate, endDate);

  const handleDownloadCSV = () => {
    if (!data) return;
    const csvRows = ["Terminal,Session Count,Total Revenue"];
    data.terminals.forEach((row: any) => {
      csvRows.push(`${row.terminalName},${row.sessionCount},${row.revenue}`);
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pos_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isPending) return <div className="p-10 font-poppins text-stone-500 flex flex-col gap-2"><span>Loading report data...</span><span className="text-xs text-stone-400">If this takes more than 10 seconds, check if the backend API is running.</span></div>;
  if (error || !data) return <div className="p-10 font-poppins text-red-500">Failed to load report. {(error as any)?.message || "Unknown error"}</div>;

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Point of Sale (POS) Report" 
          description="Analyze cashier sessions, cash variances, and terminal performance."
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted font-inter">Total Sessions</h3>
          <p className="text-3xl font-semibold text-foreground font-poppins mt-2">{data.summary.totalSessions}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted font-inter">Expected Cash</h3>
          <p className="text-3xl font-semibold text-foreground font-poppins mt-2">Rs. {data.summary.expectedTotal.toLocaleString()}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted font-inter">Actual Cash Counted</h3>
          <p className="text-3xl font-semibold text-foreground font-poppins mt-2">Rs. {data.summary.actualTotal.toLocaleString()}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
          <h3 className="text-sm font-medium text-muted font-inter">Total Cash Variance</h3>
          <p className={`text-3xl font-semibold font-poppins mt-2 ${data.summary.totalVariance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            Rs. {data.summary.totalVariance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground font-poppins mb-6">Revenue by Terminal</h3>
        {data.terminals && data.terminals.length > 0 ? (
          <PosChart data={data.terminals} />
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center bg-background rounded-lg border border-dashed border-border">
            <p className="text-muted font-inter font-medium">0 Data Available</p>
          </div>
        )}
      </div>
    </div>
  );
}
