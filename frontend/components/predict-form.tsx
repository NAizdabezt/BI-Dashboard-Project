"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface PredictionData {
  date: string
  actual_revenue: number | null
  predicted_revenue: number
}

export function PredictForm() {
  const [days, setDays] = useState("30")
  const [prediction, setPrediction] = useState<PredictionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const daysNum = parseInt(days)
      if (![7, 14, 30].includes(daysNum)) {
        setError("Chỉ hỗ trợ dự báo 7, 14, hoặc 30 ngày")
        setLoading(false)
        return
      }

      const response = await fetch(`http://localhost:8000/api/predict?days=${daysNum}`)

      if (!response.ok) throw new Error("Failed to get prediction")

      const data: PredictionData[] = await response.json()
      setPrediction(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dự báo doanh thu</CardTitle>
          <CardDescription>
            Nhập số ngày cần dự báo để xem dự đoán doanh thu tương lai
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="7">7 ngày</option>
              <option value="14">14 ngày</option>
              <option value="30">30 ngày</option>
            </select>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang dự báo..." : "Dự báo"}
            </Button>
          </form>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </CardContent>
      </Card>

      {prediction.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả dự báo</CardTitle>
            <CardDescription>
              Dự đoán doanh thu cho {days} ngày tới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prediction}>
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
                                  Ngày
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {label}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Dự báo doanh thu
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
                  <Line
                    type="monotone"
                    dataKey="predicted_revenue"
                    stroke="#ff7300"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}