"use client"

import React, { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useCurrency } from "@/contexts/CurrencyContext"

interface TierData { 
  tier: string; 
  revenue: number 
}

interface PriceTierChartProps {
  startDate: string
  endDate: string
  category: string
}

export function PriceTierChart({ startDate, endDate, category }: PriceTierChartProps) {
  const [data, setData] = useState<TierData[]>([])
  const [loading, setLoading] = useState(true)

  const { formatMoney } = useCurrency()

  // 👇 HÀM MA THUẬT V2: Dùng Regex bóc tách số chống lỗi NaN 👇
  const formatTierLabel = (tierStr: string) => {
    if (!tierStr) return "";
    
    // Ép kiểu về chuỗi cho chắc ăn (tránh trường hợp API trả về số nguyên)
    const str = String(tierStr);

    // Dùng Regex tìm và gắp TẤT CẢ các con số ra khỏi chuỗi
    // VD: "R$ 50 - 100" -> ["50", "100"]
    // VD: "> 200" -> ["200"]
    const numbers = str.match(/\d+(\.\d+)?/g);

    // Nếu không tìm thấy số nào, trả về chuỗi gốc cho an toàn
    if (!numbers) return str;

    // Trường hợp có 2 số (Ví dụ: 50 đến 100)
    if (numbers.length === 2) {
      const min = Number(numbers[0]);
      const max = Number(numbers[1]);
      
      // Check kỹ lần cuối chống NaN
      if (!isNaN(min) && !isNaN(max)) {
        return `${formatMoney(min, true)} - ${formatMoney(max, true)}`;
      }
    }

    // Trường hợp có 1 số (Ví dụ: > 200, hoặc < 50)
    if (numbers.length === 1) {
      const val = Number(numbers[0]);
      
      if (!isNaN(val)) {
        if (str.includes(">") || str.includes("+")) return `> ${formatMoney(val, true)}`;
        if (str.includes("<")) return `< ${formatMoney(val, true)}`;
        return formatMoney(val, true); // Nếu chỉ có 1 số lẻ loi
      }
    }

    return str; // Fallback: Nếu mọi cách đều thất bại, trả về nguyên trạng
  }

  useEffect(() => {
    setLoading(true)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
    
    fetch(`${baseUrl}/api/charts/price-tiers?start_date=${startDate}&end_date=${endDate}&category=${category}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [startDate, endDate, category])

  if (loading) {
    return <div className="flex h-[300px] items-center justify-center text-sm text-slate-500 animate-pulse bg-slate-50 dark:bg-slate-900/20 rounded-lg">Đang phân tích phân khúc giá...</div>
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
          
          <XAxis 
            dataKey="tier" 
            // 👇 ĐÃ SỬA: Gọi hàm ma thuật để format lại cái tên trục X 👇
            tickFormatter={formatTierLabel}
            tick={{fontSize: 11, fill: '#888888'}} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tickFormatter={(val) => formatMoney(val, true)} 
            width={65}
            tick={{fontSize: 12, fill: '#888888'}} 
            axisLine={false} 
            tickLine={false}
          />
          
          <Tooltip 
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as TierData
                return (
                  <div className="rounded-lg border bg-white dark:bg-slate-950 p-3 shadow-md border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Phân khúc giá</span>
                      {/* 👇 ĐÃ SỬA: Gắn hàm format vào cả Tooltip để khi hover nó cũng dịch tên 👇 */}
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] leading-tight">
                        {formatTierLabel(item.tier)}
                      </span>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-slate-500">Doanh thu mang lại</span>
                          <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400 whitespace-nowrap">
                            {formatMoney(item.revenue)}
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
          <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}