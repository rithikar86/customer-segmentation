// VoltStream Mock Data - Electrical & Electronics Retail Intelligence
// RFM Segments: Elite Tech Buyers, Regular DIYers, One-time Project Buyers, Churn Risk

export interface Customer {
  id: string
  name: string
  email: string
  rfmScore: number
  segment: string
  totalSpent: number
  frequency: number
  recency: number
  lastPurchase: string
  sentiment: "positive" | "neutral" | "negative"
  feedbackScore: number
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  rating: number
  reviews: number
  image: string
  tags: string[]
}

export interface InventoryItem {
  productId: string
  name: string
  stock: number
  lowStockThreshold: number
  status: "healthy" | "warning" | "critical"
}

export interface Notification {
  id: number
  type: "stock" | "churn" | "feedback" | "sales"
  message: string
  timestamp: Date
  priority: "high" | "medium" | "low"
}

export interface Complaint {
  keyword: string
  severity: "low" | "medium" | "high"
  count: number
  products: string[]
  percentage: number
}

export const segments = [
  { name: "Elite Tech Buyers", color: "#3b82f6", count: 2 },
  { name: "Regular DIYers", color: "#22c55e", count: 2 },
  { name: "One-time Project Buyers", color: "#f59e0b", count: 2 },
  { name: "Churn Risk", color: "#ef4444", count: 2 },
]

export const mockCustomers: Customer[] = [
  { id: "C001", name: "John Smith", email: "john@example.com", rfmScore: 95, segment: "Elite Tech Buyers", totalSpent: 4850, frequency: 24, recency: 2, lastPurchase: "2024-04-10", sentiment: "positive", feedbackScore: 9.2 },
  { id: "C002", name: "Sarah Johnson", email: "sarah@example.com", rfmScore: 87, segment: "Elite Tech Buyers", totalSpent: 3620, frequency: 18, recency: 5, lastPurchase: "2024-04-08", sentiment: "positive", feedbackScore: 8.8 },
  { id: "C003", name: "Mike Chen", email: "mike@example.com", rfmScore: 72, segment: "Regular DIYers", totalSpent: 2140, frequency: 12, recency: 8, lastPurchase: "2024-04-05", sentiment: "positive", feedbackScore: 8.1 },
  { id: "C004", name: "Emma Wilson", email: "emma@example.com", rfmScore: 65, segment: "Regular DIYers", totalSpent: 1890, frequency: 9, recency: 12, lastPurchase: "2024-03-30", sentiment: "neutral", feedbackScore: 7.2 },
  { id: "C005", name: "Alex Martinez", email: "alex@example.com", rfmScore: 45, segment: "One-time Project Buyers", totalSpent: 820, frequency: 2, recency: 35, lastPurchase: "2024-02-15", sentiment: "positive", feedbackScore: 7.8 },
  { id: "C006", name: "Lisa Anderson", email: "lisa@example.com", rfmScore: 38, segment: "One-time Project Buyers", totalSpent: 640, frequency: 1, recency: 58, lastPurchase: "2024-01-20", sentiment: "neutral", feedbackScore: 6.9 },
  { id: "C007", name: "David Brown", email: "david@example.com", rfmScore: 22, segment: "Churn Risk", totalSpent: 1250, frequency: 5, recency: 120, lastPurchase: "2023-12-15", sentiment: "negative", feedbackScore: 4.2 },
  { id: "C008", name: "Jennifer Lee", email: "jen@example.com", rfmScore: 28, segment: "Churn Risk", totalSpent: 920, frequency: 3, recency: 95, lastPurchase: "2023-12-30", sentiment: "negative", feedbackScore: 5.1 },
]

export const mockProducts: Product[] = [
  { id: "P001", name: "Professional LED Drill Kit", category: "Power Tools", price: 189.99, rating: 4.8, reviews: 234, image: "🔧", tags: ["Premium", "Professional"] },
  { id: "P002", name: "Smart Home Automation Starter", category: "Smart Electronics", price: 249.99, rating: 4.6, reviews: 156, image: "🏠", tags: ["Smart", "Trending"] },
  { id: "P003", name: "Industrial Cordless Drill", category: "Power Tools", price: 279.99, rating: 4.7, reviews: 189, image: "⚡", tags: ["Professional", "Heavy-Duty"] },
  { id: "P004", name: "Electrical Component Starter Pack", category: "Electrical Components", price: 59.99, rating: 4.5, reviews: 342, image: "📦", tags: ["Value", "Beginner-Friendly"] },
  { id: "P005", name: "WiFi Smart Lighting System", category: "Smart Electronics", price: 129.99, rating: 4.4, reviews: 298, image: "💡", tags: ["Smart", "Energy-Efficient"] },
  { id: "P006", name: "Heavy-Duty Wire Strippers Set", category: "Hand Tools", price: 34.99, rating: 4.9, reviews: 412, image: "✂️", tags: ["Essential", "Best-Seller"] },
  { id: "P007", name: "Solar Panel Kit 5kW", category: "Energy Solutions", price: 2199.99, rating: 4.7, reviews: 87, image: "☀️", tags: ["Green", "Premium"] },
  { id: "P008", name: "USB Charging Hub Pro", category: "Accessories", price: 24.99, rating: 4.3, reviews: 567, image: "🔌", tags: ["Value", "Essential"] },
]

export const mockInventory: InventoryItem[] = [
  { productId: "P001", name: "Professional LED Drill Kit", stock: 12, lowStockThreshold: 20, status: "warning" },
  { productId: "P002", name: "Smart Home Automation Starter", stock: 34, lowStockThreshold: 25, status: "healthy" },
  { productId: "P004", name: "Electrical Component Starter Pack", stock: 5, lowStockThreshold: 15, status: "critical" },
  { productId: "P005", name: "WiFi Smart Lighting System", stock: 18, lowStockThreshold: 20, status: "warning" },
  { productId: "P007", name: "Solar Panel Kit 5kW", stock: 2, lowStockThreshold: 5, status: "critical" },
]

export const mockNotifications: Notification[] = [
  { id: 1, type: "stock", message: "Solar Panel Kit 5kW critically low (2 units)", timestamp: new Date(Date.now() - 5 * 60000), priority: "high" },
  { id: 2, type: "churn", message: "David Brown inactive for 120 days - Churn risk detected", timestamp: new Date(Date.now() - 15 * 60000), priority: "high" },
  { id: 3, type: "feedback", message: "Negative feedback spike on Power Tools category", timestamp: new Date(Date.now() - 45 * 60000), priority: "medium" },
  { id: 4, type: "sales", message: "Elite Tech Buyers segment conversion: +12% this week", timestamp: new Date(Date.now() - 120 * 60000), priority: "low" },
  { id: 5, type: "stock", message: "Professional LED Drill Kit low stock (12 units)", timestamp: new Date(Date.now() - 180 * 60000), priority: "medium" },
]

export const mockComplaints: Complaint[] = [
  { keyword: "Quality issues", severity: "high", count: 12, products: ["P001", "P003"], percentage: 35 },
  { keyword: "Defective on arrival", severity: "high", count: 8, products: ["P002", "P005"], percentage: 23 },
  { keyword: "Poor documentation", severity: "medium", count: 6, products: ["P007"], percentage: 17 },
  { keyword: "Slow shipping", severity: "medium", count: 5, products: ["P001", "P004"], percentage: 14 },
  { keyword: "Not as described", severity: "low", count: 3, products: ["P008"], percentage: 9 },
]

export const mockDashboardData = {
  totalCustomers: 8,
  activeSegments: 4,
  lowStockAlerts: 3,
  campaignConversionRate: 23.5,
  avgOrderValue: 1565,
  churnRiskCount: 2,
}

export const mockCategorySales = [
  { category: "Power Tools", sales: 12450, percentage: 28 },
  { category: "Smart Electronics", sales: 9820, percentage: 22 },
  { category: "Electrical Components", sales: 7650, percentage: 17 },
  { category: "Hand Tools", sales: 6340, percentage: 14 },
  { category: "Energy Solutions", sales: 5280, percentage: 12 },
  { category: "Accessories", sales: 2560, percentage: 7 },
]

export const mockSegmentOffers = {
  "Elite Tech Buyers": {
    offer: "Exclusive 15% off professional equipment",
    message: "Premium members get early access to new releases",
    incentive: "Free shipping on orders over $200",
  },
  "Regular DIYers": {
    offer: "Bundle deals: Buy 2, save 20%",
    message: "Perfect for your next home project",
    incentive: "Loyalty points on every purchase",
  },
  "One-time Project Buyers": {
    offer: "Come back and save 10%",
    message: "We&apos;ve added new products since your last visit",
    incentive: "Free returns within 60 days",
  },
  "Churn Risk": {
    offer: "We miss you! 25% off your next order",
    message: "See what&apos;s new and improved",
    incentive: "Exclusive access to clearance items",
  },
}

export const mockRecommendationRules = [
  { segment: "Elite Tech Buyers", category: "Power Tools", relatedCategories: ["Smart Electronics", "Accessories"], confidence: 0.92 },
  { segment: "Elite Tech Buyers", category: "Energy Solutions", relatedCategories: ["Smart Electronics", "Electrical Components"], confidence: 0.88 },
  { segment: "Regular DIYers", category: "Power Tools", relatedCategories: ["Hand Tools", "Electrical Components"], confidence: 0.85 },
  { segment: "One-time Project Buyers", category: "Electrical Components", relatedCategories: ["Hand Tools", "Accessories"], confidence: 0.79 },
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
