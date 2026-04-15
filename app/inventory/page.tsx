"use client"

import { useState } from "react"
import { ChartCard } from "@/components/chart-card"
import { mockInventoryProducts, formatCurrency } from "@/lib/mock-data"
import { AlertTriangle, TrendingDown, TrendingUp, Search } from "lucide-react"

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const categories = ["all", "Lighting", "Wiring", "Power Devices", "Consumer Electronics"] as const

  const filteredProducts = mockInventoryProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getStockStatus = (stock: number, reorderLevel: number) => {
    if (stock <= reorderLevel / 2) return { status: "critical", label: "Critical", color: "bg-red-500/10 text-red-500" }
    if (stock <= reorderLevel) return { status: "warning", label: "Low Stock", color: "bg-yellow-500/10 text-yellow-500" }
    return { status: "healthy", label: "Healthy", color: "bg-green-500/10 text-green-500" }
  }

  const criticalCount = mockInventoryProducts.filter((p) => p.stock <= p.reorderLevel / 2).length
  const warningCount = mockInventoryProducts.filter((p) => p.stock > p.reorderLevel / 2 && p.stock <= p.reorderLevel).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Total Products</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{mockInventoryProducts.length}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Low Stock Alert</p>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{warningCount}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Critical Stock</p>
          </div>
          <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <ChartCard title="Search & Filter" subtitle="Find products across all categories">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-input pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  categoryFilter === category
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                {category === "all" ? "All Categories" : category}
              </button>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* Inventory Table */}
      <ChartCard
        title="Inventory Management"
        subtitle={`${filteredProducts.length} products`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Product Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Stock</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Reorder Level</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => {
                const stockInfo = getStockStatus(product.stock, product.reorderLevel)
                return (
                  <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.id}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{product.category}</td>
                    <td className="px-4 py-3 font-medium text-accent">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{product.stock}</span>
                        <div className="h-1.5 w-16 rounded-full bg-secondary">
                          <div
                            className={`h-1.5 rounded-full ${
                              stockInfo.status === "critical"
                                ? "bg-red-500"
                                : stockInfo.status === "warning"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min((product.stock / (product.reorderLevel * 2)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{product.reorderLevel}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {stockInfo.status === "critical" && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${stockInfo.color}`}>
                          {stockInfo.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-accent">{product.rating}</span>
                        <span className="text-xs text-muted-foreground">({product.reviews})</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Stock Distribution by Category */}
      <div className="grid gap-6 lg:grid-cols-2">
        {["Lighting", "Wiring", "Power Devices", "Consumer Electronics"].map((category) => {
          const categoryProducts = mockInventoryProducts.filter((p) => p.category === category)
          const totalStock = categoryProducts.reduce((sum, p) => sum + p.stock, 0)
          const avgPrice = categoryProducts.length > 0 ? categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length : 0

          return (
            <ChartCard key={category} title={`${category} Category`} subtitle={`${categoryProducts.length} products`}>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-secondary/30 border border-border p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Total Stock</p>
                    <p className="text-2xl font-bold text-primary">{totalStock}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 border border-border p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Avg Price</p>
                    <p className="text-2xl font-bold text-accent">{formatCurrency(avgPrice)}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/30 border border-border p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Top Products</p>
                  <div className="space-y-2">
                    {categoryProducts.slice(0, 3).map((product) => (
                      <div key={product.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
                        <span className="text-primary font-semibold">{product.stock} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ChartCard>
          )
        })}
      </div>
    </div>
  )
}
