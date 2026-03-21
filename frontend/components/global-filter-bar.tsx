"use client"

import { useState, useEffect } from "react"
import { useFilters } from "@/contexts/FilterContext"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Filter, XCircle } from "lucide-react"

export function GlobalFilterBar() {
  // Chỉ còn lấy category và date
  const { date, setDate, category, setCategory } = useFilters()
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

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
    fetchMetadata()
  }, [])

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

  // Nút xóa xuất hiện khi có chọn danh mục
  const isFiltered = category !== "all"

  return (
    <div className="sticky top-0 z-20 flex flex-col md:flex-row items-center justify-between gap-4 p-4 mb-6 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-950/80 dark:border-slate-800 rounded-b-xl shadow-sm">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        <Filter className="h-4 w-4 text-purple-600" /> Bộ lọc tổng
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* CHỈ CÒN LẠI LỌC DANH MỤC */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 w-[180px] rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 line-clamp-1"
        >
          <option value="all">Tất cả danh mục</option>
          {availableCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* LỌC THỜI GIAN */}
        <DatePickerWithRange date={date} setDate={setDate} />

        {/* NÚT XÓA */}
        {isFiltered && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 h-10 px-3 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors dark:text-rose-400 dark:hover:bg-rose-950/50"
          >
            <XCircle className="h-4 w-4" />
            Xóa lọc
          </button>
        )}
      </div>
    </div>
  )
}