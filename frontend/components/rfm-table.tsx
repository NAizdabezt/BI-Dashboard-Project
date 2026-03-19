"use client"

import React from "react"

// Dữ liệu mẫu (Sau này bạn fetch từ API FastAPI thay vào đây)
const mockData = [
  { segment: "Khách VIP (Champions)", count: 1250, revenue: 450000, color: "text-emerald-700 bg-emerald-100" },
  { segment: "Khách trung thành", count: 3420, revenue: 680000, color: "text-blue-700 bg-blue-100" },
  { segment: "Nguy cơ rời bỏ", count: 2100, revenue: 120000, color: "text-amber-700 bg-amber-100" },
  { segment: "Ngủ đông", count: 5400, revenue: 210000, color: "text-red-700 bg-red-100" }
]

export function RFMTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Phân khúc RFM</th>
            <th className="px-4 py-3 text-right">Số lượng khách</th>
            <th className="px-4 py-3 text-right rounded-tr-lg">Tổng chi tiêu (R$)</th>
          </tr>
        </thead>
        <tbody>
          {mockData.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-4 font-medium">
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${row.color}`}>
                  {row.segment}
                </span>
              </td>
              <td className="px-4 py-4 text-right font-medium">{row.count.toLocaleString()}</td>
              <td className="px-4 py-4 text-right">R$ {row.revenue.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}