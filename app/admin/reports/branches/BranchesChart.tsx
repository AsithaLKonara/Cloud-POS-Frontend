"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BranchesChartProps {
  data: any[];
}

export default function BranchesChart({ data }: BranchesChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
          <defs>
            <linearGradient id="colorBranchRev" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00C987" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#42C0C8" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
          <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val/1000}k`} />
          <YAxis dataKey="branchName" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={120} />
          <Tooltip 
            cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
            contentStyle={{ borderRadius: '8px', backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)' }}
            itemStyle={{ color: 'var(--foreground)' }}
            formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, "Revenue"]}
          />
          <Bar dataKey="revenue" fill="url(#colorBranchRev)" radius={[0, 4, 4, 0]} barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
