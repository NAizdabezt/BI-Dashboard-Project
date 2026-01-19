"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  data: any[];
}

export default function RevenueLineChart({ data }: Props) {
  const chartData = useMemo(() => {
    // 1. Nhóm doanh thu theo ngày
    const dateMap: Record<string, number> = {};

    // Sắp xếp dữ liệu theo thời gian tăng dần
    const sortedData = [...data].sort((a, b) => 
      new Date(a.OrderDate).getTime() - new Date(b.OrderDate).getTime()
    );

    sortedData.forEach((order) => {
      // Chỉ lấy phần ngày (YYYY-MM-DD), bỏ qua giờ phút
      const dateStr = order.OrderDate.split(" ")[0]; 
      const revenue = parseFloat(order.Revenue || "0");

      if (dateMap[dateStr]) {
        dateMap[dateStr] += revenue;
      } else {
        dateMap[dateStr] = revenue;
      }
    });

    // Lấy 14 ngày gần nhất để biểu đồ đỡ bị dày đặc
    const allDates = Object.keys(dateMap);
    const recentDates = allDates.slice(-14); 
    const recentValues = recentDates.map(date => dateMap[date]);

    return {
      labels: recentDates, // Trục hoành: Ngày
      datasets: [
        {
          label: "Xu hướng Doanh thu (14 ngày qua)",
          data: recentValues, // Trục tung: Tiền
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          tension: 0.3, // Làm đường cong mềm mại
          fill: true,
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
        text: "Biểu đồ Xu Hướng Tiêu Dùng",
      },
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      {data.length > 0 ? (
        <Line options={options} data={chartData} />
      ) : (
        <p className="text-center text-gray-400">Đang tải...</p>
      )}
    </div>
  );
}