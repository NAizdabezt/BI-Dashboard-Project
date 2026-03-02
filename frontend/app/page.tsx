import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCards } from "@/components/stats-cards"
import { RevenueChart } from "@/components/revenue-chart"
import { TopProductChart } from "@/components/top-product-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <StatsCards />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Biến động doanh thu</CardTitle>
              <CardDescription>
                Doanh thu theo tháng trong năm
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
      </div>
    </DashboardLayout>
  )
}
