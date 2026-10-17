"use client";

import React, { useState } from "react";
import { Download, ChevronDown, TrendingUp } from "lucide-react";

interface SuperAdminChartsProps {
  mrrLkr?: number;
  totalGmvLkr?: number;
}

export function SalesPerformanceChart({
  mrrLkr = 248500,
  totalGmvLkr = 18450200,
}: SuperAdminChartsProps) {
  const [period, setPeriod] = useState("Last 12 mon");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 12 Months data points (normalized to 100 for SVG height)
  const monthlyData = [
    { month: "Jan", revenue: 95000, gmv: 7400000, y: 78 },
    { month: "Feb", revenue: 112000, gmv: 8900000, y: 72 },
    { month: "Mar", revenue: 128000, gmv: 10200000, y: 65 },
    { month: "Apr", revenue: 135000, gmv: 11500000, y: 62 },
    { month: "May", revenue: 149000, gmv: 12800000, y: 56 },
    { month: "Jun", revenue: 168000, gmv: 13900000, y: 48 },
    { month: "Jul", revenue: 182000, gmv: 15100000, y: 42 },
    { month: "Aug", revenue: 195000, gmv: 16200000, y: 36 },
    { month: "Sep", revenue: 212000, gmv: 16900000, y: 28 },
    { month: "Oct", revenue: 228000, gmv: 17500000, y: 22 },
    { month: "Nov", revenue: 239000, gmv: 18100000, y: 16 },
    { month: "Dec", revenue: mrrLkr || 248500, gmv: totalGmvLkr || 18450200, y: 12 },
  ];

  // Generate SVG path points
  const points = monthlyData
    .map((d, i) => `${(i / (monthlyData.length - 1)) * 500 + 40},${d.y + 20}`)
    .join(" ");

  const areaPath = `M 40,160 L 40,${monthlyData[0].y + 20} ${points.replace(
    /^[0-9]+,[0-9]+ /,
    ""
  )} L 540,160 Z`;

  return (
    <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Sales Performance
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monthly recurring SaaS inflows vs targets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none h-8 pl-3 pr-7 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option>Last 12 mon</option>
              <option>Last 6 mon</option>
              <option>Year to Date</option>
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
          </div>

          <button
            onClick={() => {
              const csv =
                "Month,MRR_LKR,GMV_LKR\n" +
                monthlyData.map((d) => `${d.month},${d.revenue},${d.gmv}`).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "xonit-platform-sales-performance.csv";
              a.click();
            }}
            className="h-8 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] hover:bg-[#20242A] text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <Download size={12} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* SVG Responsive Area Chart */}
      <div className="relative w-full h-[220px]">
        <svg
          viewBox="0 0 580 180"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          <line x1="40" y1="20" x2="560" y2="20" stroke="#1F2329" strokeDasharray="3 3" />
          <line x1="40" y1="55" x2="560" y2="55" stroke="#1F2329" strokeDasharray="3 3" />
          <line x1="40" y1="90" x2="560" y2="90" stroke="#1F2329" strokeDasharray="3 3" />
          <line x1="40" y1="125" x2="560" y2="125" stroke="#1F2329" strokeDasharray="3 3" />
          <line x1="40" y1="160" x2="560" y2="160" stroke="#2B3037" />

          {/* Y Axis Labels */}
          <text x="32" y="24" textAnchor="end" className="text-[10px] fill-zinc-500 font-mono">
            Rs. 250K
          </text>
          <text x="32" y="59" textAnchor="end" className="text-[10px] fill-zinc-500 font-mono">
            Rs. 180K
          </text>
          <text x="32" y="94" textAnchor="end" className="text-[10px] fill-zinc-500 font-mono">
            Rs. 120K
          </text>
          <text x="32" y="129" textAnchor="end" className="text-[10px] fill-zinc-500 font-mono">
            Rs. 60K
          </text>
          <text x="32" y="164" textAnchor="end" className="text-[10px] fill-zinc-500 font-mono">
            Rs. 0
          </text>

          {/* Filled Area */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Smooth Line */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Interactive Data Dots & X Axis Labels */}
          {monthlyData.map((d, idx) => {
            const cx = (idx / (monthlyData.length - 1)) * 500 + 40;
            const cy = d.y + 20;
            const isHovered = hoverIndex === idx;

            return (
              <g
                key={d.month}
                className="cursor-pointer group"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 3}
                  className={`${
                    isHovered
                      ? "fill-white stroke-[#3B82F6] stroke-2"
                      : "fill-[#3B82F6] group-hover:fill-white"
                  } transition-all`}
                />
                <text
                  x={cx}
                  y="176"
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    isHovered ? "fill-white font-bold" : "fill-zinc-500"
                  }`}
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && (
          <div
            className="absolute -top-3 pointer-events-none p-2 rounded-lg bg-[#181A1D] border border-[#2B3037] shadow-xl text-left transform -translate-x-1/2 z-10"
            style={{
              left: `${(hoverIndex / (monthlyData.length - 1)) * 86 + 7}%`,
            }}
          >
            <span className="text-[10px] text-zinc-400 block font-mono">
              {monthlyData[hoverIndex].month} 2026
            </span>
            <span className="text-xs font-bold text-white block font-mono">
              Rs. {monthlyData[hoverIndex].revenue.toLocaleString()} MRR
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              Rs. {(monthlyData[hoverIndex].gmv / 1000000).toFixed(2)}M GMV
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RevenueBreakdownChart({
  mrrLkr = 248500,
}: SuperAdminChartsProps) {
  const [selectedSource, setSelectedSource] = useState("all");

  const streams = [
    {
      id: "subscriptions",
      name: "Subscriptions",
      amountLkr: Math.round(mrrLkr * 0.45),
      pct: 45,
      color: "#3B82F6",
      dotClass: "bg-blue-500",
    },
    {
      id: "gateway",
      name: "One-time Sales (0.5% Gateway)",
      amountLkr: Math.round(mrrLkr * 0.3),
      pct: 30,
      color: "#10B981",
      dotClass: "bg-emerald-500",
      highlight: true,
    },
    {
      id: "branches",
      name: "Branch Addons",
      amountLkr: Math.round(mrrLkr * 0.15),
      pct: 15,
      color: "#F59E0B",
      dotClass: "bg-amber-500",
    },
    {
      id: "services",
      name: "Partnerships & APIs",
      amountLkr: Math.round(mrrLkr * 0.1),
      pct: 10,
      color: "#8B5CF6",
      dotClass: "bg-purple-500",
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Revenue Breakdown
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Revenue distribution by source
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csv =
                "Stream,Share_Pct,Amount_LKR\n" +
                streams.map((s) => `${s.name},${s.pct}%,${s.amountLkr}`).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "xonit-revenue-breakdown.csv";
              a.click();
            }}
            className="h-8 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] hover:bg-[#20242A] text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <Download size={12} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Content: Radial Gauge + Stream Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Radial SVG Donut */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
          <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#1C2025"
              strokeWidth="10"
            />
            {/* Subscriptions segment (45%) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#3B82F6"
              strokeWidth="10"
              strokeDasharray="107.4 238.7"
              strokeDashoffset="0"
            />
            {/* Gateway segment (30%) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#10B981"
              strokeWidth="10"
              strokeDasharray="71.6 238.7"
              strokeDashoffset="-107.4"
            />
            {/* Branch segment (15%) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#F59E0B"
              strokeWidth="10"
              strokeDasharray="35.8 238.7"
              strokeDashoffset="-179"
            />
            {/* API segment (10%) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#8B5CF6"
              strokeWidth="10"
              strokeDasharray="23.9 238.7"
              strokeDashoffset="-214.8"
            />
          </svg>

          {/* Center KPI */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-black text-white font-mono tracking-tight">
              Rs. {Math.round(mrrLkr / 1000)}K
            </span>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
              Revenue
            </span>
          </div>
        </div>

        {/* Legend Rows */}
        <div className="sm:col-span-7 flex flex-col gap-1.5">
          {streams.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedSource(item.id)}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                item.highlight || selectedSource === item.id
                  ? "bg-[#181A1D] border-[#2E333C] shadow-sm"
                  : "bg-transparent border-transparent hover:bg-[#141619]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full ${item.dotClass} shrink-0`} />
                <span className="text-xs font-semibold text-zinc-200 truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-white font-mono">
                  Rs. {(item.amountLkr / 1000).toFixed(1)}K
                </span>
                <span className="text-[10px] text-zinc-500 font-mono w-7 text-right">
                  {item.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
