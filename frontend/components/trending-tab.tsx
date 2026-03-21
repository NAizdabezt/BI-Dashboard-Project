"use client"

import React, { useEffect, useState } from "react"
import { useFilters } from "@/contexts/FilterContext"
import { Flame, ArrowUpRight } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"

interface TrendingCategory {
  name: string
  value: number
}

export function TrendingTab() {
  const { startDate, endDate, category } = useFilters()
  const [data, setData] = useState<TrendingCategory[]>([])
  const [loading, setLoading] = useState(true)

  const { formatMoney } = useCurrency()

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        // Dùng lại API top-categories nhưng dùng UI khác để thể hiện Xu hướng
        const response = await fetch(`${baseUrl}/api/charts/top-categories?start_date=${startDate}&end_date=${endDate}&category=${category}`)
        if (response.ok) {
          setData(await response.json())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrends()
  }, [startDate, endDate, category])

  if (loading) return <div className="h-[350px] flex items-center justify-center animate-pulse text-slate-400">Đang phân tích xu hướng thị trường...</div>
  if (!data.length) return <div className="h-[350px] flex items-center justify-center text-slate-400">Không có dữ liệu xu hướng.</div>

  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Danh mục thịnh hành</h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((item, idx) => {
          const percent = (item.value / maxValue) * 100
          return (
            <div key={item.name} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                  {idx < 3 && <span className="flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 uppercase"><ArrowUpRight className="h-3 w-3 mr-0.5"/> Hot</span>}
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {formatMoney(item.value)}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}