"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import { usePromotionsReport } from "@/hooks/useReports";
import { Download, Tag } from "lucide-react";
import dynamic from "next/dynamic";

const PromotionsChart = dynamic(() => import("./PromotionsChart"), { 
  ssr: false, 
  loading: () => <div className="h-[300px] w-full flex items-center justify-center bg-stone-50 rounded-lg animate-pulse text-stone-400">Loading chart...</div> 
});

export default function PromotionsReportPage() {
  const [dateRange, setDateRange] = useState("30");
  const { startDate, endDate } = useMemo(() => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: end };
  }, [dateRange]);

  const { data, isPending, error } = usePromotionsReport(startDate, endDate);

  const handleDownloadCSV = () => {
    if (!data) return;
    const csvRows = [
      "Category,Metric,Value",
      `Vouchers,Issued,${data.vouchers.issued}`,
      `Vouchers,Used,${data.vouchers.used}`,
      `Vouchers,Outstanding Liability,${data.vouchers.outstandingLiability}`,
      `Coupons,Issued,${data.coupons.issued}`,
      `Coupons,Total Usages,${data.coupons.totalUsages}`
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promotions_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const chartData = data ? [
    { name: "Vouchers", Issued: data.vouchers.issued, Used: data.vouchers.used },
    { name: "Coupons", Issued: data.coupons.issued, Used: data.coupons.totalUsages },
  ] : [];

  if (isPending) return <div className="p-10 font-poppins text-stone-500 flex flex-col gap-2"><span>Loading report data...</span><span className="text-xs text-stone-400">If this takes more than 10 seconds, check if the backend API is running.</span></div>;
  if (error || !data) return <div className="p-10 font-poppins text-red-500">Failed to load report. {(error as any)?.message || "Unknown error"}</div>;

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Promotions & Vouchers Report" 
          description="Track the usage and liability of exchange vouchers and discount coupons."
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

      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground font-poppins mb-6">Promotions Utilization</h3>
        {chartData.some(d => d.Issued > 0 || d.Used > 0) ? (
          <PromotionsChart data={chartData} />
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center bg-background rounded-lg border border-dashed border-border">
            <p className="text-muted font-inter font-medium">0 Data Available</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vouchers Block */}
        <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center text-foreground">
              <Tag size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground font-poppins">Exchange Vouchers</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background border border-border p-4 rounded-lg">
              <p className="text-sm font-medium text-muted font-inter">Issued</p>
              <p className="text-2xl font-semibold text-foreground font-poppins mt-1">{data.vouchers.issued.toLocaleString()}</p>
            </div>
            <div className="bg-background border border-border p-4 rounded-lg">
              <p className="text-sm font-medium text-muted font-inter">Redeemed</p>
              <p className="text-2xl font-semibold text-emerald-500 font-poppins mt-1">{data.vouchers.used.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-surface-elevated border border-border p-5 rounded-lg">
             <p className="text-sm font-medium font-inter text-muted">Outstanding Financial Liability</p>
             <p className="text-3xl font-semibold font-poppins mt-2 text-foreground">Rs. {data.vouchers.outstandingLiability.toLocaleString()}</p>
          </div>
        </div>

        {/* Coupons Block */}
        <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center text-foreground">
              <Tag size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground font-poppins">Discount Coupons</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-background border border-border p-4 rounded-lg">
              <p className="text-sm font-medium text-muted font-inter">Total Coupons Created</p>
              <p className="text-2xl font-semibold text-foreground font-poppins mt-1">{data.coupons.issued.toLocaleString()}</p>
            </div>
            <div className="bg-background border border-border p-4 rounded-lg">
              <p className="text-sm font-medium text-muted font-inter">Total Redemptions</p>
              <p className="text-2xl font-semibold text-foreground font-poppins mt-1">{data.coupons.totalUsages.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
