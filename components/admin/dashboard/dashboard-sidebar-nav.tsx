"use client"

import { Button } from "@/components/ui/button"
import { getVisibleNavItems, type AdminNavContext } from "./nav-items"

interface DashboardSidebarNavProps {
  navContext: AdminNavContext
  activeTab: string
  onTabChange: (tab: string) => void
}

/**
 * Desktop sidebar navigation, rendered from ADMIN_NAV_ITEMS so it cannot drift
 * from the mobile tab strip.
 */
export function DashboardSidebarNav({ navContext, activeTab, onTabChange }: DashboardSidebarNavProps) {
  return (
    <aside className="hidden md:block w-60 shrink-0">
      <div className="sticky top-24 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dashboard Sections</p>
        <div className="space-y-1">
          {getVisibleNavItems(navContext).map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key
            const count = item.count?.(navContext) ?? 0

            return (
              <Button
                key={item.key}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`w-full justify-between rounded-xl ${isActive ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"}`}
                onClick={() => onTabChange(item.key)}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </span>
                {count > 0 && <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">{count}</span>}
              </Button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
