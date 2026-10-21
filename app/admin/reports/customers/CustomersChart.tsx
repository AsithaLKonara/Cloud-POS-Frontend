"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CustomersChartProps {
  data: any[];
}

export default function CustomersChart({ data }: CustomersChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
          <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val/1000}k`} />
          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={100} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)' }}
            itemStyle={{ color: 'var(--foreground)' }}
            formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Lifetime Spent']}
          />
          <defs>
            <linearGradient id="colorSpent" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00C987" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#42C0C8" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <Bar dataKey="spent" fill="url(#colorSpent)" radius={[0, 4, 4, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
