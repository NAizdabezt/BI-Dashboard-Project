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

// 1. Cập nhật Interface: Đã thêm 'orders' vào để nhận dữ liệu từ Backend
interface DailyData {
  date: string
  revenue: number
  orders?: number // <--- Thêm dòng này
}

interface StatsCardsProps {
  startDate: string
  endDate: string
}

export function StatsCards({ startDate, endDate }: StatsCardsProps) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [latestData, setLatestData] = useState<DailyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const [summaryRes, dailyRes] = await Promise.all([
          fetch(`http://localhost:8000/api/summary?start_date=${startDate}&end_date=${endDate}`),
          fetch(`http://localhost:8000/api/revenue/daily?start_date=${startDate}&end_date=${endDate}`)
        ])

        if (!summaryRes.ok || !dailyRes.ok) throw new Error("Failed to fetch data")

        const summary: SummaryData = await summaryRes.json()
        const daily: DailyData[] = await dailyRes.json()
        
        summary.aov = summary.aov ?? (summary.total_orders > 0 ? summary.total_revenue / summary.total_orders : 0)
        setData(summary)

        if (daily && daily.length > 0) {
          setLatestData(daily[daily.length - 1])
        } else {
          setLatestData(null)
        }

      } catch (err) {
        setError("Không thể cập nhật chỉ số tổng quan")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [startDate, endDate])

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
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-blue-600">
              R$ {data?.total_revenue?.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            {latestData && (
              <div className="text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded text-lg">
                + R$ {latestData.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </div>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-2">
            <span>Từ {startDate} đến {endDate}</span>
            {latestData && (
              <span className="text-muted-foreground/80 font-normal">
                (Ngày {latestData.date})
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* THẺ 2: TỔNG SỐ ĐƠN HÀNG (ĐÃ CẬP NHẬT GIAO DIỆN NGANG HÀNG) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Số lượng đơn hàng</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">
              {data?.total_orders?.toLocaleString("en-US")}
            </div>
            {/* Hiện số lượng đơn hàng cộng thêm */}
            {latestData && latestData.orders !== undefined && (
              <div className="text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded text-lg">
                + {latestData.orders.toLocaleString("en-US")}
              </div>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-2">
            <span>Đơn hàng giao thành công</span>
            {latestData && latestData.orders !== undefined && (
              <span className="text-muted-foreground/80 font-normal">
                (Ngày {latestData.date})
              </span>
            )}
          </div>
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
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
            <Activity className="h-3 w-3" />
            Hiệu suất trên mỗi đơn hàng
          </p>
        </CardContent>
      </Card>
    </div>
  )
}