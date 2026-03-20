"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"

interface RevenueData {
  date: string
  revenue: number
}

// 1. Thêm định nghĩa Props để nhận dữ liệu từ trang chủ (page.tsx)
interface RevenueChartProps {
  startDate: string
  endDate: string
}

export function RevenueChart({ startDate, endDate }: RevenueChartProps) {
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true) // Bật loading mỗi khi lọc lại ngày
      try {
        // 2. Cập nhật URL để gửi kèm tham số lọc ngày lên Backend Python
        const response = await fetch(
          `http://localhost:8000/api/revenue/daily?start_date=${startDate}&end_date=${endDate}`
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
  }, [startDate, endDate]) // 3. QUAN TRỌNG: Lắng nghe sự thay đổi của ngày để tải lại dữ liệu

  if (loading) {
    return <div className="flex h-[350px] items-center justify-center text-sm text-gray-500">Đang cập nhật dữ liệu...</div>
  }

  if (error) {
    return <div className="flex h-[350px] items-center justify-center text-sm text-red-500">{error}</div>
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
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
            tickFormatter={(value) => `R$${value / 1000}k`} // Rút gọn đơn vị nghìn cho đỡ chật trục Y
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            // Sửa lỗi hiển thị doanh thu chuyên nghiệp hơn
            formatter={(value: any) => [`R$ ${Number(value).toLocaleString()}`, "Doanh thu"]}
            labelStyle={{ color: 'black', fontWeight: 'bold', marginBottom: '4px' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}