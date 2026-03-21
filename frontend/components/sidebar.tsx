"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation" // Dùng để xác định tab nào đang được bấm
import {
  BarChart3,
  Home,
  TrendingUp,
  ChevronsUpDown,
  Settings,
  CircleDollarSign,
  Users,
  Truck,
  Bot
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader, // Thêm Header
  SidebarFooter, // Thêm Footer
} from "@/components/ui/sidebar"

// Menu items giữ nguyên link của Anh, tui thêm cái Cài đặt cho giống Figma
const items = [
  {
    title: "Tổng quan",
    url: "/",
    icon: Home,
  },
  {
    title: "Doanh số & Tiền tệ",
    url: "/sales",
    icon: CircleDollarSign,
  },
  {
    title: "Khách hàng & Hành vi",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Vận hành & Khu vực",
    url: "/logistics",
    icon: Truck,
  },
  {
    title: "Dự báo AI",
    url: "/predict",
    icon: Bot,
  },
  {
    title: "Cài đặt",
    url: "/settings",
    icon: Settings,
  }
]
export function AppSidebar() {
  // Lấy đường dẫn hiện tại để làm sáng Tab tương ứng
  const pathname = usePathname()

  return (
    <Sidebar>
      {/* 1. HEADER SIDEBAR: LOGO VÀ TÊN PROJECT NHƯ FIGMA */}
      <SidebarHeader className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600 text-white font-black text-xl flex items-center justify-center h-10 w-10 shadow-md shadow-purple-500/20">
            BO
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              BI Dashboard
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <span>My Workspace</span>
              <ChevronsUpDown className="h-3 w-3" />
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* 2. MAIN MENU */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menu chính
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 mt-2">
              {items.map((item) => {
                // Kiểm tra xem tab này có đang được chọn không
                const isActive = pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    {/* Thêm hiệu ứng màu Tím/Xám mượt mà */}
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive} 
                      className={`
                        h-10 px-3 rounded-lg transition-all
                        ${isActive 
                          ? 'bg-purple-100/50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-medium' 
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}
                      `}
                    >
                      {/* Đổi <a> thành <Link> để load trang siêu tốc không bị chớp trắng */}
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className={`h-4 w-4 ${isActive ? "text-purple-600 dark:text-purple-400" : ""}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. FOOTER SIDEBAR: THÔNG TIN USER NHƯ FIGMA */}
      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold dark:bg-slate-800 dark:text-slate-300">
            AD
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Admin User
            </h4>
            <p className="text-xs text-muted-foreground truncate w-32">
              admin@olist.com
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}