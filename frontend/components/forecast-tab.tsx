"use client"

import React, { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Target, DollarSign, Activity } from "lucide-react"
// 👇 1. IMPORT ỐNG DẪN NƯỚC TIỀN TỆ 👇
import { useCurrency } from "@/contexts/CurrencyContext"

interface PredictionData {
  date: string
  actual_revenue: number | null
  predicted_revenue: number
}

export function ForecastTab() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 👇 2. GỌI HÀM FORMAT TIỀN TỆ 👇
  const { formatMoney } = useCurrency()

  useEffect(() => {
    const fetchFutureData = async () => {
      setLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        // Gọi API lấy 30 ngày quá khứ + 30 ngày tương lai để làm cơ sở so sánh
        const res = await fetch(`${baseUrl}/api/predict?days=30&history_days=30`)
        if (res.ok) {
          const data: PredictionData[] = await res.json()
          
          // Lọc ra quá khứ và tương lai
          const history = data.filter(d => d.actual_revenue !== null)
          const future = data.filter(d => d.actual_revenue === null)

          // Tính trung bình 30 ngày cũ
          const histTotal = history.reduce((sum, d) => sum + (d.actual_revenue || 0), 0)
          const histAvg = history.length > 0 ? histTotal / history.length : 0

          // Tính trung bình 30 ngày tới
          const futTotal = future.reduce((sum, d) => sum + d.predicted_revenue, 0)
          const futAvg = future.length > 0 ? futTotal / future.length : 0

          // So sánh tăng giảm
          const diffPercent = histAvg > 0 ? ((futAvg - histAvg) / histAvg) * 100 : 0

          setSummary({
            futTotal,
            futAvg,
            histAvg,
            diffPercent,
            isUp: diffPercent >= 0
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchFutureData()
  }, [])

  if (loading) return <div className="h-[150px] flex items-center justify-center animate-pulse text-slate-400">Đang tính toán số liệu 30 ngày tới...</div>
  if (!summary) return <div className="h-[150px] flex items-center justify-center text-slate-400">Không có dữ liệu.</div>

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* THẺ 1: TỔNG DOANH THU DỰ KIẾN */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
          <Target className="h-4 w-4" />
          <h4 className="text-sm font-bold uppercase tracking-wider">Dự kiến 30 ngày tới</h4>
        </div>
        {/* 👇 3. ĐÃ SỬA: Dùng formatMoney và chống rớt dòng 👇 */}
        <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
          {formatMoney(summary.futTotal)}
        </div>
      </div>

      {/* THẺ 2: TRUNG BÌNH MỖI NGÀY */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
          <DollarSign className="h-4 w-4" />
          <h4 className="text-sm font-bold uppercase tracking-wider">Trung bình mỗi ngày</h4>
        </div>
        {/* 👇 ĐÃ SỬA: Tự động format tiền tệ 👇 */}
        <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 whitespace-nowrap">
          {formatMoney(summary.futAvg)}
        </div>
      </div>

      {/* THẺ 3: SO SÁNH VỚI QUÁ KHỨ */}
      <div className={`p-5 rounded-xl border ${summary.isUp ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/10'}`}>
        <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
          <Activity className="h-4 w-4" />
          <h4 className="text-sm font-bold uppercase tracking-wider">So với 30 ngày trước</h4>
        </div>
        <div className="flex items-baseline gap-2">
          <div className={`text-2xl font-extrabold flex items-center gap-1 ${summary.isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {summary.isUp ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            {Math.abs(summary.diffPercent).toFixed(1)}%
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1 font-medium">
            {/* 👇 ĐÃ SỬA: Tự động format tiền tệ cho mức trung bình cũ 👇 */}
            {summary.isUp ? "Tốt hơn" : "Kém hơn"} mức trung bình cũ ({formatMoney(summary.histAvg)})
        </p>
      </div>
    </div>
  )
}