"use client";

import { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react"; // Icon đẹp
import RevenueChart from "../src/components/RevenueChart";
import CategoryPieChart from "../src/components/CategoryPieChart";
import RevenueLineChart from "../src/components/RevenueLineChart";

export default function Home() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const DATA_URL = "https://raw.githubusercontent.com/NAizdabezt/BI-Dashboard-Project/refs/heads/main/data/live/sales_dashboard.csv";
    
    fetch(DATA_URL)
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data as any[]);
          },
        });
      });
  }, []);

  // --- TÍNH TOÁN CÁC CON SỐ TỔNG QUAN (KPI) ---
  const stats = useMemo(() => {
    const totalRevenue = data.reduce((sum, order) => sum + (parseFloat(order.Revenue) || 0), 0);
    const totalOrders = data.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      revenue: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue),
      orders: totalOrders,
      avg: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(avgOrderValue),
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header - Giữ nguyên */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            🚀 Dashboard Kinh Doanh
          </h1>
          <p className="text-gray-500">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* 1. KHU VỰC KPI CARDS - Giữ nguyên */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           {/* ... (Code 3 cái thẻ giữ nguyên) ... */}
           {/* (Copy lại đoạn code hiển thị 3 thẻ ở đây) */}
        </div>

        {/* 2. KHU VỰC BIỂU ĐỒ XU HƯỚNG (ĐƯA RA NGOÀI GRID) */}
        {/* Để nó nằm riêng ở đây để tràn màn hình cho đẹp */}
        <div className="mb-8">
           <RevenueLineChart data={data} />
        </div>

        {/* 3. KHU VỰC BIỂU ĐỒ CHI TIẾT (CỘT & TRÒN) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Biểu đồ Cột (Chiếm 2 phần) */}
          <div className="md:col-span-2">
            <RevenueChart data={data} />
          </div>
          
          {/* Biểu đồ Tròn (Chiếm 1 phần) */}
          <div className="md:col-span-1">
             <CategoryPieChart data={data} />
          </div>
        </div>

      </div>
    </div>
  );
}