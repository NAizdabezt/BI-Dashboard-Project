"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from "recharts"

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

      if (!response.ok) throw new Error("Lấy dữ liệu dự báo thất bại")

      const data: PredictionData[] = await response.json()
      setPrediction(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi hệ thống không xác định")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dự báo doanh thu tương lai</CardTitle>
          <CardDescription>
            Nhập số ngày cần dự báo (7, 14 hoặc 30) để xem AI Prophet phân tích
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
              {loading ? "Đang dự báo..." : "Dự báo bằng AI"}
            </Button>
          </form>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </CardContent>
      </Card>

      {prediction.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả dự báo AI</CardTitle>
            <CardDescription>
              So sánh doanh thu thực tế 30 ngày qua và dự đoán {days} ngày tới (Đơn vị: BRL)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prediction} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`R$ ${value}`, ""]}
                    labelStyle={{ color: 'black', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  
                  {/* Dây 1: Doanh thu thực tế (Màu xanh, nét liền) */}
                  <Line
                    name="Thực tế (Quá khứ)"
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