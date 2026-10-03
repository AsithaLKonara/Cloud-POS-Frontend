"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import StatCard from "@/components/dashboard/StatCard";
import { PaymentGatewayBadge } from "@/components/dashboard/Badges";
import { useState, useMemo } from "react";
import { usePaymentTransactions, usePaymentKpis } from "@/hooks/usePayments";
import { api } from "@/services/api";
import FilterBar from "@/components/dashboard/FilterBar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";

const GATEWAY_COLORS: Record<string, string> = {
  "COD": "#10b981", // Emerald
  "Koko": "#f59e0b", // Amber
  "Mintpay": "#3b82f6", // Blue
  "Payzy": "#8b5cf6", // Purple
  "OnePay": "#ef4444", // Red
  "MANUAL": "#6b7280" // Gray
};

export default function PaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Overview"); // Overview, Transactions, Gateways, Reports
  const [page, setPage] = useState(1);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [gateway, setGateway] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { data: txResponse, isLoading: txLoading } = usePaymentTransactions({
    gateway,
    status,
    search: searchQuery,
    startDate,
    endDate,
    page,
    limit: 10
  });

  const { data: kpiResponse, isLoading: kpiLoading } = usePaymentKpis({
    gateway,
    startDate,
    endDate
  });

  const transactions = txResponse?.data || [];
  const meta = txResponse?.meta || { currentPage: 1, totalPages: 1 };
  
  const kpis = kpiResponse?.data || {
    totalAmount: 0,
    pendingAmount: 0,
    successfulCount: "0",
    pendingCount: "0",
    failedCount: "0",
    successRate: 0,
    chartData: [],
    gatewayData: []
  };

  const columns = [
    { header: "Transaction", accessor: "id" as const },
    { header: "Order", accessor: "order" as const },
    { header: "Customer", accessor: "customer" as const },
    { 
      header: "Gateway", 
      accessor: (row: any) => <PaymentGatewayBadge gateway={row.gateway} status={row.status.toLowerCase()} /> 
    },
    { header: "Amount", accessor: "amountStr" as const },
    { header: "Status", accessor: "status" as const },
    { header: "Date", accessor: "date" as const },
  ];

  const mainTabs = ["Overview", "Transactions", "Gateways", "Reports"];

  // Filter Bar Logic
  const handleDateQuickSelect = (option: string) => {
    const today = new Date();
    let start = "";
    let end = today.toISOString().split("T")[0];

    switch (option) {
      case "today":
        start = end;
        break;
      case "7days":
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 7);
        start = last7.toISOString().split("T")[0];
        break;
      case "30days":
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        start = last30.toISOString().split("T")[0];
        break;
      case "90days":
        const last90 = new Date(today);
        last90.setDate(today.getDate() - 90);
        start = last90.toISOString().split("T")[0];
        break;
      case "all":
        start = "";
        end = "";
        break;
    }

    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const last7Str = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0];
  const last30Str = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0];
  const last90Str = new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split("T")[0];

  const handleDownloadCSV = async () => {
    try {
      setIsExporting(true);
      const reqParams: Record<string, string> = { limit: "10000" };
      if (gateway) reqParams.gateway = gateway;
      if (status) reqParams.status = status;
      if (startDate) reqParams.startDate = startDate;
      if (endDate) reqParams.endDate = endDate;

      const res = await api.get('/payments/transactions', { params: reqParams });
      
      const exportData = res.data?.data || [];
      if (exportData.length === 0) {
        alert("No data available to export for the selected filters.");
        return;
      }

      const headers = ['ID', 'Order', 'Customer', 'Gateway', 'Method', 'Amount (Rs)', 'Status', 'Date', 'Time'];
      const csvContent = [
        headers.join(','),
        ...exportData.map((t: any) => [
          `"${t.id}"`,
          `"${t.order}"`,
          `"${t.customer}"`,
          `"${t.gateway}"`,
          `"${t.method}"`,
          t.amount,
          `"${t.status}"`,
          `"${t.date}"`,
          `"${t.created}"`
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export Error:", e);
      alert('Failed to generate CSV. Please ensure the backend is running.');
    } finally {
      setIsExporting(false);
    }
  };

  const getQuickSelectVariant = (rangeStart: string, rangeEnd: string) => {
    return startDate === rangeStart && endDate === rangeEnd ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200";
  };

  const bottomRow = (
    <>
      <div className="flex items-center gap-2 flex-wrap flex-1">
        <button onClick={() => handleDateQuickSelect("all")} className={`px-3 py-1.5 rounded-md text-xs font-inter font-medium transition-colors ${getQuickSelectVariant("", "")}`}>All Time</button>
        <button onClick={() => handleDateQuickSelect("today")} className={`px-3 py-1.5 rounded-md text-xs font-inter font-medium transition-colors ${getQuickSelectVariant(todayStr, todayStr)}`}>Today</button>
        <button onClick={() => handleDateQuickSelect("7days")} className={`px-3 py-1.5 rounded-md text-xs font-inter font-medium transition-colors ${getQuickSelectVariant(last7Str, todayStr)}`}>Last 7 Days</button>
        <button onClick={() => handleDateQuickSelect("30days")} className={`px-3 py-1.5 rounded-md text-xs font-inter font-medium transition-colors ${getQuickSelectVariant(last30Str, todayStr)}`}>Last 30 Days</button>
        <button onClick={() => handleDateQuickSelect("90days")} className={`px-3 py-1.5 rounded-md text-xs font-inter font-medium transition-colors ${getQuickSelectVariant(last90Str, todayStr)}`}>Last 90 Days</button>
      </div>

      <div className="flex items-center gap-3 bg-stone-50 p-1.5 rounded-lg border border-stone-200 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-inter text-stone-500 font-medium whitespace-nowrap pl-2">Custom Range:</span>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="bg-white border border-stone-200 rounded-md py-1.5 px-2 text-xs font-inter text-stone-700 outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
        <span className="text-stone-300">-</span>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={endDate} 
            onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="bg-white border border-stone-200 rounded-md py-1.5 px-2 text-xs font-inter text-stone-700 outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
      </div>
    </>
  );

  const filters = (
    <>
      <select 
        value={gateway}
        onChange={e => { setGateway(e.target.value); setPage(1); }}
        className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-inter text-stone-700 outline-none focus:ring-1 focus:ring-stone-400 max-w-[140px]"
      >
        <option value="">All Gateways</option>
        <option value="COD">COD</option>
        <option value="Koko">Koko</option>
        <option value="Mintpay">Mintpay</option>
        <option value="Payzy">Payzy</option>
        <option value="OnePay">OnePay</option>
        <option value="MANUAL">Manual POS</option>
      </select>

      <select 
        value={status} 
        onChange={e => { setStatus(e.target.value); setPage(1); }}
        className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-inter text-stone-700 outline-none focus:ring-1 focus:ring-stone-400"
      >
        <option value="">All Statuses</option>
        <option value="Paid">Paid</option>
        <option value="Pending">Pending</option>
        <option value="Failed">Failed</option>
      </select>
    </>
  );

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-8">
      
      <PageHeader 
        title="Finance Center" 
        description="Comprehensive dashboard for revenue tracking, gateway health, and financial accounting."
      />

      {/* Main Tabs */}
      <div className="flex border-b border-stone-200 mb-2">
        {mainTabs.map(tab => (
          <button 
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-6 py-3 font-inter text-sm font-medium transition-colors ${
              activeTab === tab 
                ? "border-b-2 border-primary text-primary" 
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Total Collected" value={`Rs. ${kpis.totalAmount.toLocaleString()}`} trendType="positive" />
            <StatCard label="Pending Receivables" value={`Rs. ${kpis.pendingAmount.toLocaleString()}`} />
            <StatCard label="Total Transactions" value={(parseInt(kpis.successfulCount) + parseInt(kpis.pendingCount) + parseInt(kpis.failedCount)).toString()} />
            <StatCard label="Success Rate" value={`${kpis.successRate}%`} trendType={kpis.successRate >= 90 ? "positive" : "neutral"} />
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-inter font-semibold text-stone-800 mb-6 text-lg">Revenue Over Time</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpis.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#78716c'}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `Rs.${val/1000}k`} tick={{fontSize: 12, fill: '#78716c'}} axisLine={false} tickLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <Tooltip 
                    formatter={(value: any) => `Rs. ${Number(value).toLocaleString()}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  <Area type="monotone" name="Collected Revenue" dataKey="collected" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCollected)" />
                  <Area type="monotone" name="Pending Receivables" dataKey="pending" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorPending)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Transactions" && (
        <div className="flex flex-col gap-4">
          <FilterBar 
            placeholder="Search transactions, order number, customer..." 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            bottomRow={bottomRow}
          />

          <DataTable 
            data={transactions}
            columns={columns}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => router.push(`/admin/payments/${row.id}`)}
            pagination={{ 
              currentPage: meta.page, 
              totalPages: meta.totalPages || 1,
              onPageChange: (newPage) => setPage(newPage)
            }}
          />
        </div>
      )}

      {activeTab === "Gateways" && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <h3 className="font-inter font-semibold text-stone-800 mb-6 text-lg self-start">Volume by Gateway</h3>
              {kpis.gatewayData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={kpis.gatewayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {kpis.gatewayData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={GATEWAY_COLORS[entry.name] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `Rs. ${Number(value).toLocaleString()}`} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-stone-500 font-inter text-sm">No data available</div>
              )}
            </div>

            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-200">
                <h3 className="font-inter font-semibold text-stone-800 text-lg">Gateway Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="py-3 px-6 text-xs font-semibold text-stone-600 uppercase tracking-wider">Gateway</th>
                      <th className="py-3 px-6 text-xs font-semibold text-stone-600 uppercase tracking-wider text-right">Transactions</th>
                      <th className="py-3 px-6 text-xs font-semibold text-stone-600 uppercase tracking-wider text-right">Collected Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.gatewayData.map((entry: any, i: number) => (
                      <tr key={i} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-stone-900 flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GATEWAY_COLORS[entry.name] || '#94a3b8' }}></span>
                          {entry.name}
                        </td>
                        <td className="py-4 px-6 text-sm text-stone-600 text-right">{entry.transactions}</td>
                        <td className="py-4 px-6 text-sm font-medium text-stone-900 text-right">Rs. {entry.value.toLocaleString()}</td>
                      </tr>
                    ))}
                    {kpis.gatewayData.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-sm text-stone-500">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Reports" && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3 className="font-inter font-bold text-stone-900 text-xl mb-2">Financial Accounting Reports</h3>
          <p className="text-stone-500 max-w-md mb-6">Generate and download comprehensive CSV reports of all transactions, refunds, and net revenue for accounting software integration.</p>
          <button 
            onClick={handleDownloadCSV}
            disabled={isExporting}
            className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Generating...
              </>
            ) : "Generate CSV Report"}
          </button>
        </div>
      )}
    </div>
  );
}
