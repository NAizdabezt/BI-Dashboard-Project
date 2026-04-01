"use client"

import { AppSidebar } from "@/components/sidebar" 
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { GlobalFilterBar } from "@/components/global-filter-bar"
// 👇 1. IMPORT THÊM COMPONENT TRỢ LÝ AI VÀO ĐÂY 👇
import { AIChatbot } from "@/components/ai-chatbot"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider> 
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950">
        
        {/* Cột trái: Thanh Menu Sidebar */}
        <AppSidebar />

        {/* Cột phải: Nội dung chính */}
        {/* Đã thêm min-w-0 và overflow-hidden để chống vỡ layout trên mobile */}
        <main className="flex-1 w-full flex flex-col min-w-0 overflow-hidden relative">
          
          {/* THANH HEADER DÀNH RIÊNG CHO MOBILE */}
          <header className="md:hidden flex items-center h-14 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-30 shadow-sm">
            {/* Nút 3 gạch gọi Sidebar */}
            <SidebarTrigger className="text-slate-600 dark:text-slate-300 -ml-2" />
            
            {/* Logo thu nhỏ trên Mobile */}
            <div className="ml-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="p-1 rounded-md bg-purple-600 text-white font-black text-[10px] flex items-center justify-center h-6 w-6">
                BO
              </div>
              <span className="text-sm tracking-tight">BI Dashboard</span>
            </div>
          </header>

          {/* Khu vực cuộn nội dung */}
          <div className="flex-1 overflow-y-auto">
            {/* Tối ưu Padding cho Mobile (p-4) và Desktop (p-10) */}
            <div className="p-4 md:p-6 lg:p-10 mx-auto max-w-[1600px] flex flex-col relative space-y-4 md:space-y-6">
              
              {/* THANH BỘ LỌC TOÀN CỤC */}
              <GlobalFilterBar />

              {/* Nội dung của từng trang */}
              {children}
            </div>
          </div>

          {/* 👇 2. ĐÃ SỬA: NHÚNG TRỢ LÝ AI VÀO GÓC MÀN HÌNH 👇 */}
          <AIChatbot />

        </main>
      </div>
    </SidebarProvider>
  )
}