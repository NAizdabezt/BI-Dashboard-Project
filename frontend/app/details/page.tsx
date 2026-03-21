"use client" // Bắt buộc phải có dòng này để chạy các hiệu ứng của React

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"

// Import các Component
import { TopStateChart } from "@/components/top-state-chart"
import { HeatmapChart } from "@/components/heatmap-chart"
import { RFMTable } from "@/components/rfm-table"
import { Footer } from "@/components/footer"
import { PaymentChart } from "@/components/payment-chart"
import { OrderStatusChart } from "@/components/order-status-chart"
import { PriceTierChart } from "@/components/price-tier-chart"

// Import thêm bộ Icon để trang trí chuẩn Figma
import { BarChart4, Map, Activity, CreditCard, PieChart, Clock, Users } from "lucide-react"

export default function DetailsPage() {
  // 1. Khởi tạo State và lấy ngày tháng y như trang chủ
  const [date, setDate] = useState<DateRange | undefined>()

  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        const response = await fetch(`${baseUrl}/api/metadata/date-range`)
        if (response.ok) {
          const { min_date, max_date } = await response.json()
          setDate({ from: new Date(min_date), to: new Date(max_date) })
        }
      } catch (error) {
        console.error("Lỗi khi lấy ngày:", error)
      }
    }
    fetchDateRange()
  }, [])

  // 2. Chuyển đổi định dạng để truyền vào Component con
  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : ""
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : ""

  return (
    <DashboardLayout>
      <div className="space-y-8 flex flex-col">
        
        {/* TIÊU ĐỀ TRANG VÀ BỘ LỌC */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <BarChart4 className="h-6 w-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Biểu đồ chi tiết (EDA)
              </h1>
            </div>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
              Phân tích chuyên sâu về hành vi khách hàng, địa lý và phân khúc RFM.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Gắn cái Lịch chọn ngày vào đây */}
            <DatePickerWithRange date={date} setDate={setDate} />
          </div>
        </div>

        {/* HÀNG 1: TRẠNG THÁI ĐƠN HÀNG & PHƯƠNG THỨC THANH TOÁN */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-lg font-bold">Tỷ lệ trạng thái đơn hàng</CardTitle>
              </div>
              <CardDescription>Kiểm soát lượng đơn hủy và thành công</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              {/* Nếu chart này có hỗ trợ startDate/endDate thì Anh truyền thêm vào nhé */}
              <OrderStatusChart /> 
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg font-bold">Phương thức thanh toán</CardTitle>
              </div>
              <CardDescription>Tỷ trọng doanh thu theo cổng thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <PaymentChart startDate={startDate} endDate={endDate} />
            </CardContent>
          </Card>
        </div>

        {/* HÀNG 2: TOP BANG & PHÂN KHÚC GIÁ */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg font-bold">Phân bổ doanh thu theo Bang</CardTitle>
              </div>
              <CardDescription>Top 10 Bang có sức mua lớn nhất</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <TopStateChart />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg font-bold">Tương quan Giá cả & Doanh thu</CardTitle>
              </div>
              <CardDescription>Phân khúc giá mang lại lợi nhuận chính</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <PriceTierChart />
            </CardContent>
          </Card>
        </div>

        {/* HÀNG 3: HEATMAP NẰM FULL NGANG */}
        <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-rose-500" />
              <CardTitle className="text-lg font-bold">Giờ vàng mua sắm (Heatmap)</CardTitle>
            </div>
            <CardDescription>Mật độ đơn hàng theo Thứ và Giờ trong ngày</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-slate-950 overflow-x-auto">
            <HeatmapChart />
          </CardContent>
        </Card>

        {/* HÀNG 4: PHÂN KHÚC KHÁCH HÀNG RFM */}
        <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg font-bold">Phân khúc khách hàng (RFM Segmentation)</CardTitle>
            </div>
            <CardDescription>Phân loại khách hàng dựa trên Recency, Frequency, và Monetary</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-slate-950">
            <RFMTable />
          </CardContent>
        </Card>

        {/* Chân trang */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <Footer />
        </div>
        
      </div>
    </DashboardLayout>
  )
}