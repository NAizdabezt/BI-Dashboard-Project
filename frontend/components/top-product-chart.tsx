"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"

interface TopProduct {
  product_name: string
  revenue: number
  orders: number
}

const mockData = [
  { product_name: "Sản phẩm A", revenue: 400, orders: 10 },
  { product_name: "Sản phẩm B", revenue: 300, orders: 8 },
  { product_name: "Sản phẩm C", revenue: 200, orders: 5 },
  { product_name: "Sản phẩm D", revenue: 278, orders: 7 },
  { product_name: "Sản phẩm E", revenue: 189, orders: 4 },
]

export function TopProductChart() {
  const [data, setData] = useState<TopProduct[]>(mockData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/products/top?limit=5")
        if (!response.ok) throw new Error("Failed to fetch products")
        const products: TopProduct[] = await response.json()
        // Remove codes from product names (e.g., "#bb50f2" -> "")
        const cleanedProducts = products.map(p => ({
          ...p,
          product_name: p.product_name.replace(/\s*\(#[a-f0-9]+\)\s*/gi, '')
        }))
        setData(cleanedProducts)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchTopProducts()
  }, [])

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="product_name"
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
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as TopProduct
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Sản phẩm
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {item.product_name}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Doanh thu
                        </span>
                        <span className="font-bold">
                          ${item.revenue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="revenue" fill="#8884d8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}