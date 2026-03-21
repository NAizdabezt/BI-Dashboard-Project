"use client"

import React, { useEffect, useState } from "react"

interface HeatmapData {
  weekday: string 
  hour: number
  orders: number
}

// 1. Thêm Props để nhận dữ liệu từ Tầng Mây
interface HeatmapChartProps {
  startDate: string
  endDate: string
  category: string
}

const dayMap: Record<string, number> = { 
  "Thứ 2": 0, "Thứ 3": 1, "Thứ 4": 2, "Thứ 5": 3, "Thứ 6": 4, "Thứ 7": 5, "Chủ Nhật": 6 
}
const daysOfWeekVietnamese = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

const hoursOfDay = Array.from({ length: 24 }, (_, i) => i)

const getColorForHeat = (orders: number, minOrders: number, maxOrders: number) => {
  // 💡 ĐÃ SỬA: Nếu 0 đơn thì trả về undefined để Tailwind tự lo màu nền (Sáng/Tối)
  if (orders === 0) return undefined 
  if (maxOrders === minOrders) return "hsl(20, 100%, 70%)"
  
  const ratio = (orders - minOrders) / (maxOrders - minOrders)
  const hue = 40 - ratio * 40
  const lightness = 90 - ratio * 40
  
  return `hsl(${hue}, 100%, ${lightness}%)`
}

export function HeatmapChart({ startDate, endDate, category }: HeatmapChartProps) {
  const [data, setData] = useState<HeatmapData[]>([])
  const [minOrders, setMinOrders] = useState(0)
  const [maxOrders, setMaxOrders] = useState(0)
  const [minOrderItem, setMinOrderItem] = useState<HeatmapData | null>(null)
  const [maxOrderItem, setMaxOrderItem] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHeatmapData = async () => {
      setLoading(true)
      try {
        // 2. Dùng biến môi trường để chạy mượt cả ở Local và Server
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        
        // 3. Nối ống nước dữ liệu vào API
        const response = await fetch(`${baseUrl}/api/charts/shopping-behavior?start_date=${startDate}&end_date=${endDate}&category=${category}`) 
        
        if (!response.ok) throw new Error("Failed to fetch behavior")
        const rawData: HeatmapData[] = await response.json()
        
        setData(rawData)
        
        const ordersArray = rawData.map(d => d.orders)
        if (ordersArray.length > 0) {
          const minVal = Math.min(...ordersArray)
          const maxVal = Math.max(...ordersArray)
          setMinOrders(minVal)
          setMaxOrders(maxVal)
          
          setMinOrderItem(rawData.find(d => d.orders === minVal) || null)
          setMaxOrderItem(rawData.find(d => d.orders === maxVal) || null)
        } else {
          // Reset nếu danh mục này không có ai mua
          setMinOrders(0)
          setMaxOrders(0)
          setMinOrderItem(null)
          setMaxOrderItem(null)
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchHeatmapData()
  }, [startDate, endDate, category]) // 4. Lắng nghe thay đổi của bộ lọc

  if (loading) return <div className="flex h-[350px] items-center justify-center text-muted-foreground animate-pulse bg-slate-50 dark:bg-zinc-900/20 rounded-lg">Đang phân tích giờ vàng mua sắm...</div>

  // Khởi tạo ma trận rỗng
  const grid = daysOfWeekVietnamese.map(day => new Array(24).fill(0))
  data.forEach(item => {
    const dayIndex = dayMap[item.weekday]
    if (dayIndex !== undefined && item.hour >= 0 && item.hour < 24) {
      grid[dayIndex][item.hour] = item.orders
    }
  })

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="w-full overflow-x-auto">
        
        <div className="grid grid-cols-[30px_repeat(24,1fr)] gap-0.5 border dark:border-zinc-800 p-1 rounded-lg bg-white dark:bg-zinc-900 shadow-inner min-w-[600px] w-full">
          
          <div className="col-start-2 col-end-[26] grid grid-cols-24 gap-0.5 mb-1">
            {hoursOfDay.map(hour => (
              <div key={hour} className="text-center text-[10px] text-muted-foreground">
                {hour % 6 === 0 ? `${hour}h` : ""}
              </div>
            ))}
          </div>

          {daysOfWeekVietnamese.map((dayLabel, dayIndex) => (
            <React.Fragment key={dayIndex}>
              
              <div className="flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                {dayLabel}
              </div>

              {grid[dayIndex].map((ordersCount, hour) => (
                <div 
                  key={`${dayIndex}-${hour}`} 
                  // 💡 ĐÃ SỬA: Thêm class bg-zinc-100 dark:bg-zinc-800/50 cho các ô 0 đơn hàng
                  className="aspect-square rounded border border-zinc-200 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800/40 transition-all hover:border-gray-400 hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: getColorForHeat(ordersCount, minOrders, maxOrders) }}
                  title={`${dayLabel}, ${hour}h: ${ordersCount.toLocaleString()} đơn hàng`}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground pr-1">
          <span>Ít đơn</span>
          <div className="w-20 h-2.5 rounded bg-gradient-to-r from-[hsl(40,100%,90%)] to-[hsl(0,100%,50%)] border border-zinc-300 dark:border-zinc-700" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">{maxOrders.toLocaleString()} đơn</span>
        </div>

        <div className="text-xs text-muted-foreground flex gap-4 pr-1 justify-end border-t pt-2 border-zinc-100 dark:border-zinc-800">
          {maxOrderItem && (
            <span>🔥 Giờ cao điểm: 
              <strong className="text-gray-900 dark:text-white ml-1">
                {maxOrderItem.weekday}, {maxOrderItem.hour}h ({maxOrderItem.orders.toLocaleString()} đơn)
              </strong>
            </span>
          )}
          {minOrderItem && (
            <span>❄️ Giờ thấp điểm: 
              <strong className="text-gray-900 dark:text-white ml-1">
                {minOrderItem.weekday}, {minOrderItem.hour}h ({minOrderItem.orders.toLocaleString()} đơn)
              </strong>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}