"use client"

import React, { useState, useEffect } from "react"
import { useCurrency } from "@/contexts/CurrencyContext"

interface RFMData {
  segment: string;
  customer_count: number;
  total_revenue: number;
  avg_recency: number;
}

const getSegmentColor = (segmentName: string) => {
  const name = segmentName.toLowerCase();
  if (name.includes("champions") || name.includes("vip") || name.includes("1.")) 
    return "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (name.includes("loyal") || name.includes("trung thành") || name.includes("2.")) 
    return "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
  if (name.includes("potential") || name.includes("mới") || name.includes("3.")) 
    return "text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400";
  if (name.includes("risk") || name.includes("rời bỏ") || name.includes("5.")) 
    return "text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
  if (name.includes("hibernating") || name.includes("ngủ đông") || name.includes("6.")) 
    return "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
  
  return "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-400";
}

export function RFMTable() {
  const { formatMoney } = useCurrency()
  const [rfmData, setRfmData] = useState<RFMData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRFM = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        const res = await fetch(`${baseUrl}/api/customers/rfm`)
        if (res.ok) {
          const data = await res.json()
          setRfmData(data)
        }
      } catch (error) {
        console.error("Lỗi fetch RFM data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRFM()
  }, [])

  if (isLoading) {
    return <div className="p-8 text-center text-sm font-medium text-purple-600 animate-pulse flex justify-center items-center gap-2">
      <span className="h-4 w-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin"></span>
      Đang tải dữ liệu phân tích RFM...
    </div>
  }

  if (!rfmData || rfmData.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-500">Chưa có dữ liệu phân khúc.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg font-bold">Phân khúc RFM</th>
            <th className="px-4 py-3 text-right font-bold">Số lượng khách</th>
            <th className="px-4 py-3 text-right font-bold" title="Số ngày trung bình kể từ lần mua cuối">Ngày mua cuối (TB)</th>
            {/* CỘT MỚI: CHI TIÊU TRUNG BÌNH */}
            <th className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-500">Chi tiêu TB/Khách</th>
            <th className="px-4 py-3 text-right rounded-tr-lg font-bold">Tổng doanh thu</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rfmData.map((row, i) => {
            // Tính toán chi tiêu trung bình cho mỗi khách hàng trong nhóm
            const avgSpendPerCustomer = row.customer_count > 0 ? row.total_revenue / row.customer_count : 0;
            
            return (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-4 font-medium">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold whitespace-nowrap ${getSegmentColor(row.segment)}`}>
                    {row.segment}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                  {row.customer_count.toLocaleString('vi-VN')}
                </td>
                <td className="px-4 py-4 text-right text-slate-500 dark:text-slate-400 font-medium">
                  ~{row.avg_recency} ngày
                </td>
                <td className="px-4 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap bg-emerald-50/50 dark:bg-emerald-900/10">
                  {formatMoney(avgSpendPerCustomer)}
                </td>
                <td className="px-4 py-4 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {formatMoney(row.total_revenue)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}