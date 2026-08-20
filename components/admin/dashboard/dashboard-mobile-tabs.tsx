"use client"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMobileLabel, getMobileNavItems, type AdminNavContext } from "./nav-items"

interface DashboardMobileTabsProps {
  navContext: AdminNavContext
}

/**
 * Horizontal tab strip shown instead of the sidebar on small screens.
 * Rendered from the same ADMIN_NAV_ITEMS array as the sidebar.
 */
export function DashboardMobileTabs({ navContext }: DashboardMobileTabsProps) {
  return (
    <div className="overflow-x-auto pb-2 md:hidden">
      <TabsList className="inline-flex whitespace-nowrap bg-white/80 border border-slate-200 rounded-full px-1 py-1 h-auto shadow-sm">
        {getMobileNavItems(navContext).map((item) => (
          <TabsTrigger
            key={item.key}
            value={item.key}
            className="px-5 rounded-full text-xs font-semibold"
          >
            {getMobileLabel(item, navContext)}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  )
}
