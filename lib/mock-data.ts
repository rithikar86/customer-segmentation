// Mock data for the dashboard - simulating data from Python backend

export interface Customer {
  id: string
  recency: number
  frequency: number
  monetary: number
  segment: string
  lastPurchase: string
  totalOrders: number
}

export interface Product {
  id: string
  name: string
  score: number
  purchaseFrequency: number
  category: string
}

export interface Activity {
  id: string
  customerId: string
  action: string
  timestamp: string
  segment: string
}

export const segments = [
  { name: "Champions", color: "#3b82f6", count: 245 },
  { name: "Loyal Customers", color: "#22c55e", count: 412 },
  { name: "At Risk", color: "#f59e0b", count: 189 },
  { name: "New Customers", color: "#8b5cf6", count: 156 },
  { name: "Lost", color: "#ef4444", count: 98 },
]

export const kpiData = {
  totalCustomers: 1100,
  totalRevenue: 2456780,
  avgFrequency: 4.2,
  avgMonetary: 2233.44,
}

export const scatterData: Customer[] = Array.from({ length: 100 }, (_, i) => ({
  id: `CUST${String(i + 1).padStart(4, "0")}`,
  recency: Math.floor(Math.random() * 365),
  frequency: Math.floor(Math.random() * 20) + 1,
  monetary: Math.floor(Math.random() * 5000) + 100,
  segment: segments[Math.floor(Math.random() * segments.length)].name,
  lastPurchase: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  totalOrders: Math.floor(Math.random() * 50) + 1,
}))

export const recentActivity: Activity[] = [
  { id: "1", customerId: "CUST0012", action: "Made a purchase", timestamp: "2 min ago", segment: "Champions" },
  { id: "2", customerId: "CUST0034", action: "Segment upgraded", timestamp: "15 min ago", segment: "Loyal Customers" },
  { id: "3", customerId: "CUST0056", action: "New customer added", timestamp: "1 hour ago", segment: "New Customers" },
  { id: "4", customerId: "CUST0078", action: "Moved to At Risk", timestamp: "2 hours ago", segment: "At Risk" },
  { id: "5", customerId: "CUST0090", action: "Made a purchase", timestamp: "3 hours ago", segment: "Champions" },
]

export const recommendedProducts: Product[] = [
  { id: "P001", name: "Premium Laptop Stand", score: 0.95, purchaseFrequency: 234, category: "Electronics" },
  { id: "P002", name: "Wireless Earbuds Pro", score: 0.92, purchaseFrequency: 456, category: "Electronics" },
  { id: "P003", name: "Organic Coffee Beans", score: 0.89, purchaseFrequency: 789, category: "Food & Beverage" },
  { id: "P004", name: "Smart Water Bottle", score: 0.87, purchaseFrequency: 123, category: "Lifestyle" },
  { id: "P005", name: "Ergonomic Keyboard", score: 0.85, purchaseFrequency: 345, category: "Electronics" },
  { id: "P006", name: "Fitness Tracker Band", score: 0.83, purchaseFrequency: 567, category: "Wearables" },
  { id: "P007", name: "Portable Charger 20K", score: 0.81, purchaseFrequency: 678, category: "Electronics" },
  { id: "P008", name: "Yoga Mat Premium", score: 0.79, purchaseFrequency: 234, category: "Fitness" },
]

export function getSegmentColor(segment: string): string {
  const seg = segments.find((s) => s.name === segment)
  return seg?.color || "#6b7280"
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}
