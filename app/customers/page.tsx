"use client"

import { useState } from "react"
import { ChartCard } from "@/components/chart-card"
import { mockCustomers, getSegmentColor, formatCurrency } from "@/lib/mock-data"
import { Search, AlertTriangle, TrendingUp } from "lucide-react"

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "positive" | "neutral" | "negative">("all")
  const [selectedCustomer, setSelectedCustomer] = useState<(typeof mockCustomers)[0] | null>(null)

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSentiment = sentimentFilter === "all" || customer.sentiment === sentimentFilter
    return matchesSearch && matchesSentiment
  })

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <ChartCard title="Search Customers" subtitle="Find and manage your customers">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-input pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["all", "positive", "neutral", "negative"] as const).map((sentiment) => (
              <button
                key={sentiment}
                onClick={() => setSentimentFilter(sentiment)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  sentimentFilter === sentiment
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                {sentiment === "all" ? "All Sentiments" : sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* Customer Table */}
      <ChartCard
        title="Customer Database"
        subtitle={`${filteredCustomers.length} customers found`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Segment</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Total Spent</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Frequency</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sentiment</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {customer.segment === "Churn Risk" && customer.sentiment === "negative" && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span>{customer.name}</span>
                        </div>
                      )}
                      {!(customer.segment === "Churn Risk" && customer.sentiment === "negative") && customer.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{customer.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2 py-1 text-xs font-semibold text-foreground"
                      style={{
                        backgroundColor: getSegmentColor(customer.segment) + "20",
                        color: getSegmentColor(customer.segment),
                      }}
                    >
                      {customer.segment}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-accent">{formatCurrency(customer.totalSpent)}</td>
                  <td className="px-4 py-3">{customer.frequency}x</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        customer.sentiment === "positive"
                          ? "bg-green-500/10 text-green-500"
                          : customer.sentiment === "neutral"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {customer.sentiment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-primary">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-semibold">{customer.rfmScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-primary hover:text-primary-foreground hover:bg-primary/20 rounded px-3 py-1 text-xs font-medium transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Customer Detail Panel */}
      {selectedCustomer && (
        <ChartCard
          title={selectedCustomer.name}
          subtitle={`ID: ${selectedCustomer.id}`}
        >
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
                <p className="text-lg font-semibold text-foreground mt-2">{selectedCustomer.email}</p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Segment</p>
                <p
                  className="text-lg font-semibold mt-2"
                  style={{ color: getSegmentColor(selectedCustomer.segment) }}
                >
                  {selectedCustomer.segment}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">RFM Score</p>
                <p className="text-lg font-semibold text-primary mt-2">{selectedCustomer.rfmScore}/100</p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Total Spent</p>
                <p className="text-lg font-semibold text-accent mt-2">{formatCurrency(selectedCustomer.totalSpent)}</p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Purchase Frequency</p>
                <p className="text-lg font-semibold text-foreground mt-2">{selectedCustomer.frequency} purchases</p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Feedback Score</p>
                <p className="text-lg font-semibold text-accent mt-2">{selectedCustomer.feedbackScore}/10</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recency</p>
                <p className="text-2xl font-bold text-foreground">{selectedCustomer.recency} days</p>
                <p className="text-xs text-muted-foreground mt-2">Last purchase: {selectedCustomer.lastPurchase}</p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Sentiment</p>
                <p
                  className={`text-2xl font-bold ${
                    selectedCustomer.sentiment === "positive"
                      ? "text-green-500"
                      : selectedCustomer.sentiment === "neutral"
                        ? "text-yellow-500"
                        : "text-red-500"
                  }`}
                >
                  {selectedCustomer.sentiment.charAt(0).toUpperCase() + selectedCustomer.sentiment.slice(1)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground font-medium hover:bg-secondary transition-colors"
            >
              Close Details
            </button>
          </div>
        </ChartCard>
      )}
    </div>
  )
}
