import { Users, DollarSign, TrendingUp, BarChart3 } from "lucide-react"
import { KPICard } from "@/components/kpi-card"
import { ChartCard } from "@/components/chart-card"
import { RFMScatterChart, SegmentPieChart } from "@/components/dashboard-charts"
import { ActivityPanel } from "@/components/activity-panel"
import { kpiData, formatCurrency, formatNumber } from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Customers"
          value={formatNumber(kpiData.totalCustomers)}
          change="+12% from last month"
          changeType="positive"
          icon={Users}
        />
        <KPICard
          title="Total Revenue"
          value={formatCurrency(kpiData.totalRevenue)}
          change="+8.2% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <KPICard
          title="Avg Frequency"
          value={kpiData.avgFrequency.toFixed(1)}
          change="+0.3 from last month"
          changeType="positive"
          icon={TrendingUp}
        />
        <KPICard
          title="Avg Monetary Value"
          value={formatCurrency(kpiData.avgMonetary)}
          change="-2.1% from last month"
          changeType="negative"
          icon={BarChart3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="RFM Scatter Plot"
          subtitle="Recency vs Monetary by Segment"
        >
          <RFMScatterChart />
        </ChartCard>

        <ChartCard
          title="Segment Distribution"
          subtitle="Customer count by segment"
        >
          <SegmentPieChart />
        </ChartCard>
      </div>

      {/* Activity Panel */}
      <ChartCard title="Recent Activity" subtitle="Latest customer activities">
        <ActivityPanel />
      </ChartCard>
    </div>
  )
}
