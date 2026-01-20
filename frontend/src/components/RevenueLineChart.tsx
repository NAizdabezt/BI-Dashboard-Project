"use client";

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// 1. Định nghĩa kiểu dữ liệu đầu vào
interface RawDataItem {
  order_purchase_timestamp: string;
  price: number | string;
  [key: string]: any;
}

interface RevenueLineChartProps {
  data: RawDataItem[];
}

export default function RevenueLineChart({ data }: RevenueLineChartProps) {
  
  // 2. Xử lý dữ liệu: Gom nhóm theo ngày & Tính tổng tiền
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const dailyRevenue: Record<string, number> = {};

    data.forEach((item) => {
      // Lấy ngày tháng an toàn
      const timeStr = item.order_purchase_timestamp || item.OrderDate;
      if (!timeStr) return;

      try {
        const dateKey = String(timeStr).split(' ')[0]; // Lấy phần ngày YYYY-MM-DD
        const value = parseFloat(String(item.price || item.Revenue || 0));

        if (!dailyRevenue[dateKey]) {
          dailyRevenue[dateKey] = 0;
        }
        dailyRevenue[dateKey] += value;
        
      } catch (e) {
        console.error("Lỗi xử lý dòng:", item);
      }
    });

    // Chuyển object thành array và sắp xếp
    const sortedData = Object.keys(dailyRevenue)
      .sort()
      .map((date) => ({
        date,
        revenue: Math.round(dailyRevenue[date]),
      }));

    return sortedData;
  }, [data]);

  if (chartData.length === 0) {
    return <div className="p-4 text-center text-gray-500">Đang chờ dữ liệu...</div>;
  }

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">Doanh thu theo ngày</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(str) => {
                const d = new Date(str);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          
          <YAxis 
            tickFormatter={(value) => `$${value.toLocaleString()}`} 
          />
          
          {/* Đã sửa lỗi cú pháp ở đoạn Tooltip này */}
          <Tooltip 
            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Doanh thu"]}
            labelFormatter={(label) => `Ngày: ${label}`}
          />
          
          <Legend />
          
          <Line 
            type="monotone" 
            dataKey="revenue" 
            name="Tổng doanh thu"
            stroke="#8884d8" 
            strokeWidth={2}
            activeDot={{ r: 8 }} 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}