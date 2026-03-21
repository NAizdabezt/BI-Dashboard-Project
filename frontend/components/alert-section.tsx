"use client"
import { useEffect, useState } from "react"
// Import icons cho dynamic usage
import { TrendingDown, TrendingUp, Info } from "lucide-react"

// 1. Nhận ngày từ page.tsx (Giữ nguyên phần Props thông minh)
interface AlertSectionProps {
  startDate: string
  endDate: string
}

interface AlertData {
  title: string
  description: string
  type: "warning" | "success" | "info" // API trả về 3 kiểu này
}

export function AlertSection({ startDate, endDate }: AlertSectionProps) {
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true)
      try {
        // Gọi API thật từ Backend
        const response = await fetch(`https://bi-dashboard-project.onrender.com/api/insights?start_date=${startDate}&end_date=${endDate}`)
        if (response.ok) {
          const data = await response.json()
          setAlerts(data)
        }
      } catch (error) {
        console.error("Lỗi tải cảnh báo:", error)
      } finally {
        setLoading(false)
      }
    }

    if (startDate && endDate) {
      fetchAlerts()
    }
  }, [startDate, endDate]) // Tự load lại khi ngày thay đổi

  if (loading) return <div className="h-20 bg-muted animate-pulse rounded-lg"></div>
  if (alerts.length === 0) return null 

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {alerts.map((alert, i) => {
        
        // 2. LOGIC ĐỊNH DẠNG STYLE VÀ ICON (Khôi phục lại bản cũ đẹp mắt)
        // Mặc định là Info (màu xanh dương)
        let containerStyle = "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"; 
        let titleColor = "text-blue-800 dark:text-blue-400";
        let Icon = Info;

        // Khôi phục màu Vàng Amber đẹp mắt cho cảnh báo
        if (alert.type === "warning") {
          containerStyle = "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900";
          titleColor = "text-amber-800 dark:text-amber-400";
          Icon = TrendingDown; 
        } 
        // Khôi phục màu Xanh Emerald đẹp mắt cho thành công
        else if (alert.type === "success") {
          containerStyle = "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900";
          titleColor = "text-emerald-800 dark:text-emerald-400";
          Icon = TrendingUp;
        }

        // 3. RENDER GIAO DIỆN (Sử dụng lại cấu trúc đẹp mắt lúc nãy)
        return (
          <div key={i} className={`flex items-start gap-4 p-4 rounded-lg border ${containerStyle}`}>
            <div className="mt-0.5">
              <Icon className="h-4 w-4" /> {/* Kích thước icon chuẩn */}
            </div>
            <div>
              <h4 className={`text-sm font-bold ${titleColor}`}>
                {alert.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {alert.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  )
}