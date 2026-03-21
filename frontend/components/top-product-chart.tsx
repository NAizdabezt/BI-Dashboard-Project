"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useEffect, useState } from "react"
import { useCurrency } from "@/contexts/CurrencyContext"

interface TopProduct {
  product_name: string
  revenue: number
  orders: number
}

interface TopProductProps {
  startDate: string
  endDate: string
  category: string
}

export function TopProductChart({ startDate, endDate, category }: TopProductProps) {
  const [data, setData] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { formatMoney } = useCurrency()
  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        const response = await fetch(
          `${baseUrl}/api/products/top?start_date=${startDate}&end_date=${endDate}&category=${category}`
        )
        if (!response.ok) throw new Error("Failed to fetch products")
        
        const products: TopProduct[] = await response.json()
        
        // GIỮ NGUYÊN TÊN GỐC (Ví dụ: "Sách (#a1b2c)") để biểu đồ không bị trùng lặp
        setData(products)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi kết nối Backend")
      } finally {
        setLoading(false)
      }
    }

    fetchTopProducts()
  }, [startDate, endDate, category])

  if (loading) {
    return <div className="flex h-[350px] items-center justify-center text-sm text-slate-500 animate-pulse bg-slate-50 dark:bg-slate-900/20 rounded-lg">Đang phân tích sản phẩm...</div>
  }

  if (error) {
    return <div className="flex h-[350px] items-center justify-center text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg">{error}</div>
  }

  if (data.length === 0) {
    return <div className="flex h-[350px] items-center justify-center text-sm text-slate-500">Không có dữ liệu sản phẩm</div>
  }

  return (
    // Tăng nhẹ chiều cao lên 350px để các cột có không gian thở
    <div className="w-full h-[350px]"> 
      <ResponsiveContainer width="100%" height="100%">
        {/* Đổi sang biểu đồ ngang layout="vertical" */}
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-slate-800" />
          
          {/* Trục X bây giờ là Hiển thị Tiền */}
          <XAxis
            type="number"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatMoney(value, true)} 
          />
          
          {/* Trục Y bây giờ là Tên Sản Phẩm */}
          <YAxis
            dataKey="product_name"
            type="category"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={130} // Dành 130px cho tên sản phẩm hiển thị thoải mái
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
            // Nếu tên vẫn quá dài thì dùng dấu ...
            tickFormatter={(val) => val.length > 20 ? val.substring(0, 18) + '...' : val}
          />
          
          {/* Tooltip xịn xò của Anh được giữ nguyên nhưng Fix màu sắc cho hợp Dark mode */}
          <Tooltip
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as TopProduct
                return (
                  <div className="rounded-lg border bg-white dark:bg-slate-950 p-3 shadow-md border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Loại SP & Mã Hàng</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] leading-tight">
                        {item.product_name}
                      </span>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-slate-500">Doanh thu</span>
                          {/* 👇 ĐÃ SỬA: Dùng formatMoney và thêm whitespace-nowrap 👇 */}
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {formatMoney(item.revenue)}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] uppercase text-slate-500">Đã bán</span>
                          {/* 👇 ĐÃ SỬA: Thêm whitespace-nowrap cho chắc cú 👇 */}
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {item.orders} đơn
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
          
          <Bar 
            dataKey="revenue" 
            fill="#8b5cf6" 
            radius={[0, 4, 4, 0]} // Bo tròn bên phải thay vì bên trên (do đổi trục)
            barSize={24} // Thu nhỏ độ dày cột một chút cho thanh thoát
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}