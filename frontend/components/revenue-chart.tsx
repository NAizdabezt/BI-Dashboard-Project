"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface HistoricalData {
  date: string
  revenue: number
}

const data: HistoricalData[] = [
  { date: "Jan", revenue: 4000 },
  { date: "Feb", revenue: 3000 },
  { date: "Mar", revenue: 5000 },
  { date: "Apr", revenue: 4500 },
  { date: "May", revenue: 6000 },
  { date: "Jun", revenue: 5500 },
  { date: "Jul", revenue: 7000 },
  { date: "Aug", revenue: 6500 },
  { date: "Sep", revenue: 8000 },
  { date: "Oct", revenue: 7500 },
  { date: "Nov", revenue: 9000 },
  { date: "Dec", revenue: 8500 },
]

export function RevenueChart() {
  const [chartData, setChartData] = useState<HistoricalData[]>(data)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistorical = async () => {
      setLoading(true)
      try {
        const response = await fetch("http://localhost:8000/api/historical")
        if (!response.ok) throw new Error("Failed to fetch historical data")
        const historical: HistoricalData[] = await response.json()
        setChartData(historical)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        // Fallback to sample data
        setChartData(data)
      } finally {
        setLoading(false)
      }
    }

    fetchHistorical()
  }, [])

  if (loading) return <div>Loading chart...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Tháng
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {label}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Doanh thu
                        </span>
                        <span className="font-bold">
                          ${payload[0].value}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}