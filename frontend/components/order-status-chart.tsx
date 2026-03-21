"use client"

import React, { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface StatusData { name: string; value: number }

// Xanh lá (Thành công), Đỏ (Hủy), Vàng (Đang giao)
const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6b7280']

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.03) return null; // Ẩn chữ nếu tỷ lệ quá nhỏ
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold" className="drop-shadow-md">
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export function OrderStatusChart() {
  const [data, setData] = useState<StatusData[]>([])
  
  useEffect(() => {
    fetch("https://bi-dashboard-project.onrender.com/api/charts/order-status")
      .then(res => res.json()).then(setData).catch(console.error)
  }, [])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none" labelLine={false} label={renderCustomizedLabel}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(value: any) => `${value.toLocaleString()} đơn`} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}