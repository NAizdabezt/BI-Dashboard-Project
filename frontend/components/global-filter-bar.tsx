"use client"

import { useState, useEffect } from "react"
import { useFilters } from "@/contexts/FilterContext"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Filter, XCircle, Clock } from "lucide-react"
import { usePathname } from "next/navigation"

export function GlobalFilterBar() {
  const pathname = usePathname()

  const { date, setDate, category, setCategory } = useFilters()
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  
  const [lastUpdated, setLastUpdated] = useState<string>("Đang kiểm tra...")
  
  if (pathname === "/settings") return null;
  
  // 1. CHẠY KHI LOAD TRANG: Lấy metadata và thời gian cập nhật
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        const response = await fetch(`${baseUrl}/api/metadata/filters`)
        if (response.ok) {
          const data = await response.json()
          setAvailableCategories(data.categories || [])
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách bộ lọc:", error)
      }
    }

    const fetchLastUpdate = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        const response = await fetch(`${baseUrl}/api/metadata/last-update`)
        if (response.ok) {
          const data = await response.json()
          setLastUpdated(data.last_updated)
        } else {
          setLastUpdated("Chưa rõ")
        }
      } catch (error) {
        setLastUpdated("Không thể kết nối")
      }
    }

    fetchMetadata()
    fetchLastUpdate() 
  }, [])

  // 🔥 BỘ LẮNG NGHE TÍN HIỆU TỪ AI CỰC KỲ AN TOÀN 🔥
  useEffect(() => {
    const handleAIFilterCommand = (e: any) => {
      try {
        const { startDate, endDate, category: aiCategory } = e.detail;
        console.log("🤖 Dashboard nhận lệnh xử lý:", e.detail);

        // 1. XỬ LÝ NGÀY THÁNG (Chống lỗi Null/Undefined)
        if (startDate && endDate && startDate !== "null" && endDate !== "null") {
          const fromDate = new Date(startDate);
          const toDate = new Date(endDate);
          // Kiểm tra xem ngày có hợp lệ không trước khi set
          if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
            setDate({ from: fromDate, to: toDate });
          }
        }

        // 2. XỬ LÝ DANH MỤC (Chống lỗi String toLowerCase)
        if (aiCategory && typeof aiCategory === 'string' && aiCategory.toLowerCase() !== "null" && aiCategory.toLowerCase() !== "none") {
          // Bắt buộc setCategory (Nếu không có trong Dropdown thì API vẫn sẽ tự tìm)
          setCategory(aiCategory);
        } else {
          // Nếu không nhắc đến danh mục -> Chọn Tất cả
          setCategory("all");
        }
      } catch (err) {
        console.error("❌ Lỗi khi áp dụng bộ lọc từ AI:", err);
      }
    };

    window.addEventListener('ai-update-global-filter', handleAIFilterCommand);
    return () => window.removeEventListener('ai-update-global-filter', handleAIFilterCommand);
  }, [setDate, setCategory]);

  const handleClearFilters = async () => {
    setCategory("all")
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
      const response = await fetch(`${baseUrl}/api/metadata/date-range`)
      if (response.ok) {
        const { min_date, max_date } = await response.json()
        setDate({ from: new Date(min_date), to: new Date(max_date) })
      }
    } catch (error) {}
  }

  const isFiltered = category !== "all"

  return (
    <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 mb-6 bg-white/90 backdrop-blur-md border border-slate-200 dark:bg-slate-950/90 dark:border-slate-800 rounded-xl shadow-sm">
      
      {/* TIÊU ĐỀ VÀ THỜI GIAN CẬP NHẬT */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <Filter className="h-4 w-4 text-purple-600" /> Bộ lọc tổng
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3" />
          <span>Dữ liệu mới nhất: <span className="text-emerald-600 dark:text-emerald-400">{lastUpdated}</span></span>
        </div>
      </div>

      {/* Vùng chứa bộ lọc */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
        
        {/* LỌC DANH MỤC */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 w-full md:w-[180px] rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 line-clamp-1 cursor-pointer"
        >
          <option value="all">Tất cả danh mục</option>
          {availableCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* LỌC THỜI GIAN */}
        <div className="w-full md:w-auto flex">
          <div className="w-full">
            <DatePickerWithRange date={date} setDate={setDate} />
          </div>
        </div>

        {/* NÚT XÓA */}
        {isFiltered && (
          <button
            onClick={handleClearFilters}
            className="flex items-center justify-center gap-1.5 h-10 w-full md:w-auto px-4 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors dark:text-rose-400 dark:hover:bg-rose-950/50 border border-transparent md:border-none border-rose-100 dark:border-rose-900/50"
          >
            <XCircle className="h-4 w-4" />
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  )
}