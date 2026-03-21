"use client"

import React, { useEffect, useState } from "react"
import { useFilters } from "@/contexts/FilterContext"
import { Sparkles, TrendingUp, AlertTriangle, Info, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation" 
// 👇 1. IMPORT ỐNG DẪN NƯỚC TIỀN TỆ 👇
import { useCurrency } from "@/contexts/CurrencyContext"

interface InsightItem {
  title: string
  description: string
  type: "success" | "warning" | "info"
}

export function BiInsights() {
  const { startDate, endDate, category } = useFilters()
  const [insights, setInsights] = useState<InsightItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter() 
  
  // 👇 2. GỌI HÀM FORMAT TIỀN TỆ 👇
  const { formatMoney } = useCurrency()

  // 👇 HÀM MA THUẬT: Tự động quét và dịch tiền tệ bên trong đoạn văn bản 👇
  const formatInsightText = (text: string) => {
    if (!text) return "";
    
    // Tìm và thay thế các chuỗi dạng "R$ 1500" hoặc "R$1500"
    let translatedText = text.replace(/R\$\s*([\d,.]+)/g, (match, numberString) => {
      const val = Number(numberString.replace(/,/g, "")); // Xóa dấu phẩy nếu có
      return isNaN(val) ? match : formatMoney(val);
    });

    // Tìm và thay thế các chuỗi dạng "1500 R$" hoặc "1500R$"
    translatedText = translatedText.replace(/([\d,.]+)\s*R\$/g, (match, numberString) => {
      const val = Number(numberString.replace(/,/g, ""));
      return isNaN(val) ? match : formatMoney(val);
    });

    return translatedText;
  }

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        
        // 👇 3. Lấy Ngưỡng AOV từ Tab Cài đặt (Nếu chưa cài thì mặc định 120) 👇
        const aovTarget = localStorage.getItem("app_aov_target") || "120";

        // 👇 4. Truyền luôn aov_target cho Backend để AI biết đường mà khuyên 👇
        const response = await fetch(`${baseUrl}/api/insights?start_date=${startDate}&end_date=${endDate}&category=${category}&aov_target=${aovTarget}`)
        
        if (response.ok) {
          const data = await response.json()
          setInsights(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
  }, [startDate, endDate, category])

  if (loading) return <div className="h-[200px] flex items-center justify-center animate-pulse text-slate-400 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-800/50">AI đang phân tích dữ liệu...</div>
  if (!insights.length) return <div className="h-[200px] flex items-center justify-center text-slate-400">Không có dữ kiện để phân tích cho kỳ này.</div>

  const getStyle = (type: string) => {
    switch (type) {
      case "success":
        return { icon: <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />, bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800/50" }
      case "warning":
        return { icon: <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />, bg: "bg-rose-100 dark:bg-rose-900/30", border: "border-rose-200 dark:border-rose-800/50" }
      default:
        return { icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />, bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800/50" }
    }
  }

  const getTargetRoute = (title: string) => {
    const t = title.toLowerCase()
    if (t.includes("sản phẩm") || t.includes("thanh toán")) return "/sales" 
    if (t.includes("khu vực")) return "/logistics" 
    return "/" 
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {insights.map((insight, idx) => {
          const style = getStyle(insight.type)
          const targetRoute = getTargetRoute(insight.title)

          return (
            <div 
              key={idx} 
              onClick={() => router.push(targetRoute)}
              className={`relative overflow-hidden flex items-start gap-4 p-5 rounded-xl border ${style.border} bg-white dark:bg-slate-900/50 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 group cursor-pointer`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bg} transition-all duration-300 group-hover:w-1.5`} />
              
              <div className={`p-2.5 rounded-full ${style.bg} shrink-0`}>
                {style.icon}
              </div>
              
              <div className="flex-1 space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {/* Dịch tiền tệ luôn cả trong Tiêu đề (nếu có) */}
                  {formatInsightText(insight.title)}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {/* 👇 ĐÃ SỬA: Dịch mượt mà tiền tệ bên trong Nội dung 👇 */}
                  {formatInsightText(insight.description)}
                </p>
                <button className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem chi tiết tại biểu đồ <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}