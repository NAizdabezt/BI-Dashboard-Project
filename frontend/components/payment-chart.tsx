"use client"

import React, { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

// 👇 1. KẾT NỐI VỚI HỆ THỐNG TIỀN TỆ TRUNG TÂM 👇
import { useCurrency } from "@/contexts/CurrencyContext"

interface PaymentData {
  name: string
  value: number
  category: string
}

// Bảng màu hiện đại cho biểu đồ
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// HÀM TÍNH TOÁN VÀ VẼ PHẦN TRĂM LÊN BÁNH DONUT
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central" 
      fontSize={12} 
      fontWeight="bold"
      className="drop-shadow-md" 
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export function PaymentChart({ startDate, endDate, category }: { startDate: string, endDate: string, category: string }) {
  const [data, setData] = useState<PaymentData[]>([])
  const [loading, setLoading] = useState(true)

  // 👇 2. GỌI HÀM FORMAT TIỀN TỆ 👇
  const { formatMoney } = useCurrency()

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true) 
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        const response = await fetch(`${baseUrl}/api/charts/payment-methods?start_date=${startDate}&end_date=${endDate}&category=${category}`)
        if (!response.ok) throw new Error("Failed to fetch")
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    if (startDate && endDate) {
      fetchPayments()
    }
  }, [startDate, endDate, category])

  if (loading) return <div className="flex h-[300px] items-center justify-center text-sm text-slate-500 animate-pulse bg-slate-50 dark:bg-slate-900/20 rounded-lg">Đang phân tích phương thức thanh toán...</div>
  if (!data || data.length === 0) return <div className="flex h-[300px] items-center justify-center text-muted-foreground">Không có dữ liệu trong kỳ này</div>

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
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            // 👇 3. ĐÃ SỬA: Gắn ống nước tiền tệ vào Tooltip 👇
            formatter={(value: any, name: any) => [formatMoney(Number(value)), name]}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}