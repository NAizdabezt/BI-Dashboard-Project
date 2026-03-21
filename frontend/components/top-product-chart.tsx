"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useEffect, useState } from "react"

interface TopProduct {
  product_name: string
  revenue: number
  orders: number
}

// 1. Thêm định nghĩa Props để nhận ngày từ page.tsx
interface TopProductProps {
  startDate: string
  endDate: string
}

export function TopProductChart({ startDate, endDate }: TopProductProps) {
  const [data, setData] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true)
      try {
        // 2. Cập nhật URL: Thêm tham số lọc thời gian gửi lên Backend
        const response = await fetch(
          `https://bi-dashboard-project.onrender.com/api/products/top?limit=5&start_date=${startDate}&end_date=${endDate}`
        )
        if (!response.ok) throw new Error("Failed to fetch products")
        
        const products: TopProduct[] = await response.json()
        
        // Làm sạch tên sản phẩm (Xóa các mã hash nếu có)
        const cleanedProducts = products.map(p => ({
          ...p,
          product_name: p.product_name.replace(/\s*\(#[a-f0-9]+\)\s*/gi, '')
        }))
        
        setData(cleanedProducts)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi kết nối Backend")
      } finally {
        setLoading(false)
      }
    }

    fetchTopProducts()
  }, [startDate, endDate]) // 3. Tải lại dữ liệu mỗi khi chọn ngày mới

  if (loading) {
    return <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">Đang lọc sản phẩm...</div>
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="horizontal" margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis
            dataKey="product_name"
            hide // Ẩn nhãn trục X vì tên sản phẩm quá dài, xem qua Tooltip sẽ đẹp hơn
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${value / 1000}k`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as TopProduct
                return (
                  <div className="rounded-lg border bg-white dark:bg-zinc-950 p-3 shadow-md border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Sản phẩm</span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 max-w-[200px] leading-tight">
                        {item.product_name}
                      </span>
                      <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-muted-foreground">Doanh thu</span>
                          <span className="text-sm font-bold text-blue-600">R$ {item.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-muted-foreground">Đơn hàng</span>
                          <span className="text-sm font-bold text-emerald-600">{item.orders}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar 
            dataKey="revenue" 
            fill="#8b5cf6" // Đổi sang màu tím cho khác biệt với biểu đồ doanh thu màu xanh
            radius={[4, 4, 0, 0]} 
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}