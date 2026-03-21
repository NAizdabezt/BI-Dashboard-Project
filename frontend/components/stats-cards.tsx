"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Activity } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"

interface SummaryData {
  total_revenue: number
  total_orders: number
  growth_rate: number
  aov?: number
}

interface DailyData {
  date: string
  revenue: number
  orders?: number 
}

interface StatsCardsProps {
  startDate: string
  endDate: string
  category: string 
}

export function StatsCards({ startDate, endDate, category }: StatsCardsProps) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [latestData, setLatestData] = useState<DailyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 👇 1. KÍCH HOẠT HOOK ĐỔI TIỀN TỆ 👇
  const { formatMoney } = useCurrency()

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"

        const [summaryRes, dailyRes] = await Promise.all([
          fetch(`${baseUrl}/api/summary?start_date=${startDate}&end_date=${endDate}&category=${category}`),
          fetch(`${baseUrl}/api/revenue/daily?start_date=${startDate}&end_date=${endDate}&category=${category}`)
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
  }, [startDate, endDate, category])

  if (loading) return (
    <div className="grid gap-4 md:grid-cols-3 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg border border-slate-200 dark:border-slate-800" />)}
    </div>
  )
  
  if (error) return <div className="p-4 text-xs text-red-500 border border-red-200 bg-red-50 rounded-lg dark:bg-red-950/30 dark:border-red-900">{error}</div>

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* THẺ 1: TỔNG DOANH THU */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Doanh thu trong kỳ</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-baseline gap-2 mt-1">
            <div className="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-500 tracking-tight">
              {/* 👇 2. ĐÃ SỬA: Tự động format tiền tệ tổng doanh thu 👇 */}
              {formatMoney(data?.total_revenue || 0)}
            </div>
            {latestData && (
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                {/* 👇 3. ĐÃ SỬA: Tự động format tiền tệ doanh thu tăng thêm 👇 */}
                + {formatMoney(latestData.revenue)}
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

      {/* THẺ 2: TỔNG SỐ ĐƠN HÀNG (Giữ nguyên vì là số lượng, không phải tiền) */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Số lượng đơn hàng</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-baseline gap-2 mt-1">
            <div className="text-xl lg:text-2xl font-bold tracking-tight">
              {data?.total_orders?.toLocaleString("en-US")}
            </div>
            {latestData && latestData.orders !== undefined && (
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded text-xs whitespace-nowrap">
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
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AOV (Giá trị TB đơn)</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
            {/* 👇 4. ĐÃ SỬA: Tự động format tiền tệ cho AOV 👇 */}
            {formatMoney(data?.aov || 0)}
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