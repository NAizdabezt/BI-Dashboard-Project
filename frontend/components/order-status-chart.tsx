"use client"

import React, { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface StatusData { name: string; value: number }

// ĐÃ SỬA: Sắp xếp lại màu cho khớp với Backend (Thành công -> Đang giao -> Hủy -> Khác)
const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280']

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.03) return null; 
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold" className="drop-shadow-md">
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

// 1. CHỈ NHẬN NGÀY THÁNG, KHÔNG NHẬN CATEGORY
interface OrderStatusChartProps {
  startDate: string;
  endDate: string;
}

export function OrderStatusChart({ startDate, endDate }: OrderStatusChartProps) {
  const [data, setData] = useState<StatusData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // 2. Tự động nhận diện môi trường
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
    
    // 3. Chỉ gắn tham số Ngày tháng vào URL
    fetch(`${baseUrl}/api/charts/order-status?start_date=${startDate}&end_date=${endDate}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [startDate, endDate]) // Lắng nghe thay đổi Ngày

  if (loading) return <div className="flex h-[300px] items-center justify-center text-sm text-slate-500 animate-pulse bg-slate-50 dark:bg-zinc-900/20 rounded-lg">Đang phân tích trạng thái đơn...</div>
  if (!data || data.length === 0) return <div className="flex h-[300px] items-center justify-center text-muted-foreground">Không có dữ liệu trong khoảng thời gian này</div>

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie 
            data={data} 
            cx="50%" 
            cy="50%" 
            innerRadius={60} 
            outerRadius={100} 
            paddingAngle={5} 
            dataKey="value" 
            stroke="none" 
            labelLine={false} 
            label={renderCustomizedLabel}
          >
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          
          {/* 4. Cập nhật Tooltip để không bị chói mù màu khi dùng Dark Mode */}
          <Tooltip 
            formatter={(value: any) => [`${Number(value).toLocaleString("en-US")} đơn`, "Số lượng"]}
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: '#0f172a', fontWeight: '600' }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}