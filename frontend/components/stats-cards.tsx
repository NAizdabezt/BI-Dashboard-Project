"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Activity } from "lucide-react"

interface SummaryData {
  total_revenue: number
  total_orders: number
  growth_rate: number
  aov?: number
}

// 1. Khai báo Props để nhận startDate và endDate từ page.tsx
interface StatsCardsProps {
  startDate: string
  endDate: string
}

export function StatsCards({ startDate, endDate }: StatsCardsProps) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true) // Bật loading khi bắt đầu lọc lại
      try {
        // 2. Cập nhật URL fetch để gửi kèm tham số lọc ngày
        const response = await fetch(
          `http://localhost:8000/api/summary?start_date=${startDate}&end_date=${endDate}`
        )
        if (!response.ok) throw new Error("Failed to fetch summary")
        const summary: SummaryData = await response.json()
        
        // Tính toán AOV nếu backend chưa trả về
        summary.aov = summary.aov ?? (summary.total_orders > 0 ? summary.total_revenue / summary.total_orders : 0)
        setData(summary)
      } catch (err) {
        setError("Không thể cập nhật chỉ số tổng quan")
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [startDate, endDate]) // 3. Lắng nghe thay đổi của ngày để fetch lại

  if (loading) return <div className="grid gap-4 md:grid-cols-3 animate-pulse">
    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
  </div>
  
  if (error) return <div className="p-4 text-xs text-red-500 border border-red-200 bg-red-50 rounded-lg">{error}</div>

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* THẺ 1: TỔNG DOANH THU */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Doanh thu trong kỳ</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            R$ {data?.total_revenue?.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Từ {startDate} đến {endDate}
          </p>
        </CardContent>
      </Card>

      {/* THẺ 2: TỔNG SỐ ĐƠN HÀNG */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Số lượng đơn hàng</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data?.total_orders?.toLocaleString("en-US")}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Đơn hàng giao thành công
          </p>
        </CardContent>
      </Card>

      {/* THẺ 3: GIÁ TRỊ TRUNG BÌNH (AOV) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AOV (Giá trị TB đơn)</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            R$ {data?.aov?.toFixed(2)}
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
            <Activity className="h-3 w-3" />
            Hiệu suất trên mỗi đơn hàng
          </p>
        </CardContent>
      </Card>
    </div>
  )
}