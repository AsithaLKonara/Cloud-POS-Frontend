"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import { useCustomerReport } from "@/hooks/useReports";
import { Download, Users } from "lucide-react";
import dynamic from "next/dynamic";

const CustomersChart = dynamic(() => import("./CustomersChart"), { 
  ssr: false, 
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-stone-50 rounded-lg animate-pulse text-stone-400">Loading chart...</div> 
});

export default function CustomersReportPage() {
  const [dateRange, setDateRange] = useState("30");
  const { startDate, endDate } = useMemo(() => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: end };
  }, [dateRange]);

  const { data, isPending, error } = useCustomerReport(startDate, endDate);

  const handleDownloadCSV = () => {
    if (!data) return;
    const csvRows = ["Customer ID,Name,Type,Order Count,Total Spent"];
    data.topCustomers.forEach((row: any) => {
      csvRows.push(`${row.id},${row.name},${row.isGuest ? 'Guest' : 'Registered'},${row.orderCount},${row.spent}`);
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isPending) return <div className="p-10 font-poppins text-stone-500 flex flex-col gap-2"><span>Loading report data...</span><span className="text-xs text-stone-400">If this takes more than 10 seconds, check if the backend API is running.</span></div>;
  if (error || !data) return <div className="p-10 font-poppins text-red-500">Failed to load report. {(error as any)?.message || "Unknown error"}</div>;

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Customer Insights Report" 
          description="Analyze customer acquisition, guest vs registered metrics, and lifetime value."
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
          <h3 className="text-sm font-medium text-muted font-inter">New Customers (Period)</h3>
          <p className="text-3xl font-semibold text-foreground font-poppins mt-2">{data.totalNew.toLocaleString()}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted font-inter">Registered Accounts</h3>
          <p className="text-3xl font-semibold text-emerald-500 font-poppins mt-2">{data.registered.toLocaleString()}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted font-inter">Guest Checkouts</h3>
          <p className="text-3xl font-semibold text-amber-500 font-poppins mt-2">{data.guest.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground font-poppins mb-6">Top Buyers by LTV</h3>
          {data.topCustomers && data.topCustomers.length > 0 ? (
            <CustomersChart data={data.topCustomers} />
          ) : (
            <div className="h-[400px] w-full flex items-center justify-center bg-background rounded-lg border border-dashed border-border">
              <p className="text-muted font-inter font-medium">0 Data Available</p>
            </div>
          )}
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-6">
           <h3 className="text-lg font-semibold text-foreground font-poppins mb-6">Acquisition Mix</h3>
           <div className="flex flex-col items-center justify-center h-[400px] gap-8">
             <div className="w-full relative h-4 bg-background rounded-full overflow-hidden flex border border-border">
               <div className="bg-emerald-500 h-full" style={{ width: `${data.totalNew > 0 ? (data.registered / data.totalNew) * 100 : 0}%` }}></div>
               <div className="bg-amber-500 h-full" style={{ width: `${data.totalNew > 0 ? (data.guest / data.totalNew) * 100 : 0}%` }}></div>
             </div>
             <div className="w-full flex flex-col gap-4">
                <div className="flex justify-between items-center bg-background border border-border p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="font-inter text-sm font-medium text-foreground">Registered</span>
                  </div>
                  <span className="font-poppins font-semibold text-foreground">{data.totalNew > 0 ? Math.round((data.registered / data.totalNew) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center bg-background border border-border p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="font-inter text-sm font-medium text-foreground">Guest Checkout</span>
                  </div>
                  <span className="font-poppins font-semibold text-foreground">{data.totalNew > 0 ? Math.round((data.guest / data.totalNew) * 100) : 0}%</span>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
