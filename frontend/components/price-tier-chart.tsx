"use client"

import React, { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface TierData { tier: string; revenue: number }

export function PriceTierChart() {
  const [data, setData] = useState<TierData[]>([])

  useEffect(() => {
    fetch("https://bi-dashboard-project.onrender.com/api/charts/price-tiers")
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="tier" tick={{fontSize: 12}} />
          <YAxis tickFormatter={(val) => `${val / 1000000}M`} width={50} />
          
          {/* === ĐÃ SỬA TOOLTIP === */}
          <Tooltip 
            // Trả về một mảng [Giá trị, Tên hiển thị]
            formatter={(value: any) => [`R$ ${Number(value).toLocaleString()}`, "Doanh thu"]}
            labelFormatter={(label) => `Chi tiết: ${label}`}
            contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                backgroundColor: "white", 
                padding: "10px" 
            }}
            itemStyle={{ color: "#374151", fontSize: "12px" }}
            labelStyle={{ color: "#374151", fontWeight: "bold", marginBottom: "4px" }}
            />
          <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={80} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}