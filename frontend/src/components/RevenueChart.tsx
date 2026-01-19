"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useMemo } from "react";

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueChartProps {
  data: any[]; // Nhận dữ liệu từ trang chủ truyền vào
}

export default function RevenueChart({ data }: RevenueChartProps) {
  // Hàm xử lý dữ liệu: Gom nhóm Doanh thu theo Danh mục
  const chartData = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    data.forEach((order) => {
      const cat = order.Category;
      const revenue = parseFloat(order.Revenue || "0"); // Chuyển chuỗi sang số
      
      if (categoryMap[cat]) {
        categoryMap[cat] += revenue;
      } else {
        categoryMap[cat] = revenue;
      }
    });

    return {
      labels: Object.keys(categoryMap), // Tên danh mục (trục hoành)
      datasets: [
        {
          label: "Doanh thu (VND)",
          data: Object.values(categoryMap), // Số tiền (trục tung)
          backgroundColor: "rgba(59, 130, 246, 0.5)", // Màu xanh dương
          borderColor: "rgb(29, 78, 216)",
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: "Tổng Doanh Thu Theo Danh Mục",
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      {data.length > 0 ? (
        <Bar options={options} data={chartData} />
      ) : (
        <p className="text-center text-gray-400">Đang tải biểu đồ...</p>
      )}
    </div>
  );
}