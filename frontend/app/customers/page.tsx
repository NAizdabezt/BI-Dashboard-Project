"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useFilters } from "@/contexts/FilterContext" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"

import { HeatmapChart } from "@/components/heatmap-chart"
import { RFMTable } from "@/components/rfm-table"
import { Users, Clock, UserCheck } from "lucide-react"

export default function CustomersPage() {
  const { startDate, endDate, category } = useFilters()

  return (
    <DashboardLayout>
      <div className="space-y-8 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Khách hàng & Hành vi</h1>
            </div>
            <p className="text-sm md:text-base text-slate-500">Nghiên cứu giờ vàng mua sắm và phân khúc khách hàng.</p>
          </div>
        </div>

        <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-rose-500" />
              <CardTitle className="text-lg font-bold">Giờ vàng mua sắm (Heatmap)</CardTitle>
            </div>
            <CardDescription>Mật độ đơn hàng theo Thứ và Giờ</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-slate-950 overflow-x-auto">
            <HeatmapChart startDate={startDate} endDate={endDate} category={category} />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg font-bold">Phân khúc khách hàng (RFM)</CardTitle>
            </div>
            <CardDescription>Phân loại khách hàng dựa trên Recency, Frequency, Monetary</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-slate-950">
            <RFMTable />
          </CardContent>
        </Card>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800"><Footer /></div>
      </div>
    </DashboardLayout>
  )
}