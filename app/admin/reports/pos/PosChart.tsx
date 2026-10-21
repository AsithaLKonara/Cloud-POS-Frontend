"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PosChartProps {
  data: any[];
}

export default function PosChart({ data }: PosChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
          <XAxis dataKey="terminalName" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val/1000}k`} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)' }}
            itemStyle={{ color: 'var(--foreground)' }}
            formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Revenue']}
          />
          <defs>
            <linearGradient id="colorPosRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C987" stopOpacity={1}/>
              <stop offset="100%" stopColor="#42C0C8" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <Bar dataKey="revenue" fill="url(#colorPosRevenue)" radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
