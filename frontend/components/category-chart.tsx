"use client"

import React, { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useCurrency } from "@/contexts/CurrencyContext"

interface CategoryData {
  name: string
  value: number
}

// 👇 1. ĐÃ SỬA: Rút category ra khỏi Props, chỉ giữ lại Ngày tháng 👇
interface CategoryChartProps {
  startDate: string
  endDate: string
}

export function CategoryChart({ startDate, endDate }: CategoryChartProps) {
  const [data, setData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  
  const { formatMoney } = useCurrency()
  
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        // 👇 2. ĐÃ SỬA: Rút category ra khỏi link gọi API 👇
        const response = await fetch(`${baseUrl}/api/charts/top-categories?start_date=${startDate}&end_date=${endDate}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCategories()
  }, [startDate, endDate]) // 👇 3. ĐÃ SỬA: Rút category ra khỏi mảng lắng nghe 👇

  if (loading) return <div className="flex h-[350px] items-center justify-center text-muted-foreground animate-pulse bg-slate-50 dark:bg-slate-900/20 rounded-lg">Đang phân tích danh mục...</div>
  if (!data.length) return <div className="flex h-[350px] items-center justify-center text-muted-foreground">Không có dữ liệu cho khoảng thời gian này</div>

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-slate-800" />
          
          <XAxis 
            type="number" 
            tickFormatter={(value) => formatMoney(value, true)} 
            tick={{ fill: '#888888', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} 
            width={110} 
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => val.length > 15 ? val.substring(0, 13) + '...' : val}
          />
          
          <Tooltip 
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as CategoryData
                return (
                  <div className="rounded-lg border bg-white dark:bg-slate-950 p-3 shadow-md border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Danh mục</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] leading-tight">
                        {item.name}
                      </span>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-slate-500">Doanh thu mang lại</span>
                          <span className="text-sm font-bold text-sky-500 dark:text-sky-400 whitespace-nowrap">
                            {formatMoney(item.value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          
          <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}