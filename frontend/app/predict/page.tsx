"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"
import { BrainCircuit, Calculator, TrendingUp, Sparkles, LineChart } from "lucide-react"

import { BiInsights } from "@/components/bi-insights"
import { ForecastChart } from "@/components/forecast-chart"
import { TrendingTab } from "@/components/trending-tab"
// Import thêm thẻ Dự báo số liệu vừa tạo
import { ForecastTab } from "@/components/forecast-tab"

const TABS = [
  { id: "forecast", label: "Số liệu Dự báo", icon: Calculator },
  { id: "trends", label: "Xu hướng Ngành", icon: TrendingUp },
  { id: "insights", label: "AI Khuyến nghị", icon: Sparkles },
]

export default function ForecastPage() {
  const [activeTab, setActiveTab] = useState("forecast")

  return (
    <DashboardLayout>
      <div className="space-y-8 flex flex-col min-h-screen">
        
        {/* TIÊU ĐỀ TRANG */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">AI Center</h1>
            </div>
            <p className="text-sm md:text-base text-slate-500">Trung tâm phân tích thông minh và dự phóng tương lai.</p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* KHU VỰC 1: TAB PHÂN TÍCH (NẰM TRÊN) */}
        {/* ========================================================= */}
        <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800 bg-white dark:bg-slate-950">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-0 pt-4 px-4 bg-slate-50/50 dark:bg-slate-900/20">
            {/* Thanh Tab */}
            <div className="flex gap-2 overflow-x-auto pb-4">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                      isActive 
                        ? "bg-indigo-600 text-white shadow-md dark:bg-indigo-500" 
                        : "text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            {/* Nội dung Tab 1: Số liệu */}
            {activeTab === "forecast" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Phân tích Số liệu Tương lai</h2>
                  <p className="text-sm text-slate-500">Dự đoán mức độ tăng trưởng doanh thu trong 30 ngày tới.</p>
                </div>
                <ForecastTab />
              </div>
            )}

            {/* Nội dung Tab 2: Xu hướng */}
            {activeTab === "trends" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Xu hướng Tăng trưởng Ngành hàng</h2>
                  <p className="text-sm text-slate-500">Đo lường sức nóng và thị phần của các danh mục sản phẩm.</p>
                </div>
                <TrendingTab />
              </div>
            )}

            {/* Nội dung Tab 3: Khuyến nghị */}
            {activeTab === "insights" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Phân tích & Đề xuất hành động</h2>
                  <p className="text-sm text-slate-500">Hệ thống AI tự động dò tìm điểm bất thường và đưa ra lời khuyên kinh doanh.</p>
                </div>
                <BiInsights />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========================================================= */}
        {/* KHU VỰC 2: BIỂU ĐỒ DỰ BÁO (NẰM DƯỚI, LUÔN HIỂN THỊ) */}
        {/* ========================================================= */}
        <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800 bg-white dark:bg-slate-950">
          <CardHeader className="border-b border-slate-100 dark:border-slate-900 pb-4">
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg font-bold">Biểu đồ Trực quan hóa Tương lai</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ForecastChart />
          </CardContent>
        </Card>

        <div className="mt-auto pt-8 border-t border-slate-200 dark:border-slate-800"><Footer /></div>
      </div>
    </DashboardLayout>
  )
}