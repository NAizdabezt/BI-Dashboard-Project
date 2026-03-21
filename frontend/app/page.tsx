"use client"

// 1. Xóa sạch import useState, useEffect, format, DateRange... không cần nữa!
import { DashboardLayout } from "@/components/dashboard-layout"
import { useFilters } from "@/contexts/FilterContext" // Chỉ cần import cái ống hút này

import { StatsCards } from "@/components/stats-cards"
import { RevenueChart } from "@/components/revenue-chart"
import { TopProductChart } from "@/components/top-product-chart"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  // 2. Dùng "ống hút" để lấy dữ liệu từ Tầng Mây xuống (ngắn gọn trong 1 dòng)
  const { startDate, endDate, category } = useFilters()

  return (
    <DashboardLayout>
      <div className="space-y-8 flex flex-col"> 
        
        {/* TIÊU ĐỀ (Xóa luôn cái DatePicker cũ ở đây vì đã có GlobalFilterBar lo) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Tổng quan kinh doanh
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
              Theo dõi và dự báo hoạt động kinh doanh thời gian thực.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-medium dark:bg-emerald-900/30 dark:border-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Data
          </div>
        </div>

        {/* HÀNG 1: THẺ CHỈ SỐ */}
        {/* Sau này Anh update Backend nhận thêm category và status thì truyền vào đây luôn */}
        <StatsCards startDate={startDate} endDate={endDate} category={category} />

        {/* HÀNG 4: BIỂU ĐỒ */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg font-bold">Biến động doanh thu</CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <RevenueChart startDate={startDate} endDate={endDate} category={category} />
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg font-bold">Top 7 sản phẩm bán chạy</CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <TopProductChart startDate={startDate} endDate={endDate} category={category}/>
            </CardContent>
          </Card>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800"><Footer /></div>
      </div>
    </DashboardLayout>
  )
}