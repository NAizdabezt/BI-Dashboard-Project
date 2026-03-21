"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useFilters } from "@/contexts/FilterContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"

import { TopStateChart } from "@/components/top-state-chart"
import { OrderStatusChart } from "@/components/order-status-chart"
import { SellerChart } from "@/components/seller-chart"
import { Truck, Map, Activity, Users } from "lucide-react"

export default function LogisticsPage() {
  const { startDate, endDate, category } = useFilters()

  return (
    <DashboardLayout>
      <div className="space-y-8 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Truck className="h-6 w-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Vận hành & Khu vực</h1>
            </div>
            <p className="text-sm md:text-base text-slate-500">Giám sát giao hàng, khu vực và hiệu suất người bán.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-lg font-bold">Tình trạng đơn hàng</CardTitle>
              </div>
              <CardDescription>Kiểm soát lượng đơn hủy và thành công</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <OrderStatusChart startDate={startDate} endDate={endDate}/>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg font-bold">Bản đồ sức mua theo Bang</CardTitle>
              </div>
              <CardDescription>Top Bang có doanh thu lớn nhất kỳ này</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <TopStateChart startDate={startDate} endDate={endDate} category={category}/>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg font-bold">Hiệu suất kinh doanh Seller</CardTitle>
              </div>
              <CardDescription>Top 7 nhà bán hàng mang lại doanh thu xuất sắc nhất</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-950">
              <SellerChart startDate={startDate} endDate={endDate} category={category} />
            </CardContent>
        </Card>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800"><Footer /></div>
      </div>
    </DashboardLayout>
  )
}