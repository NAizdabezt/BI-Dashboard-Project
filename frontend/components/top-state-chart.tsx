"use client"

import React, { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useCurrency } from "@/contexts/CurrencyContext"
interface TopState {
  state: string
  revenue: number
  orders: number
}

// 1. ĐÃ SỬA: Thêm Props để nhận dữ liệu lọc từ Tầng Mây
interface TopStateChartProps {
  startDate: string
  endDate: string
  category: string
}

export function TopStateChart({ startDate, endDate, category }: TopStateChartProps) {
  const [data, setData] = useState<TopState[]>([])
  const [loading, setLoading] = useState(true)

  const { formatMoney } = useCurrency()

  useEffect(() => {
    const fetchTopStates = async () => {
      setLoading(true)
      try {
        // 2. ĐÃ SỬA: Tự động trỏ Link API và gắn tham số lọc
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        const response = await fetch(`${baseUrl}/api/charts/top-states?start_date=${startDate}&end_date=${endDate}&category=${category}`) 
        
        if (!response.ok) throw new Error("Failed to fetch states")
        const states: TopState[] = await response.json()
        
        // Chỉ lấy Top 10 bang có doanh thu cao nhất cho biểu đồ đỡ bị chật chội
        setData(states.slice(0, 10))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTopStates()
  }, [startDate, endDate, category]) // 3. ĐÃ SỬA: Lắng nghe sự thay đổi của danh mục/ngày

  if (loading) return <div className="flex h-[350px] items-center justify-center text-sm text-slate-500 animate-pulse bg-slate-50 dark:bg-zinc-900/20 rounded-lg">Đang phân tích dữ liệu khu vực...</div>
  if (!data || data.length === 0) return <div className="flex h-[350px] items-center justify-center text-muted-foreground">Không có dữ liệu khu vực cho bộ lọc này</div>

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          
          {/* 4. ĐÃ SỬA: Lưới nền tương thích Dark Mode */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
          
          <XAxis 
            dataKey="state" 
            tick={{ fill: '#888888', fontSize: 12, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            // Fix lại hiển thị tiền tệ cho mượt (k = nghìn)
            tickFormatter={(value) => formatMoney(value, true)} 
            tick={{ fill: '#888888', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          
          {/* 5. ĐÃ SỬA: Tooltip xịn xò, hết bị mù màu */}
          <Tooltip 
            formatter={(value: any) => [formatMoney(value), "Doanh thu"]}
            labelFormatter={(label) => `Bang: ${label}`}
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
            // Chữ số liệu màu Xanh ngọc (giống màu cột)
            itemStyle={{ color: '#10b981', fontWeight: '600' }}
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
          />
          
          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}