"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import { usePaymentReport } from "@/hooks/useReports";
import { Download } from "lucide-react";
import dynamic from "next/dynamic";

const PaymentsChart = dynamic(() => import("./PaymentsChart"), { 
  ssr: false, 
  loading: () => <div className="h-[300px] w-full flex items-center justify-center bg-stone-50 rounded-lg animate-pulse text-stone-400">Loading chart...</div> 
});

export default function PaymentReportPage() {
  const [dateRange, setDateRange] = useState("30");
  const { startDate, endDate } = useMemo(() => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: end };
  }, [dateRange]);

  const { data, isPending, error } = usePaymentReport(startDate, endDate);

  const handleDownloadCSV = () => {
    if (!data) return;
    const csvRows = ["Payment Gateway,Total Revenue,Transaction Count"];
    data.forEach(row => {
      csvRows.push(`${row.method},${row.revenue},${row.count}`);
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isPending) return <div className="p-10 font-poppins text-stone-500 flex flex-col gap-2"><span>Loading report data...</span><span className="text-xs text-stone-400">If this takes more than 10 seconds, check if the backend API is running.</span></div>;
  if (error || !data) return <div className="p-10 font-poppins text-red-500">Failed to load report. {(error as any)?.message || "Unknown error"}</div>;

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Payment Gateway Report" 
          description="Distribution of revenue and transaction volume across payment methods."
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground font-poppins mb-6">Revenue by Payment Method</h3>
        {data && data.length > 0 ? (
          <PaymentsChart data={data} />
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center bg-background rounded-lg border border-dashed border-border">
            <p className="text-muted font-inter font-medium">0 Data Available</p>
          </div>
        )}
      </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground font-poppins mb-6">Gateway Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 font-medium text-muted font-inter text-sm">Gateway</th>
                  <th className="py-3 font-medium text-muted font-inter text-sm text-right">Transactions</th>
                  <th className="py-3 font-medium text-muted font-inter text-sm text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/50 last:border-0">
                    <td className="py-4 font-medium text-foreground font-poppins text-sm">{row.method}</td>
                    <td className="py-4 text-muted font-inter text-sm text-right">{row.count}</td>
                    <td className="py-4 text-foreground font-poppins font-semibold text-sm text-right">Rs. {row.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
