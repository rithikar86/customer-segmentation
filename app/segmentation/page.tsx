"use client"

import { useState } from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts"
import { ChartCard } from "@/components/chart-card"
import { scatterData, segments, getSegmentColor } from "@/lib/mock-data"
import { Filter } from "lucide-react"

export default function SegmentationPage() {
  const [selectedSegment, setSelectedSegment] = useState<string>("all")

  const filteredData =
    selectedSegment === "all"
      ? scatterData
      : scatterData.filter((d) => d.segment === selectedSegment)

  const groupedData =
    selectedSegment === "all"
      ? segments.map((segment) => ({
          name: segment.name,
          data: scatterData
            .filter((d) => d.segment === segment.name)
            .map((d) => ({
              x: d.recency,
              y: d.monetary,
              z: d.frequency * 10,
              segment: d.segment,
              id: d.id,
              frequency: d.frequency,
            })),
          color: segment.color,
        }))
      : [
          {
            name: selectedSegment,
            data: filteredData.map((d) => ({
              x: d.recency,
              y: d.monetary,
              z: d.frequency * 10,
              segment: d.segment,
              id: d.id,
              frequency: d.frequency,
            })),
            color: getSegmentColor(selectedSegment),
          },
        ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Segmentation Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Interactive visualization of customer segments based on RFM values
          </p>
        </div>

        {/* Segment Filter */}
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
      </div>

      {/* Segment Legend */}
      <div className="flex flex-wrap gap-3">
        {segments.map((segment) => (
          <button
            key={segment.name}
            onClick={() =>
              setSelectedSegment(selectedSegment === segment.name ? "all" : segment.name)
            }
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              selectedSegment === segment.name || selectedSegment === "all"
                ? "border-transparent"
                : "border-border opacity-50"
            }`}
            style={{
              backgroundColor:
                selectedSegment === segment.name || selectedSegment === "all"
                  ? `${segment.color}20`
                  : "transparent",
              color: segment.color,
            }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            {segment.name}
            <span className="rounded-md bg-background/50 px-1.5 py-0.5 text-xs">
              {segment.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Scatter Plot */}
      <ChartCard
        title="RFM Distribution"
        subtitle="Bubble size represents purchase frequency"
        className="min-h-[500px]"
      >
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="x"
              name="Recency"
              label={{
                value: "Recency (days)",
                position: "bottom",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 12,
              }}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Monetary"
              label={{
                value: "Monetary ($)",
                angle: -90,
                position: "insideLeft",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 12,
              }}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                      <p className="font-semibold text-foreground">{data.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Segment:{" "}
                        <span style={{ color: getSegmentColor(data.segment) }}>
                          {data.segment}
                        </span>
                      </p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-foreground">Recency: {data.x} days</p>
                        <p className="text-foreground">Monetary: ${data.y}</p>
                        <p className="text-foreground">Frequency: {data.frequency}</p>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            {groupedData.map((group) => (
              <Scatter
                key={group.name}
                name={group.name}
                data={group.data}
                fill={group.color}
                fillOpacity={0.7}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Segment Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {segments.map((segment) => {
          const segmentCustomers = scatterData.filter((d) => d.segment === segment.name)
          const avgRecency =
            segmentCustomers.reduce((acc, c) => acc + c.recency, 0) / segmentCustomers.length
          const avgMonetary =
            segmentCustomers.reduce((acc, c) => acc + c.monetary, 0) / segmentCustomers.length

          return (
            <div
              key={segment.name}
              className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-lg"
              style={{ borderLeftColor: segment.color, borderLeftWidth: "3px" }}
            >
              <h4 className="text-sm font-semibold text-foreground">{segment.name}</h4>
              <p className="mt-1 text-2xl font-bold" style={{ color: segment.color }}>
                {segment.count}
              </p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>Avg Recency: {Math.round(avgRecency)} days</p>
                <p>Avg Monetary: ${Math.round(avgMonetary)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
