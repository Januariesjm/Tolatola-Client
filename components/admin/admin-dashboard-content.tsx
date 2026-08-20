"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import type { AdminDashboardContentProps } from "@/lib/types/admin"
import {
  filterTicketsByDepartment,
  getDepartmentForRole,
  getInitialTab,
  isSuperAdminRole,
} from "@/lib/admin/dashboard-utils"
import { filterByDateRange, type DatePeriod } from "./date-range-filter"
import { DashboardHeader } from "./dashboard/dashboard-header"
import { DashboardMobileTabs } from "./dashboard/dashboard-mobile-tabs"
import { DashboardPanels } from "./dashboard/dashboard-panels"
import { DashboardSidebarNav } from "./dashboard/dashboard-sidebar-nav"
import { DashboardStatCards } from "./dashboard/dashboard-stat-cards"
import type { AdminNavContext } from "./dashboard/nav-items"

const log = logger.child("admin.dashboard")

/**
 * Admin dashboard shell: owns the active tab and the overview date filter, and
 * composes the header, metric cards, navigation and tab panels.
 *
 * The pieces live in ./dashboard/: navigation is driven by the shared
 * ADMIN_NAV_ITEMS config so the sidebar and mobile tab strip cannot drift.
 */
export function AdminDashboardContent(props: AdminDashboardContentProps) {
  const {
    adminRole,
    pendingVendors,
    pendingTransporters,
    pendingCustomerKyc,
    pendingProducts,
    orders,
    tickets,
    payouts,
    stats,
    promotions,
    careerApplications = [],
    incompleteRegistrations = [],
    initialAgents = [],
  } = props

  const router = useRouter()

  const [activeTab, setActiveTab] = useState(getInitialTab(adminRole?.permissions))
  const [overviewPeriod, setOverviewPeriod] = useState<DatePeriod>("all")

  // Overview metrics respect the date filter; the tab panels show unfiltered data.
  const filteredOrders = useMemo(
    () => filterByDateRange(orders, overviewPeriod),
    [orders, overviewPeriod],
  )
  const filteredPayouts = useMemo(
    () => filterByDateRange(payouts, overviewPeriod),
    [payouts, overviewPeriod],
  )

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      // Still send the admin to the login page: leaving them on an
      // authenticated-looking dashboard is worse than a stale local session.
      log.error("sign out failed", error)
    }
    router.push("/auth/login")
  }

  const roleName = adminRole?.role?.role_name || ""
  const permissions = adminRole?.permissions ?? []
  const isSuperAdmin = isSuperAdminRole(roleName)
  const showAdminManagement = isSuperAdmin || permissions.includes("manage_admins")
  const canManageAgents = isSuperAdmin || permissions.includes("manage_agents")
  const userDepartment = isSuperAdmin ? undefined : getDepartmentForRole(roleName)
  const pendingTickets = filterTicketsByDepartment(tickets, isSuperAdmin, userDepartment)

  // Strip the meta-info entry the promotions query appends, if present.
  const actualPromotions = promotions.filter((p) => !p._adminUsers && !p.id?.includes("_"))

  const pendingRecovery = incompleteRegistrations.filter(
    (r) => r.recovery_status === "pending",
  ).length
  const pendingHr = careerApplications.filter((a) => a.status === "pending").length
  const pendingPayouts = filteredPayouts.filter((p) => p.status === "pending").length

  const navContext: AdminNavContext = {
    permissions,
    isSuperAdmin,
    hasAnyRole: Boolean(adminRole?.role),
    showAdminManagement,
    canManageAgents,
    counts: {
      pendingVendors: pendingVendors.length,
      pendingTransporters: pendingTransporters.length,
      pendingCustomerKyc: pendingCustomerKyc.length,
      pendingProducts: pendingProducts.length,
      // The sidebar badge counts every pending payout, not just the filtered range.
      pendingPayouts: payouts.filter((p) => p.status === "pending").length,
      pendingTickets: pendingTickets.length,
      pendingRecovery,
      pendingHr,
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/40">
      <DashboardHeader
        roleName={adminRole?.role?.role_name || "Administrator"}
        onSignOut={handleLogout}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <DashboardStatCards
          permissions={permissions}
          canManageAgents={canManageAgents}
          period={overviewPeriod}
          onPeriodChange={setOverviewPeriod}
          metrics={{
            grossMerchandiseValue: filteredOrders
              .filter((o) => o.payment_status === "paid")
              .reduce((sum: number, o) => sum + Number(o.total_amount || 0), 0),
            pendingPayouts,
            activeOrders: filteredOrders.filter(
              (o) => !["delivered", "cancelled"].includes(o.status),
            ).length,
            pendingVendorKyc: pendingVendors.length,
            pendingTransporterKyc: pendingTransporters.length,
            totalCustomers: stats.totalCustomers,
            openTickets: pendingTickets.length,
            totalAdmins: stats.totalAdmins,
            pendingJobs: pendingHr,
            salesAgents: initialAgents.length,
          }}
        />

        <div className="flex gap-6 items-start">
          <DashboardSidebarNav
            navContext={navContext}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <DashboardMobileTabs navContext={navContext} />

              <DashboardPanels
                {...props}
                actualPromotions={actualPromotions}
                isSuperAdmin={isSuperAdmin}
                showAdminManagement={showAdminManagement}
                canManageAgents={canManageAgents}
                userDepartment={userDepartment}
              />
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
