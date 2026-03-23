"use client"

import { useState } from "react"
import { recommendedProducts, segments } from "@/lib/mock-data"
import { Filter, Package, TrendingUp, ShoppingCart, Star } from "lucide-react"

export default function RecommendationsPage() {
  const [selectedSegment, setSelectedSegment] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"score" | "frequency">("score")

  const sortedProducts = [...recommendedProducts].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score
    return b.purchaseFrequency - a.purchaseFrequency
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Product Recommendations</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered product recommendations based on customer segments and purchase patterns
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Segments</option>
            {segments.map((segment) => (
              <option key={segment.name} value={segment.name}>
                {segment.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <button
            onClick={() => setSortBy("score")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sortBy === "score"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            Recommendation Score
          </button>
          <button
            onClick={() => setSortBy("frequency")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sortBy === "frequency"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            Purchase Frequency
          </button>
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedProducts.map((product, index) => (
          <div
            key={product.id}
            className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg"
          >
            {/* Rank Badge */}
            {index < 3 && (
              <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                #{index + 1}
              </div>
            )}

            {/* Product Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>

            {/* Product Info */}
            <h3 className="mb-1 text-sm font-semibold text-foreground group-hover:text-primary">
              {product.name}
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">{product.category}</p>

            {/* Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3" />
                  Score
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${product.score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {(product.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ShoppingCart className="h-3 w-3" />
                  Purchases
                </span>
                <span className="text-xs font-medium text-foreground">
                  {product.purchaseFrequency}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Trend
                </span>
                <span className="text-xs font-medium text-chart-2">+12%</span>
              </div>
            </div>

            {/* Action */}
            <button className="mt-4 w-full rounded-lg border border-border bg-background py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-xl font-bold text-foreground">{recommendedProducts.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
              <TrendingUp className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Score</p>
              <p className="text-xl font-bold text-foreground">
                {(
                  (recommendedProducts.reduce((acc, p) => acc + p.score, 0) /
                    recommendedProducts.length) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
              <ShoppingCart className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-xl font-bold text-foreground">
                {recommendedProducts.reduce((acc, p) => acc + p.purchaseFrequency, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
