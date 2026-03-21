"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useFilters } from "@/contexts/FilterContext" // Ống hút dữ liệu từ Tầng Mây
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"
import { CategoryChart } from "@/components/category-chart"
import { Layers } from "lucide-react"
import { PaymentChart } from "@/components/payment-chart"
import { PriceTierChart } from "@/components/price-tier-chart"
import { TopProductChart } from "@/components/top-product-chart"
import { CircleDollarSign, CreditCard, PieChart, PackageSearch } from "lucide-react"

export default function SalesPage() {
  // Chỉ 1 dòng duy nhất lấy mọi thứ từ bộ lọc tổng!
  const { startDate, endDate, category } = useFilters()

  return (
    <DashboardLayout>
      <div className="space-y-8 flex flex-col">
        {/* TIÊU ĐỀ (Đã bỏ DatePicker vì thanh Global đã lo) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CircleDollarSign className="h-6 w-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Doanh số & Tiền tệ</h1>
            </div>
            <p className="text-sm md:text-base text-slate-500">Phân tích dòng tiền, phương thức thanh toán và phân khúc giá.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg font-bold">Phương thức thanh toán</CardTitle>
              </div>
              <CardDescription>Tỷ trọng doanh thu theo cổng thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <PaymentChart startDate={startDate} endDate={endDate} category={category}/>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg font-bold">Tương quan Giá cả & Doanh thu</CardTitle>
              </div>
              <CardDescription>Phân khúc giá mang lợi nhuận chính</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <PriceTierChart startDate={startDate} endDate={endDate} category={category}/> 
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-sky-500" />
              <CardTitle className="text-lg font-bold">Top Danh mục mang lại Doanh thu</CardTitle>
            </div>
            <CardDescription>Xếp hạng 7 ngành hàng có sức mua mạnh nhất</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-slate-950">
            <CategoryChart startDate={startDate} endDate={endDate} />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <PackageSearch className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg font-bold">Bảng xếp hạng Sản phẩm</CardTitle>
              </div>
              <CardDescription>Top sản phẩm mang lại doanh thu cao nhất kỳ này</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <TopProductChart startDate={startDate} endDate={endDate} category={category}/>
            </CardContent>
          </Card>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800"><Footer /></div>
      </div>
    </DashboardLayout>
  )
}