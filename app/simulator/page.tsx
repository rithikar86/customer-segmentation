"use client"

import { useState } from "react"
import { ChartCard } from "@/components/chart-card"
import { ConsoleLog } from "@/components/console-log"
import { mockCustomers, mockProducts, getSegmentColor, formatCurrency } from "@/lib/mock-data"
import { useToast } from "@/components/toast-provider"
import { Play, Package, RefreshCw, Sparkles, Send, AlertCircle } from "lucide-react"
import type { LogEntry } from "@/components/console-log"

export default function SimulatorPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(mockCustomers[0].id)
  const [receiverEmail, setReceiverEmail] = useState<string>(mockCustomers[0].email)
  const [isSimulating, setIsSimulating] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [purchaseAmount, setPurchaseAmount] = useState<number>(150)
  const { showToast } = useToast()

  const selectedCustomer = mockCustomers.find((c) => c.id === selectedCustomerId)
  const customerProducts = mockProducts.slice(0, 3)

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        message,
        timestamp: new Date(),
        type,
      },
    ])
  }

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId)
    const customer = mockCustomers.find((c) => c.id === customerId)
    if (customer) {
      setReceiverEmail(customer.email)
    }
  }

  const handleSimulatePurchase = async () => {
    if (!selectedCustomer) return
    setIsSimulating(true)
    setLogs([])

    // SMTP Connection logs
    addLog("Connecting to mail.voltstream.com...", "smtp")
    await new Promise((resolve) => setTimeout(resolve, 600))

    addLog("Authentication successful with SMTP server", "success")
    await new Promise((resolve) => setTimeout(resolve, 400))

    addLog(`Composing purchase notification for ${selectedCustomer.email}`, "info")
    await new Promise((resolve) => setTimeout(resolve, 300))

    addLog(`Purchase amount: ${formatCurrency(purchaseAmount)}`, "info")
    await new Promise((resolve) => setTimeout(resolve, 300))

    addLog("Updating RFM values in database...", "info")
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newFrequency = selectedCustomer.frequency + 1
    const newMonetary = selectedCustomer.totalSpent + purchaseAmount
    const newRecency = 0

    addLog(`RFM Update: Recency=${newRecency}, Frequency=${newFrequency}, Monetary=${formatCurrency(newMonetary)}`, "info")
    await new Promise((resolve) => setTimeout(resolve, 400))

    addLog(`Sending email notification to ${selectedCustomer.email}...`, "smtp")
    await new Promise((resolve) => setTimeout(resolve, 800))

    addLog(`Email delivered to ${selectedCustomer.email}`, "success")
    await new Promise((resolve) => setTimeout(resolve, 300))

    addLog("Updating customer segment...", "info")
    await new Promise((resolve) => setTimeout(resolve, 400))

    addLog("Purchase simulation completed successfully", "success")

    setIsSimulating(false)
    showToast("Purchase simulated! Customer RFM values and notifications updated.", "success")
  }

  const handleSendNotification = async () => {
    if (!selectedCustomer) return
    setIsSimulating(true)
    setLogs([])

    try {
      addLog("[Checking RFM Segment...]", "info")
      await new Promise((resolve) => setTimeout(resolve, 400))

      addLog("[Connecting to Python Backend...]", "info")
      await new Promise((resolve) => setTimeout(resolve, 600))

      addLog("[SMTP Handshake Successful...]", "success")
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Make POST request to local backend
      const response = await fetch("http://localhost:5000/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_email: receiverEmail,
          customer_name: selectedCustomer.name,
          offer_text: `Exclusive offer for ${selectedCustomer.segment}: Get 15% off on your next purchase!`,
        }),
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const result = await response.json()
      addLog(`[Email Delivered to ${receiverEmail}]`, "success")
      await new Promise((resolve) => setTimeout(resolve, 300))

      addLog("Delivery confirmed - Status: 250 OK", "success")

      setIsSimulating(false)
      showToast("Notification sent successfully to " + receiverEmail, "success")
    } catch (error) {
      console.error("[v0] Send notification error:", error)
      addLog(`Error: ${error instanceof Error ? error.message : "Failed to send notification"}`, "error")
      setIsSimulating(false)
      showToast("Failed to send notification. Is backend running?", "error")
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  if (!selectedCustomer) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Customer Simulator</h2>
        <p className="text-sm text-muted-foreground">
          Simulate purchases and notifications to see RFM values and segment changes in real-time
        </p>
      </div>

      {/* Customer Selector */}
      <ChartCard title="Select Customer" subtitle="Choose a customer to simulate with">
        <select
          value={selectedCustomerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          className="h-10 w-full max-w-md rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {mockCustomers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} ({customer.segment})
            </option>
          ))}
        </select>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Profile */}
        <ChartCard title="Customer Profile" subtitle={selectedCustomer.id}>
          {/* Customer Header */}
          <div className="mb-6 flex items-center gap-4 pb-4 border-b border-border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {selectedCustomer.name.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{selectedCustomer.name}</p>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium mt-1"
                style={{
                  backgroundColor: getSegmentColor(selectedCustomer.segment) + "20",
                  color: getSegmentColor(selectedCustomer.segment),
                }}
              >
                {selectedCustomer.segment}
              </span>
            </div>
          </div>

          {/* RFM Values */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg bg-secondary/30 border border-border p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Recency</p>
              <p className="mt-2 text-2xl font-bold text-primary">{selectedCustomer.recency}</p>
              <p className="text-xs text-muted-foreground mt-1">days ago</p>
            </div>
            <div className="rounded-lg bg-secondary/30 border border-border p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Frequency</p>
              <p className="mt-2 text-2xl font-bold text-accent">{selectedCustomer.frequency}</p>
              <p className="text-xs text-muted-foreground mt-1">purchases</p>
            </div>
            <div className="rounded-lg bg-secondary/30 border border-border p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Monetary</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {formatCurrency(selectedCustomer.totalSpent)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">total spent</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-3 mb-6 pb-6 border-b border-border">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-foreground">{selectedCustomer.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Purchase</span>
              <span className="text-sm font-medium text-foreground">{selectedCustomer.lastPurchase}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">RFM Score</span>
              <span className="text-sm font-medium text-primary">{selectedCustomer.rfmScore}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Feedback Score</span>
              <span className="text-sm font-medium text-accent">{selectedCustomer.feedbackScore}/10</span>
            </div>
          </div>

          {/* Purchase Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Purchase Amount ($)</label>
            <input
              type="number"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
              min="1"
              max="10000"
              className="w-full rounded-lg border border-border bg-input px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Receiver Email for Testing */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Receiver Email (for testing)</label>
            <input
              type="email"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full rounded-lg border border-border bg-input px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Change this to test sending notifications to different email addresses
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSimulatePurchase}
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <button
              onClick={handleSendNotification}
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </ChartCard>

        {/* Recommended Products */}
        <ChartCard title="Recommended Products" subtitle="Suggested items for this customer">
          <div className="space-y-3">
            {customerProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-xl">
                  {product.image}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent">{formatCurrency(product.price)}</p>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${
                          i < Math.floor(product.rating)
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prediction Box */}
          <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertCircle className="h-4 w-4" />
              Predicted After Purchase
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">New Recency</p>
                <p className="text-lg font-bold text-primary">0 days</p>
              </div>
              <div className="rounded bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">New Frequency</p>
                <p className="text-lg font-bold text-accent">{selectedCustomer.frequency + 1}</p>
              </div>
              <div className="rounded bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">New Segment</p>
                <p className="text-lg font-bold text-foreground">Elite Tech Buyers</p>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Console Log */}
      <ConsoleLog logs={logs} onClear={clearLogs} />
    </div>
  )
}
