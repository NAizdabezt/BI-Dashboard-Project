"use client"

import React, { useEffect, useState } from "react"

interface HeatmapData {
  weekday: string 
  hour: number
  orders: number
}

const dayMap: Record<string, number> = { 
  "Thứ 2": 0, "Thứ 3": 1, "Thứ 4": 2, "Thứ 5": 3, "Thứ 6": 4, "Thứ 7": 5, "Chủ Nhật": 6 
}
const daysOfWeekVietnamese = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

const hoursOfDay = Array.from({ length: 24 }, (_, i) => i)

const getColorForHeat = (orders: number, minOrders: number, maxOrders: number) => {
  if (orders === 0) return "hsl(0, 0%, 95%)"
  if (maxOrders === minOrders) return "hsl(20, 100%, 70%)"
  
  const ratio = (orders - minOrders) / (maxOrders - minOrders)
  const hue = 40 - ratio * 40
  const lightness = 90 - ratio * 40
  
  return `hsl(${hue}, 100%, ${lightness}%)`
}

export function HeatmapChart() {
  const [data, setData] = useState<HeatmapData[]>([])
  const [minOrders, setMinOrders] = useState(0)
  const [maxOrders, setMaxOrders] = useState(0)
  const [minOrderItem, setMinOrderItem] = useState<HeatmapData | null>(null)
  const [maxOrderItem, setMaxOrderItem] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/charts/shopping-behavior") 
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
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchHeatmapData()
  }, [])

  if (loading) return <div className="flex h-[350px] items-center justify-center text-muted-foreground">Đang tải biểu đồ giờ vàng...</div>

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
        
        {/* Đã thêm dark:bg-zinc-900 và dark:border-zinc-800 để nền ô vuông tối đi mượt mà */}
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
              
              {/* Đã thêm dark:text-gray-300 để chữ T2, T3 sáng lên trong nền đen */}
              <div className="flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                {dayLabel}
              </div>

              {grid[dayIndex].map((ordersCount, hour) => (
                <div 
                  key={`${dayIndex}-${hour}`} 
                  // Đã thêm dark:border-zinc-700 để viền các ô nhạt đi trong chế độ tối
                  className="aspect-square rounded border border-zinc-200 dark:border-zinc-700 transition-all hover:border-gray-400 hover:scale-110 cursor-pointer"
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
          {/* Đã thêm dark:border-zinc-700 */}
          <div className="w-20 h-2.5 rounded bg-gradient-to-r from-[hsl(40,100%,90%)] to-[hsl(0,100%,50%)] border border-zinc-300 dark:border-zinc-700" />
          {/* Đã thêm dark:text-gray-300 */}
          <span className="font-semibold text-gray-700 dark:text-gray-300">{maxOrders.toLocaleString()} đơn</span>
        </div>

        <div className="text-xs text-muted-foreground flex gap-4 pr-1 justify-end border-t pt-2 border-zinc-100 dark:border-zinc-800">
          {maxOrderItem && (
            <span>🔥 Giờ cao điểm: 
              {/* Đã thêm dark:text-white để chữ nổi bật rực rỡ */}
              <strong className="text-gray-900 dark:text-white ml-1">
                {maxOrderItem.weekday}, {maxOrderItem.hour}h ({maxOrderItem.orders.toLocaleString()} đơn hàng)
              </strong>
            </span>
          )}
          {minOrderItem && (
            <span>❄️ Giờ thấp điểm: 
              {/* Đã thêm dark:text-white */}
              <strong className="text-gray-900 dark:text-white ml-1">
                {minOrderItem.weekday}, {minOrderItem.hour}h ({minOrderItem.orders.toLocaleString()} đơn hàng)
              </strong>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}