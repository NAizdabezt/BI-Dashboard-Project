"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"
import { useCurrency } from "@/contexts/CurrencyContext"

interface RevenueData {
  date: string
  revenue: number
}

interface RevenueChartProps {
  startDate: string
  endDate: string
  category: string 
}

export function RevenueChart({ startDate, endDate, category }: RevenueChartProps) {
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 👇 2. GỌI HÀM FORMAT TIỀN TỆ 👇
  const { formatMoney } = useCurrency()

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true) 
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"

        const response = await fetch(
          `${baseUrl}/api/revenue/daily?start_date=${startDate}&end_date=${endDate}&category=${category}`
        )
        
        if (!response.ok) throw new Error("Failed to fetch historical data")
        const historical: RevenueData[] = await response.json()
        setData(historical)
      } catch (err) {
        setError("Lỗi kết nối đến máy chủ Backend")
      } finally {
        setLoading(false)
      }
    }

    fetchRevenue()
  }, [startDate, endDate, category]) 

  if (loading) {
    return <div className="flex h-[350px] items-center justify-center text-sm text-slate-500 animate-pulse bg-slate-50 dark:bg-slate-900/20 rounded-lg">Đang phân tích doanh thu...</div>
  }

  if (error) {
    return <div className="flex h-[350px] items-center justify-center text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg">{error}</div>
  }

  if (data.length === 0) {
    return <div className="flex h-[350px] items-center justify-center text-sm text-slate-500">Không có dữ liệu doanh thu cho bộ lọc này</div>
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            minTickGap={15} 
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            // 👇 3. ĐÃ SỬA: Dùng chế độ compact=true để rút gọn (vd: 15k, 2M, 5Tr) tự động 👇
            tickFormatter={(value) => formatMoney(value, true)} 
            width={65} // Mở rộng nhẹ trục Y để nhường chỗ cho chữ "k ₫" nếu dùng tiền Việt
          />
          <Tooltip
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} 
            // 👇 4. ĐÃ SỬA: Áp dụng formatMoney chuẩn khi hover chuột 👇
            formatter={(value: any) => [formatMoney(Number(value)), "Doanh thu"]}
            labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}