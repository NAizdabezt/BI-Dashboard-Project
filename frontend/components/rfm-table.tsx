"use client"

import React from "react"
// 👇 1. ĐÃ KẾT NỐI: Import ống dẫn nước tiền tệ 👇
import { useCurrency } from "@/contexts/CurrencyContext"

// Dữ liệu mẫu (Sau này bạn fetch từ API FastAPI thay vào đây)
const mockData = [
  // 👇 2. ĐÃ SỬA: Bổ sung mã màu hỗ trợ giao diện Dark Mode siêu đẹp 👇
  { segment: "Khách VIP (Champions)", count: 1250, revenue: 450000, color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { segment: "Khách trung thành", count: 3420, revenue: 680000, color: "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  { segment: "Nguy cơ rời bỏ", count: 2100, revenue: 120000, color: "text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
  { segment: "Ngủ đông", count: 5400, revenue: 210000, color: "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400" }
]

export function RFMTable() {
  // 👇 3. GỌI HÀM MA THUẬT 👇
  const { formatMoney } = useCurrency()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg font-bold">Phân khúc RFM</th>
            <th className="px-4 py-3 text-right font-bold">Số lượng khách</th>
            {/* Đã gỡ bỏ chữ (R$) đóng cứng */}
            <th className="px-4 py-3 text-right rounded-tr-lg font-bold">Tổng chi tiêu</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {mockData.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-4 font-medium">
                {/* Các nhãn phân khúc giờ đây sẽ tối đi rất mượt trong Dark mode */}
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${row.color}`}>
                  {row.segment}
                </span>
              </td>
              <td className="px-4 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                {row.count.toLocaleString()}
              </td>
              <td className="px-4 py-4 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {/* 👇 4. ĐÃ SỬA: Tiền tệ sẽ tự động biến hóa và không bị rớt dòng 👇 */}
                {formatMoney(row.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}