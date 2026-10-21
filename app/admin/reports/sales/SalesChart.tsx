"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SalesChartProps {
  data: any[];
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorEcom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00C987" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#00C987" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#42C0C8" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#42C0C8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val/1000}k`} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)' }}
            itemStyle={{ color: 'var(--foreground)' }}
            labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
            formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, undefined]}
          />
          <Legend iconType="circle" />
          <Area type="monotone" name="Ecommerce" dataKey="ecommerceRevenue" stroke="#00C987" fillOpacity={1} fill="url(#colorEcom)" strokeWidth={2} activeDot={{ r: 8 }} />
          <Area type="monotone" name="POS" dataKey="posRevenue" stroke="#42C0C8" fillOpacity={1} fill="url(#colorPos)" strokeWidth={2} activeDot={{ r: 8 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
