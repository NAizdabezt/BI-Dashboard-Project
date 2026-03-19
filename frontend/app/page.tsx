import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCards } from "@/components/stats-cards"
import { RevenueChart } from "@/components/revenue-chart"
import { TopProductChart } from "@/components/top-product-chart"
import { PredictForm } from "@/components/predict-form" // <-- Import thêm vũ khí AI vào đây
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <DashboardLayout>
      {/* Tăng space-y-4 lên space-y-6 để các khu vực cách nhau thoáng hơn */}
      <div className="space-y-6"> 
        
        {/* HÀNG 1: THẺ CHỈ SỐ TỔNG QUAN */}
        <StatsCards />

        {/* HÀNG 2: BIỂU ĐỒ AI DỰ BÁO (Cho nằm nguyên 1 hàng dài để dễ xem mốc thời gian) */}
        <PredictForm />

        {/* HÀNG 3: CÁC BIỂU ĐỒ PHÂN TÍCH CHI TIẾT (Chia 2 cột) */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Biến động doanh thu</CardTitle>
              <CardDescription>
                Doanh thu theo ngày trong năm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top 5 sản phẩm bán chạy</CardTitle>
              <CardDescription>
                Sản phẩm có doanh số cao nhất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopProductChart />
            </CardContent>
          </Card>
        </div>
      {/* Chân trang */}
              <Footer />  
      </div>
    </DashboardLayout>
  )
}