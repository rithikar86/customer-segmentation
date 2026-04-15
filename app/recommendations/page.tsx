"use client"

import { useState } from "react"
import { ChartCard } from "@/components/chart-card"
import { mockAssociationRules, mockSegmentOffers, segments, formatCurrency } from "@/lib/mock-data"
import { ShoppingCart, TrendingUp, BarChart3, Zap, AlertCircle } from "lucide-react"

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState<"rules" | "offers">("rules")

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "rules"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="inline mr-2 h-4 w-4" />
          Market Basket Rules
        </button>
        <button
          onClick={() => setActiveTab("offers")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "offers"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="inline mr-2 h-4 w-4" />
          Customer Offers
        </button>
      </div>

      {/* Market Basket Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          {/* Info Box */}
          <ChartCard title="Association Rule Mining" subtitle="Confidence & Lift Analysis">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mb-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-foreground">
                  <p className="font-semibold mb-1">Understanding Market Basket Rules:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li><span className="font-medium">Confidence:</span> Probability that if a customer buys X, they also buy Y (0-1)</li>
                    <li><span className="font-medium">Lift:</span> How much more likely Y is purchased when X is purchased (higher = stronger association)</li>
                    <li><span className="font-medium">Support:</span> Percentage of transactions containing both items</li>
                  </ul>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Association Rules Table */}
          <ChartCard
            title="Association Rules"
            subtitle={`${mockAssociationRules.length} active rules`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">If Customer Buys</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">They Also Buy</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Confidence</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Lift</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Support</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Strength</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockAssociationRules.map((rule, index) => {
                    const strength = rule.confidence * rule.lift
                    const strengthColor = strength > 2 ? "text-green-500" : strength > 1 ? "text-yellow-500" : "text-red-500"

                    return (
                      <tr key={index} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{rule.antecedent}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-accent">{rule.consequent}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-1.5 w-12 rounded-full bg-secondary">
                              <div
                                className="h-1.5 rounded-full bg-primary"
                                style={{ width: `${rule.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-primary">{(rule.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-center">
                            <p className="font-bold text-accent">{rule.lift.toFixed(2)}x</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-center">
                            <span className="text-xs font-semibold text-muted-foreground">{(rule.support * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-1 ${strengthColor}`}>
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-semibold">{strength.toFixed(2)}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Product Mapping Logic */}
          <ChartCard
            title="Product Mapping Logic"
            subtitle="Smart product associations for cross-selling"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-sm font-bold">→</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Inverter Mapping</p>
                    <p className="text-xs text-muted-foreground mt-1">If customer buys Inverter 1500W</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-accent">Suggest: Tubular Battery 150Ah</p>
                <p className="text-xs text-muted-foreground mt-2">Confidence: 92% | Lift: 3.2x</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <span className="text-sm font-bold">→</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Charger Mapping</p>
                    <p className="text-xs text-muted-foreground mt-1">If customer buys Smartphone Charger</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-primary">Suggest: Tablet Charging Cable</p>
                <p className="text-xs text-muted-foreground mt-2">Confidence: 78% | Lift: 1.95x</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                    <span className="text-sm font-bold">→</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Wiring Mapping</p>
                    <p className="text-xs text-muted-foreground mt-1">If customer buys Electrical Wire</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-yellow-500">Suggest: MCB Circuit Breaker</p>
                <p className="text-xs text-muted-foreground mt-2">Confidence: 85% | Lift: 2.6x</p>
              </div>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Customer Offers Tab */}
      {activeTab === "offers" && (
        <div className="space-y-6">
          {/* Segment Offers */}
          {segments.map((segment) => {
            const offer = mockSegmentOffers[segment.name as keyof typeof mockSegmentOffers]
            if (!offer) return null

            return (
              <ChartCard
                key={segment.name}
                title={segment.name}
                subtitle="Personalized offer campaign"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-secondary/30 border border-border p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Main Offer</p>
                    <p className="text-lg font-bold text-primary mb-3">{offer.offer}</p>
                    <p className="text-sm text-foreground">{offer.message}</p>
                  </div>

                  <div className="rounded-lg bg-secondary/30 border border-border p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Incentive</p>
                    <div className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-accent shrink-0 mt-1" />
                      <p className="text-sm font-medium text-foreground">{offer.incentive}</p>
                    </div>
                  </div>

                  <div className="sm:col-span-2 rounded-lg bg-primary/5 border border-primary/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-1">Campaign Strategy</p>
                        <p className="text-xs text-muted-foreground">
                          {segment.name === "Elite Tech Buyers"
                            ? "Target high-value customers with premium offerings and exclusive access"
                            : segment.name === "Regular DIYers"
                              ? "Bundle discounts and loyalty rewards to encourage repeat purchases"
                              : segment.name === "One-time Project Buyers"
                                ? "Win-back offers with new products and easy returns"
                                : "Save the relationship with deep discounts and clearance access"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button className="sm:col-span-2 w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4" />
                    Deploy Campaign
                  </button>
                </div>
              </ChartCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
