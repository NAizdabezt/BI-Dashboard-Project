"use client"

import React, { useEffect, useState } from "react"
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { CalendarClock } from "lucide-react"

// 👇 1. IMPORT ỐNG DẪN NƯỚC TIỀN TỆ 👇
import { useCurrency } from "@/contexts/CurrencyContext"

interface PredictionData {
  date: string
  actual_revenue: number | null
  predicted_revenue: number
}

interface Metrics {
  mape: number
  rmse: number
  mae: number
  status?: string
}

export function ForecastChart() {
  const [data, setData] = useState<PredictionData[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [forecastDays, setForecastDays] = useState<number>(14)

  // 👇 2. GỌI HÀM FORMAT TIỀN TỆ 👇
  const { formatMoney } = useCurrency()

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        
        const [chartRes, metricsRes] = await Promise.all([
          fetch(`${baseUrl}/api/predict?days=${forecastDays}&history_days=30`),
          fetch(`${baseUrl}/api/predict/metrics`)
        ])
        
        if (chartRes.ok) setData(await chartRes.json())
        if (metricsRes.ok) setMetrics(await metricsRes.json())

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchForecast()
  }, [forecastDays])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Chỉ số Metrics */}
        <div className="flex flex-wrap gap-3">
          {metrics && !metrics.status && (
            <>
              <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800">
                <p className="text-[10px] uppercase font-bold text-indigo-500">Sai số (MAPE)</p>
                <p className="text-base font-extrabold text-indigo-700 dark:text-indigo-300">{metrics.mape.toFixed(2)}%</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-500">Sai tuyệt đối (MAE)</p>
                {/* 👇 3. ĐÃ SỬA: Đổi sang formatMoney và chống rớt dòng 👇 */}
                <p className="text-base font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {formatMoney(metrics.mae)}
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-500">Sai lệch (RMSE)</p>
                {/* 👇 ĐÃ SỬA: Đổi sang formatMoney và chống rớt dòng 👇 */}
                <p className="text-base font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {formatMoney(metrics.rmse)}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <CalendarClock className="h-4 w-4 text-slate-500 ml-1" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Dự báo:</span>
          <select 
            value={forecastDays} 
            onChange={(e) => setForecastDays(Number(e.target.value))}
            className="text-sm font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-700 dark:text-indigo-400 cursor-pointer"
          >
            <option value={7}>7 ngày tới</option>
            <option value={14}>14 ngày tới</option>
            <option value={30}>30 ngày tới</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-[350px] flex items-center justify-center animate-pulse text-slate-400 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-800/50">Đang chạy mô hình Machine Learning...</div>
      ) : !data.length ? (
        <div className="h-[350px] flex items-center justify-center text-slate-400">Không có dữ liệu dự báo.</div>
      ) : (
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="date" tick={{ fill: '#888888', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={30} />
              {/* 👇 4. ĐÃ SỬA: Áp dụng format rút gọn tiền tệ cho trục Y 👇 */}
              <YAxis 
                tickFormatter={(val) => formatMoney(val, true)} 
                tick={{ fill: '#888888', fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
                width={65} 
              />
              
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                // 👇 5. ĐÃ SỬA: Gắn ống dẫn tiền tệ vào bảng Tooltip 👇
                formatter={(value: any, name: any) => [
                  formatMoney(Number(value)), 
                  name
                ]}
                labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
              />
              
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="actual_revenue" name="Thực tế" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
              <Line type="monotone" dataKey="predicted_revenue" name="Dự báo (ML)" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}