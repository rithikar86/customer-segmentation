import { AlertTriangle, DollarSign, TrendingUp, Zap } from "lucide-react"
import { KPICard } from "@/components/kpi-card"
import { ChartCard } from "@/components/chart-card"
import { SegmentPieChart, CategorySalesChart, InventoryAlertWidget, NotificationFeed } from "@/components/dashboard-charts"
import { mockDashboardData, mockSegmentOffers, formatCurrency, formatNumber } from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Customers"
          value={formatNumber(mockDashboardData.totalCustomers)}
          change="+12% from last month"
          changeType="positive"
          icon={Zap}
        />
        <KPICard
          title="Avg Order Value"
          value={formatCurrency(mockDashboardData.avgOrderValue)}
          change="+8.2% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <KPICard
          title="Low Stock Alerts"
          value={formatNumber(mockDashboardData.lowStockAlerts)}
          change="Urgent action needed"
          changeType="negative"
          icon={AlertTriangle}
        />
        <KPICard
          title="Campaign Conversion"
          value={mockDashboardData.campaignConversionRate.toFixed(1) + "%"}
          change="+3.2% from last month"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Sales by Category"
          subtitle="Revenue distribution across product categories"
        >
          <CategorySalesChart />
        </ChartCard>

        <ChartCard
          title="Customer Segments"
          subtitle="Distribution across RFM segments"
        >
          <SegmentPieChart />
        </ChartCard>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InventoryAlertWidget />
        <NotificationFeed />
      </div>

      {/* Segment Offers */}
      <ChartCard title="Dynamic Offers by Segment" subtitle="Personalized campaigns to drive engagement">
        <div className="space-y-3">
          {Object.entries(mockSegmentOffers).map(([segment, offer]) => (
            <div key={segment} className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{segment}</h4>
                  <p className="text-sm text-accent font-medium mt-1">{offer.offer}</p>
                  <p className="text-xs text-muted-foreground mt-2">{offer.message}</p>
                  <p className="text-xs text-primary font-medium mt-2">✨ {offer.incentive}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
