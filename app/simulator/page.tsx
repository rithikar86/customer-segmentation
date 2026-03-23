"use client"

import { useState } from "react"
import { scatterData, recommendedProducts, getSegmentColor, formatCurrency } from "@/lib/mock-data"
import { useToast } from "@/components/toast-provider"
import { Play, Package, RefreshCw, Sparkles } from "lucide-react"

export default function SimulatorPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(scatterData[0].id)
  const [isSimulating, setIsSimulating] = useState(false)
  const { showToast } = useToast()

  const selectedCustomer = scatterData.find((c) => c.id === selectedCustomerId)
  const customerRecommendations = recommendedProducts.slice(0, 4)

  const handleSimulatePurchase = async () => {
    setIsSimulating(true)
    
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setIsSimulating(false)
    showToast("Purchase simulated successfully! RFM values updated.", "success")
  }

  if (!selectedCustomer) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Customer Simulator</h2>
        <p className="text-sm text-muted-foreground">
          Simulate purchases and see how RFM values and segments change
        </p>
      </div>

      {/* Customer Selector */}
      <div className="rounded-xl border border-border bg-card p-6">
        <label className="mb-2 block text-sm font-medium text-foreground">
          Select Customer
        </label>
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="h-10 w-full max-w-md rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {scatterData.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.id} - {customer.segment}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Profile */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Customer Profile</h3>

          {/* Customer ID and Segment */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {selectedCustomer.id.slice(-2)}
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{selectedCustomer.id}</p>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                style={{
                  backgroundColor: `${getSegmentColor(selectedCustomer.segment)}20`,
                  color: getSegmentColor(selectedCustomer.segment),
                }}
              >
                {selectedCustomer.segment}
              </span>
            </div>
          </div>

          {/* RFM Values */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Recency</p>
              <p className="mt-1 text-2xl font-bold text-primary">{selectedCustomer.recency}</p>
              <p className="text-xs text-muted-foreground">days ago</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Frequency</p>
              <p className="mt-1 text-2xl font-bold text-chart-2">{selectedCustomer.frequency}</p>
              <p className="text-xs text-muted-foreground">purchases</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Monetary</p>
              <p className="mt-1 text-2xl font-bold text-chart-3">
                ${selectedCustomer.monetary}
              </p>
              <p className="text-xs text-muted-foreground">total spent</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-between border-b border-border py-2">
              <span className="text-sm text-muted-foreground">Last Purchase</span>
              <span className="text-sm font-medium text-foreground">
                {selectedCustomer.lastPurchase}
              </span>
            </div>
            <div className="flex justify-between border-b border-border py-2">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <span className="text-sm font-medium text-foreground">
                {selectedCustomer.totalOrders}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Average Order Value</span>
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(selectedCustomer.monetary / selectedCustomer.frequency)}
              </span>
            </div>
          </div>

          {/* Simulate Button */}
          <button
            onClick={handleSimulatePurchase}
            disabled={isSimulating}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Simulate Purchase
              </>
            )}
          </button>
        </div>

        {/* Recommended Products */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recommended Products</h3>
          </div>

          <div className="space-y-3">
            {customerRecommendations.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">
                    {(product.score * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">match</p>
                </div>
              </div>
            ))}
          </div>

          {/* Prediction */}
          <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Prediction After Purchase
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">New Recency</p>
                <p className="text-lg font-bold text-primary">0</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New Frequency</p>
                <p className="text-lg font-bold text-chart-2">
                  {selectedCustomer.frequency + 1}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Predicted Segment</p>
                <p className="text-sm font-bold text-chart-3">Champions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
