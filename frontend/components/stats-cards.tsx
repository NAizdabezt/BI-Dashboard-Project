"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, TrendingUp, BarChart3 } from "lucide-react"

interface SummaryData {
  totalRevenue: number
  totalOrders: number
  growthRate: number
  aov: number
}

interface StatCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative"
  icon: React.ComponentType<{ className?: string }>
}

function StatCard({ title, value, change, changeType, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
          {change}
        </p>
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/summary")
        if (!response.ok) throw new Error("Failed to fetch summary")
        const summary: SummaryData = await response.json()
        setData(summary)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No data</div>

  const stats = [
    {
      title: "Tổng doanh thu",
      value: `$${data.totalRevenue.toLocaleString()}`,
      change: "+20.1% từ tháng trước",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Tổng đơn hàng",
      value: data.totalOrders.toLocaleString(),
      change: "+15.3% từ tháng trước",
      changeType: "positive" as const,
      icon: ShoppingCart,
    },
    {
      title: "Tỷ lệ tăng trưởng",
      value: `${data.growthRate}%`,
      change: "-2.1% từ tháng trước",
      changeType: "negative" as const,
      icon: TrendingUp,
    },
    {
      title: "Giá trị đơn hàng trung bình",
      value: `$${data.aov.toFixed(2)}`,
      change: "+5.4% từ tháng trước",
      changeType: "positive" as const,
      icon: BarChart3,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}