"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"

interface TopState {
  state: string
  revenue: number
  orders: number
}

export function TopStateChart() {
  const [data, setData] = useState<TopState[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopStates = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/charts/top-states") 
        if (!response.ok) throw new Error("Failed to fetch states")
        const states: TopState[] = await response.json()
        setData(states)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTopStates()
  }, [])

  if (loading) return <div className="flex h-[300px] items-center justify-center text-muted-foreground">Đang tải dữ liệu bang...</div>

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="state" />
          <YAxis tickFormatter={(value) => `R$${value / 1000}k`} />
          
          {/* === ĐÃ SỬA TOOLTIP === */}
          <Tooltip 
            // 1. Sửa 'revenue' thành 'Doanh thu'
            formatter={(value: any) => [`R$ ${Number(value).toLocaleString()}`, "Doanh thu"]}
            labelFormatter={(label) => `Bang: ${label}`}
            // 2. Ép cứng màu chữ (color: "#374151") để không bị chìm khi hover
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: "white", padding: "10px" }}
            itemStyle={{ color: "#374151", fontSize: "12px" }}
            labelStyle={{ color: "#374151", fontWeight: "bold", marginBottom: "4px" }}
          />
          
          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}