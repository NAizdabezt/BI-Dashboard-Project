"use client"

import { AppSidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-4 bg-muted/50 dark:bg-black/50">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}