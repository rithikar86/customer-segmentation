"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  PieChart,
  Users,
  Package,
  Play,
  Upload,
  ChevronLeft,
  ChevronRight,
  MessageSquareWarning,
  Boxes,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Segmentation Analysis", href: "/segmentation", icon: PieChart },
  { name: "Customer Insights", href: "/customers", icon: Users },
  { name: "Feedback Insights", href: "/insights", icon: MessageSquareWarning },
  { name: "Product Recommendations", href: "/recommendations", icon: Package },
  { name: "Inventory Management", href: "/inventory", icon: Boxes },
  { name: "Simulator", href: "/simulator", icon: Play },
  { name: "Data Upload", href: "/upload", icon: Upload },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-card transition-sidebar",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <PieChart className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-foreground">RFM Analytics</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Footer */}
      <div className="border-t border-border p-4">
        {!collapsed && (
          <p className="text-xs text-muted-foreground">
            Customer Segmentation v1.0
          </p>
        )}
      </div>
    </aside>
  )
}
