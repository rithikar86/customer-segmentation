"use client"

import { useState } from "react"
import { scatterData, segments, getSegmentColor, formatCurrency } from "@/lib/mock-data"
import { Search, Filter, X, Download, ChevronLeft, ChevronRight } from "lucide-react"
import type { Customer } from "@/lib/mock-data"

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSegment, setSelectedSegment] = useState<string>("all")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredData = scatterData.filter((customer) => {
    const matchesSearch = customer.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSegment = selectedSegment === "all" || customer.segment === selectedSegment
    return matchesSearch && matchesSegment
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Customer Insights</h2>
          <p className="text-sm text-muted-foreground">
            View and analyze individual customer data and RFM scores
          </p>
        </div>

        <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Customer ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedSegment}
            onChange={(e) => {
              setSelectedSegment(e.target.value)
              setCurrentPage(1)
            }}
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
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recency
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Frequency
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Monetary
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Segment
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Last Purchase
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                >
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {customer.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {customer.recency} days
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {customer.frequency}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatCurrency(customer.monetary)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${getSegmentColor(customer.segment)}20`,
                        color: getSegmentColor(customer.segment),
                      }}
                    >
                      {customer.segment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {customer.lastPurchase}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
            {filteredData.length} customers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Detail Side Panel */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in slide-in-from-right border-l border-border bg-card shadow-xl duration-300">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">Customer Details</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer ID */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Customer ID</p>
                <p className="text-2xl font-bold text-foreground">{selectedCustomer.id}</p>
                <span
                  className="mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: `${getSegmentColor(selectedCustomer.segment)}20`,
                    color: getSegmentColor(selectedCustomer.segment),
                  }}
                >
                  {selectedCustomer.segment}
                </span>
              </div>

              {/* RFM Scores */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-background p-4 text-center">
                  <p className="text-xs text-muted-foreground">Recency</p>
                  <p className="text-xl font-bold text-primary">{selectedCustomer.recency}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4 text-center">
                  <p className="text-xs text-muted-foreground">Frequency</p>
                  <p className="text-xl font-bold text-chart-2">{selectedCustomer.frequency}</p>
                  <p className="text-xs text-muted-foreground">orders</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4 text-center">
                  <p className="text-xs text-muted-foreground">Monetary</p>
                  <p className="text-xl font-bold text-chart-3">${selectedCustomer.monetary}</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Last Purchase</span>
                  <span className="text-sm font-medium text-foreground">{selectedCustomer.lastPurchase}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <span className="text-sm font-medium text-foreground">{selectedCustomer.totalOrders}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Avg Order Value</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(selectedCustomer.monetary / selectedCustomer.frequency)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  View Recommendations
                </button>
                <button className="flex-1 rounded-lg border border-border bg-background py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                  Simulate Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
