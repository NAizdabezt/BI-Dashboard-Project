"use client"

import React, { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface PaymentData {
  name: string
  value: number
}

// Bảng màu hiện đại cho biểu đồ
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// HÀM TÍNH TOÁN VÀ VẼ PHẦN TRĂM LÊN BÁNH DONUT
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  // Tính toán vị trí đặt text (nằm chính giữa mảng màu)
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Chỉ hiển thị chữ nếu lát bánh chiếm hơn 5% tổng doanh thu (để chống lẹm chữ)
  if (percent < 0.05) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" // Chữ màu trắng nổi bật trên nền màu của lát bánh
      textAnchor="middle" 
      dominantBaseline="central" 
      fontSize={12} 
      fontWeight="bold"
      className="drop-shadow-md" // Thêm đổ bóng nhẹ để chữ rõ hơn
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export function PaymentChart() {
  const [data, setData] = useState<PaymentData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch("https://bi-dashboard-project.onrender.com/api/charts/payment-methods")
        if (!response.ok) throw new Error("Failed to fetch")
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  if (loading) return <div className="flex h-[300px] items-center justify-center text-muted-foreground">Đang tải dữ liệu...</div>

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60} 
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
            labelLine={false} // Tắt đường chỉ dẫn mặc định
            label={renderCustomizedLabel} // GỌI HÀM VẼ PHẦN TRĂM VÀO ĐÂY
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => `R$ ${value.toLocaleString()}`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}