"use client";

import React, { useState } from "react";
import { Download, ChevronDown, TrendingUp } from "lucide-react";
import {
  MonthlyAnalyticsSeriesItem,
  PlatformRevenueBreakdownResponse,
  PlatformRevenueStream,
} from "@/services/superadmin.service";

interface SuperAdminChartsProps {
  series?: MonthlyAnalyticsSeriesItem[];
  breakdown?: PlatformRevenueBreakdownResponse;
  mrrLkr?: number;
  totalGmvLkr?: number;
}

export function SalesPerformanceChart({
  series = [],
  mrrLkr = 0,
  totalGmvLkr = 0,
}: SuperAdminChartsProps) {
  const [period, setPeriod] = useState("Last 12 mon");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter series based on selected period
  const displayData = React.useMemo(() => {
    if (!series || series.length === 0) {
      // Default empty 12 months array
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months.map((m) => ({
        month: m,
        monthKey: m,
        revenueLkr: 0,
        gmvLkr: 0,
        orderCount: 0,
        newTenantsCount: 0,
      }));
    }
    if (period === "Last 6 mon") {
      return series.slice(-6);
    }
    if (period === "Year to Date") {
      const currentYear = new Date().getFullYear();
      const ytd = series.filter((d) => d.monthKey.startsWith(String(currentYear)));
      return ytd.length > 0 ? ytd : series.slice(-6);
    }
    return series.slice(-12);
  }, [series, period]);

  // Compute scale ceiling (minimum Rs. 50,000 for aesthetic proportions)
  const maxRevenue = React.useMemo(() => {
    const highest = Math.max(...displayData.map((d) => d.revenueLkr), mrrLkr, 50000);
    // Round up to nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(highest)));
    return Math.ceil(highest / magnitude) * magnitude;
  }, [displayData, mrrLkr]);

  // Generate SVG path coordinates
  const n = displayData.length;
  const coords = displayData.map((d, i) => {
    const x = n > 1 ? (i / (n - 1)) * 500 + 40 : 290;
    // Base line at y = 140, ceiling at y = 20 (height = 120)
    const ratio = Math.min(Math.max(d.revenueLkr / maxRevenue, 0), 1);
    const y = 140 - ratio * 120;
    return { x, y, data: d };
  });

  const points = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaPath =
    coords.length > 0
      ? `M ${coords[0].x},140 L ${coords[0].x},${coords[0].y} ${coords
          .slice(1)
          .map((c) => `L ${c.x},${c.y}`)
          .join(" ")} L ${coords[coords.length - 1].x},140 Z`
      : "";

  return (
    <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Sales Performance
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monthly recurring SaaS inflows vs targets (Real PostgreSQL time-series)
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
                "Month,MonthKey,MRR_LKR,GMV_LKR,Orders\n" +
                displayData
                  .map(
                    (d) =>
                      `${d.month},${d.monthKey},${d.revenueLkr},${d.gmvLkr},${d.orderCount}`
                  )
                  .join("\n");
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
          <line x1="40" y1="50" x2="560" y2="50" stroke="#1F2329" strokeDasharray="3 3" />
          <line x1="40" y1="80" x2="560" y2="80" stroke="#1F2329" strokeDasharray="3 3" />
          <line x1="40" y1="110" x2="560" y2="110" stroke="#1F2329" strokeDasharray="3 3" />
          <line x1="40" y1="140" x2="560" y2="140" stroke="#2B3037" />

          {/* Y Axis Labels */}
          <text x="34" y="24" textAnchor="end" className="text-[10px] fill-zinc-500 font-mono">
            Rs. {Math.round(maxRevenue >= 1000 ? maxRevenue / 1000 : maxRevenue)}K
          </text>
          <text x="34" y="54" textAnchor="end" className="text-[10px] fill-zinc-500 font-mono">
            Rs. {Math.round((maxRevenue * 0.75) / 1000)}K
          </text>
          <text x="34" y="84" textAnchor="end" className="text-[10px] fill-zinc-500 font-mono">
            Rs. {Math.round((maxRevenue * 0.5) / 1000)}K
          </text>
          <text x="34" y="114" textAnchor="end" className="text-[10px] fill-zinc-500 font-mono">
            Rs. {Math.round((maxRevenue * 0.25) / 1000)}K
          </text>
          <text x="34" y="144" textAnchor="end" className="text-[10px] fill-zinc-500 font-mono">
            Rs. 0
          </text>

          {/* Filled Area */}
          {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

          {/* Smooth Line */}
          {points && (
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          )}

          {/* Interactive Data Dots & X Axis Labels */}
          {coords.map((c, idx) => {
            const isHovered = hoverIndex === idx;

            return (
              <g
                key={c.data.monthKey || c.data.month}
                className="cursor-pointer group"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 5 : 3.5}
                  className={`${
                    isHovered
                      ? "fill-white stroke-[#3B82F6] stroke-2"
                      : "fill-[#3B82F6] group-hover:fill-white"
                  } transition-all`}
                />
                <text
                  x={c.x}
                  y="160"
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    isHovered ? "fill-white font-bold" : "fill-zinc-500"
                  }`}
                >
                  {c.data.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && coords[hoverIndex] && (
          <div
            className="absolute -top-3 pointer-events-none p-2.5 rounded-lg bg-[#181A1D] border border-[#2B3037] shadow-xl text-left transform -translate-x-1/2 z-10"
            style={{
              left: `${(hoverIndex / (coords.length - 1)) * 84 + 8}%`,
            }}
          >
            <span className="text-[10px] text-zinc-400 block font-mono">
              {coords[hoverIndex].data.month} ({coords[hoverIndex].data.monthKey})
            </span>
            <span className="text-xs font-bold text-white block font-mono">
              Rs. {coords[hoverIndex].data.revenueLkr.toLocaleString()} MRR
            </span>
            <span className="text-[10px] text-emerald-400 block font-mono">
              Rs. {coords[hoverIndex].data.gmvLkr.toLocaleString()} GMV
            </span>
            <span className="text-[10px] text-zinc-400 block font-mono">
              {coords[hoverIndex].data.orderCount} Orders • {coords[hoverIndex].data.newTenantsCount} New Tenants
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RevenueBreakdownChart({
  breakdown,
  mrrLkr = 0,
}: SuperAdminChartsProps) {
  const [selectedSource, setSelectedSource] = useState("all");

  const streams = React.useMemo(() => {
    if (breakdown?.streams && breakdown.streams.length > 0) {
      return breakdown.streams;
    }
    return [
      {
        id: "subscriptions",
        name: "Subscriptions",
        amountLkr: mrrLkr,
        pct: 100,
        color: "#3B82F6",
        dotClass: "bg-blue-500",
      },
      {
        id: "gateway",
        name: "One-time Sales (0.5% Gateway)",
        amountLkr: 0,
        pct: 0,
        color: "#10B981",
        dotClass: "bg-emerald-500",
        highlight: true,
      },
      {
        id: "branches",
        name: "Branch Addons",
        amountLkr: 0,
        pct: 0,
        color: "#F59E0B",
        dotClass: "bg-amber-500",
      },
      {
        id: "services",
        name: "Partnerships & APIs",
        amountLkr: 0,
        pct: 0,
        color: "#8B5CF6",
        dotClass: "bg-purple-500",
      },
    ];
  }, [breakdown, mrrLkr]);

  const totalInflow = breakdown?.totalInflowLkr ?? mrrLkr;

  // Compute SVG Donut Segment Arcs dynamically based on real percentages
  const C = 2 * Math.PI * 38; // 238.76 circumference
  const arcs = React.useMemo(() => {
    let accumulatedPct = 0;
    return streams
      .filter((s) => s.pct > 0)
      .map((s) => {
        const arcLength = (s.pct / 100) * C;
        const offset = -(accumulatedPct / 100) * C;
        accumulatedPct += s.pct;
        return {
          ...s,
          arcLength,
          offset,
        };
      });
  }, [streams, C]);

  return (
    <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Revenue Breakdown
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time platform distribution by source (PostgreSQL live)
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

            {/* Dynamic circle segments */}
            {arcs.map((arc) => (
              <circle
                key={arc.id}
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke={arc.color}
                strokeWidth="10"
                strokeDasharray={`${arc.arcLength.toFixed(1)} ${(C - arc.arcLength).toFixed(1)}`}
                strokeDashoffset={arc.offset.toFixed(1)}
                className="transition-all duration-500"
              />
            ))}
          </svg>

          {/* Center KPI */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-black text-white font-mono tracking-tight">
              Rs. {Math.round(totalInflow / 1000)}K
            </span>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
              Inflow
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
