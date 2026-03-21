"use client"

import React, { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useCurrency } from "@/contexts/CurrencyContext"

interface SellerData {
  name: string
  value: number
}

// 1. ĐÃ SỬA: Thêm category vào Props để nhận bộ lọc
interface SellerChartProps {
  startDate: string
  endDate: string
  category: string 
}

export function SellerChart({ startDate, endDate, category }: SellerChartProps) {
  const [data, setData] = useState<SellerData[]>([])
  const [loading, setLoading] = useState(true)

  const { formatMoney } = useCurrency()

  useEffect(() => {
    const fetchSellers = async () => {
      setLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        
        // 2. ĐÃ SỬA: Nối category vào URL API
        const response = await fetch(`${baseUrl}/api/charts/seller-performance?start_date=${startDate}&end_date=${endDate}&category=${category}`)
        
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
    
    if (startDate && endDate) {
      fetchSellers()
    }
  }, [startDate, endDate, category]) // 3. ĐÃ SỬA: Thêm category vào để tự load lại khi đổi danh mục

  if (loading) return <div className="flex h-[350px] items-center justify-center text-muted-foreground animate-pulse bg-slate-50 dark:bg-zinc-900/20 rounded-lg">Đang phân tích hiệu suất Seller...</div>
  
  if (!data || data.length === 0) return <div className="flex h-[350px] items-center justify-center text-muted-foreground">Không có dữ liệu bán hàng cho danh mục này</div>

  return (
    <div className="h-[350px] w-full"> 
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
          
          {/* ĐÃ SỬA: Chuyển màu nét đứt lưới cho tương thích Dark Mode */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
          
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#888888', fontSize: 12, fontWeight: 600 }} 
            axisLine={false}
            tickLine={false}
          />
          
          <YAxis 
            // ĐÃ SỬA: Format lại thành k (nghìn) để số tiền không đè ra ngoài biểu đồ
            tickFormatter={(value) => formatMoney(value, true)} 
            tick={{ fill: '#888888', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
            width={60}
          />
          
          {/* ĐÃ SỬA: Fix lỗi mờ chữ bằng labelStyle và itemStyle */}
          <Tooltip 
            formatter={(value: any) => [formatMoney(value), "Doanh thu"]}
            // Ép màu chữ tiêu đề thành Xanh đậm/Đen
            labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
            // Ép màu chữ con số thành màu tím của cột
            itemStyle={{ color: '#8b5cf6', fontWeight: '600' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'white' }}
            // Cursor (nền nhạt khi hover) tương thích Dark mode
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
          />
          
          <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}