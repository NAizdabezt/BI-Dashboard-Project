"use client"

import { AppSidebar } from "@/components/sidebar" 
import { SidebarProvider } from "@/components/ui/sidebar"
import { GlobalFilterBar } from "@/components/global-filter-bar"
// Đã xóa import FilterProvider ở đây cho đỡ lỗi

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider> 
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950">
        
        {/* Cột trái: Thanh Menu Sidebar */}
        <AppSidebar />

        {/* Cột phải: Nội dung chính */}
        <main className="flex-1 w-full overflow-y-auto">
          <div className="p-6 md:p-10 mx-auto max-w-[1600px] flex flex-col relative">
            
            {/* THANH BỘ LỌC TOÀN CỤC */}
            <GlobalFilterBar />

            {/* Nội dung của từng trang */}
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}