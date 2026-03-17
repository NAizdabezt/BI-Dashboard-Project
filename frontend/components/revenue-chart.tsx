"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

interface RevenueData {
  date: string
  revenue: number
}

export function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/revenue/daily")
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
  }, [])

  if (loading) {
    return <div className="flex h-[350px] items-center justify-center text-sm text-gray-500">Đang tải dữ liệu biểu đồ...</div>
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
            tickFormatter={(value) => `R$${value}`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            formatter={(value: any) => [`R$ ${value}`, "Doanh thu"]}
            labelStyle={{ color: 'black', fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}