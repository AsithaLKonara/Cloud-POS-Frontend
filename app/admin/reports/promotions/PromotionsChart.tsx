"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PromotionsChartProps {
  data: any[];
}

export default function PromotionsChart({ data }: PromotionsChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)' }}
            itemStyle={{ color: 'var(--foreground)' }}
          />
          <Legend iconType="circle" />
          <Bar dataKey="Issued" fill="#00C987" radius={[4, 4, 0, 0]} maxBarSize={50} />
          <Bar dataKey="Used" fill="#42C0C8" radius={[4, 4, 0, 0]} maxBarSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
