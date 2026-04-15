"use client"

import { useState } from "react"
import { ChartCard } from "@/components/chart-card"
import { mockProducts, segments, mockRecommendationRules, formatCurrency } from "@/lib/mock-data"
import { Filter, ShoppingCart, TrendingUp, Star, Zap } from "lucide-react"

export default function RecommendationsPage() {
  const [selectedSegment, setSelectedSegment] = useState<string>("Elite Tech Buyers")
  const [selectedProduct, setSelectedProduct] = useState<(typeof mockProducts)[0] | null>(null)

  const getRecommendationsForSegment = (segment: string) => {
    const rules = mockRecommendationRules.filter((rule) => rule.segment === segment)
    const recommended = []

    for (const rule of rules) {
      const products = mockProducts.filter((p) => p.category === rule.category)
      for (const product of products) {
        recommended.push({
          ...product,
          confidence: rule.confidence,
          reason: `Popular in ${rule.category}`,
        })
      }
    }

    return recommended.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  }

  const recommendations = getRecommendationsForSegment(selectedSegment)

  return (
    <div className="space-y-6">
      {/* Segment Selection */}
      <ChartCard
        title="Product Recommendations by Segment"
        subtitle="AI-powered recommendations tailored to customer segments"
      >
        <div className="flex gap-2 flex-wrap">
          {segments.map((segment) => (
            <button
              key={segment.name}
              onClick={() => setSelectedSegment(segment.name)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                selectedSegment === segment.name
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:border-primary/50"
              }`}
              style={{
                borderColor:
                  selectedSegment === segment.name ? undefined : segment.color,
              }}
            >
              {segment.name}
            </button>
          ))}
        </div>
      </ChartCard>

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recommendations.map((product, index) => (
          <div
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className="group relative cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:bg-secondary/30"
          >
            {/* Rank Badge */}
            {index < 3 && (
              <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                #{index + 1}
              </div>
            )}

            {/* Confidence Badge */}
            {product.confidence && (
              <div className="absolute right-2 top-2 rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                {(product.confidence * 100).toFixed(0)}% match
              </div>
            )}

            {/* Product Icon */}
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
              {product.image}
            </div>

            {/* Product Info */}
            <h3 className="mb-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">{product.category}</p>

            {/* Price */}
            <p className="mb-3 text-lg font-bold text-accent">{formatCurrency(product.price)}</p>

            {/* Rating */}
            <div className="mb-3 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(product.rating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({product.reviews})</span>
            </div>

            {/* Tags */}
            <div className="mb-3 flex gap-1 flex-wrap">
              {product.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Add to Cart */}
            <button className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary">
              <ShoppingCart className="h-4 w-4 inline mr-2" />
              View Product
            </button>
          </div>
        ))}
      </div>

      {/* Product Details */}
      {selectedProduct && (
        <ChartCard title={selectedProduct.name} subtitle={`${selectedProduct.category} • ID: ${selectedProduct.id}`}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Price</p>
                <p className="text-2xl font-bold text-accent">{formatCurrency(selectedProduct.price)}</p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Rating</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(selectedProduct.rating)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {selectedProduct.rating} ({selectedProduct.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-lg bg-secondary/30 border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Product Description</p>
              <p className="text-sm text-foreground">
                Professional-grade {selectedProduct.name.toLowerCase()} with premium build quality and advanced features.
                Perfect for {selectedSegment === "Elite Tech Buyers" ? "professional installations" : "DIY projects"}.
              </p>
            </div>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              {selectedProduct.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Add to Campaign
              </button>
              <button
                onClick={() => setSelectedProduct(null)}
                className="rounded-lg border border-border bg-card text-foreground px-4 py-3 text-sm font-semibold hover:bg-secondary transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </ChartCard>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Recommended Products</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{recommendations.length}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Avg Confidence</p>
          </div>
          <p className="text-2xl font-bold text-accent">
            {recommendations.length > 0
              ? (
                  (recommendations.reduce((sum, p) => sum + (p.confidence || 0), 0) /
                    recommendations.length) *
                  100
                ).toFixed(0)
              : "0"}
            %
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Avg Rating</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {recommendations.length > 0
              ? (recommendations.reduce((sum, p) => sum + p.rating, 0) / recommendations.length).toFixed(1)
              : "0"}
            ★
          </p>
        </div>
      </div>
    </div>
  )
}
