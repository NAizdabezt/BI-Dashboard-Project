"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCards } from "@/components/stats-cards"
import { RevenueChart } from "@/components/revenue-chart"
import { TopProductChart } from "@/components/top-product-chart"
import { PredictForm } from "@/components/predict-form"
import { AlertSection } from "@/components/alert-section"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"

export default function Home() {
  // 1. Khởi tạo State rỗng ban đầu
  const [date, setDate] = useState<DateRange | undefined>()

  // 2. Tự động lấy ngày đầu và ngày cuối từ Backend khi load trang
  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/metadata/date-range")
        if (response.ok) {
          const { min_date, max_date } = await response.json()
          
          // Cập nhật State với ngày thực tế từ Database
          setDate({
            from: new Date(min_date),
            to: new Date(max_date),
          })
        }
      } catch (error) {
        console.error("Lỗi khi lấy khoảng thời gian:", error)
      }
    }

    fetchDateRange()
  }, []) // Mảng rỗng [] đảm bảo hàm này chỉ chạy 1 lần duy nhất khi reload trang

  // 3. Chuyển định dạng ngày sang string để truyền cho API Backend
  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : ""
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : ""

  return (
    <DashboardLayout>
      <div className="space-y-6"> 
        
        {/* TIÊU ĐỀ & BỘ LỌC THỜI GIAN */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Olist Business Dashboard</h1>
            <p className="text-muted-foreground">Theo dõi và dự báo hoạt động kinh doanh thời gian thực.</p>
          </div>
          {/* Nút chọn ngày nằm ở đây */}
          <DatePickerWithRange date={date} setDate={setDate} />
        </div>

        {/* HÀNG 1: THẺ CHỈ SỐ TỔNG QUAN */}
        <StatsCards startDate={startDate} endDate={endDate} />

        {/* HÀNG 2: HỆ THỐNG CẢNH BÁO THÔNG MINH (Insight & Alert) */}
        <AlertSection startDate={startDate} endDate={endDate} />

        {/* HÀNG 3: BIỂU ĐỒ AI DỰ BÁO */}
        <PredictForm />

        {/* HÀNG 4: CÁC BIỂU ĐỒ PHÂN TÍCH (Truyền startDate/endDate vào để lọc) */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Biến động doanh thu</CardTitle>
              <CardDescription>
                Doanh thu theo ngày trong khoảng thời gian đã chọn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart startDate={startDate} endDate={endDate} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top 5 sản phẩm bán chạy</CardTitle>
              <CardDescription>
                Sản phẩm có doanh số cao nhất theo bộ lọc
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopProductChart startDate={startDate} endDate={endDate} />
            </CardContent>
          </Card>
        </div>

        {/* Chân trang */}
        <Footer />  
      </div>
    </DashboardLayout>
  )
}