"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: any[];
}

export default function CategoryPieChart({ data }: Props) {
  const chartData = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    data.forEach((order) => {
      const cat = order.Category;
      // Đếm số lượng đơn hàng theo danh mục (hoặc tính doanh thu tùy bạn)
      if (categoryMap[cat]) {
        categoryMap[cat] += 1;
      } else {
        categoryMap[cat] = 1;
      }
    });

    return {
      labels: Object.keys(categoryMap),
      datasets: [
        {
          label: "Số lượng đơn",
          data: Object.values(categoryMap),
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
      title: {
        display: true,
        text: "Tỷ lệ Đơn hàng theo Danh mục",
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      {data.length > 0 ? (
        <Pie options={options} data={chartData} />
      ) : (
        <p className="text-center text-gray-400">Đang tải...</p>
      )}
    </div>
  );
}