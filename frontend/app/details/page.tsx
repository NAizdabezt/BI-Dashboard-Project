import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Import các Component
import { TopStateChart } from "@/components/top-state-chart"
import { HeatmapChart } from "@/components/heatmap-chart"
import { RFMTable } from "@/components/rfm-table"
import { Footer } from "@/components/footer"
import { PaymentChart } from "@/components/payment-chart"
import { OrderStatusChart } from "@/components/order-status-chart"
import { PriceTierChart } from "@/components/price-tier-chart"

export default function DetailsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Tiêu đề trang */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biểu đồ chi tiết (EDA)</h1>
          <p className="text-muted-foreground mt-2">
            Phân tích chuyên sâu về hành vi khách hàng, địa lý và phân khúc RFM.
          </p>
        </div>

        {/* HÀNG 1: TRẠNG THÁI ĐƠN HÀNG & PHƯƠNG THỨC THANH TOÁN */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tỷ lệ trạng thái đơn hàng</CardTitle>
              <CardDescription>Kiểm soát lượng đơn hủy và thành công</CardDescription>
            </CardHeader>
            <CardContent><OrderStatusChart /></CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Phương thức thanh toán</CardTitle>
              <CardDescription>Tỷ trọng doanh thu theo cổng thanh toán</CardDescription>
            </CardHeader>
            <CardContent><PaymentChart /></CardContent>
          </Card>
        </div>

        {/* HÀNG 2: TOP BANG & PHÂN KHÚC GIÁ */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Phân bổ doanh thu theo Bang</CardTitle>
              <CardDescription>Top 10 Bang có sức mua lớn nhất</CardDescription>
            </CardHeader>
            <CardContent><TopStateChart /></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tương quan Giá cả & Doanh thu</CardTitle>
              <CardDescription>Phân khúc giá mang lại lợi nhuận chính</CardDescription>
            </CardHeader>
            <CardContent><PriceTierChart /></CardContent>
          </Card>
        </div>

        {/* HÀNG 3: HEATMAP NẰM FULL NGANG Y NHƯ CŨ */}
        <Card>
          <CardHeader>
            <CardTitle>Giờ vàng mua sắm (Heatmap)</CardTitle>
            <CardDescription>Mật độ đơn hàng theo Thứ và Giờ trong ngày</CardDescription>
          </CardHeader>
          <CardContent><HeatmapChart /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân khúc khách hàng (RFM Segmentation)</CardTitle>
            <CardDescription>Phân loại khách hàng dựa trên Recency, Frequency, và Monetary</CardDescription>
          </CardHeader>
          <CardContent>
            <RFMTable />
          </CardContent>
        </Card>

        {/* Chân trang */}
        <Footer />
        
      </div>
    </DashboardLayout>
  )
}