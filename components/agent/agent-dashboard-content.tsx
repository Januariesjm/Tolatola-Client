"use client"

import { useState } from "react"
import { AgentSidebar } from "./agent-sidebar"
import { AgentOverviewTab } from "./agent-overview-tab"
import { AgentRegistrationsTab } from "./agent-registrations-tab"
import { AgentCommissionTab } from "./agent-commission-tab"
import { AgentPerformanceTab } from "./agent-performance-tab"
import { AgentNotifications } from "./agent-notifications"
import { Menu, Bell, Clock } from "lucide-react"

interface AgentDashboardContentProps {
  agent: any
  role: any
  permissions: string[]
  dashboardStats: any
  trend: any[]
  registrations: any[]
  commissions: any[]
  commissionSummary: any
  leaderboard: any[]
  myRank: number | null
}

export function AgentDashboardContent({
  agent,
  role,
  permissions,
  dashboardStats,
  trend,
  registrations,
  commissions,
  commissionSummary,
  leaderboard,
  myRank,
}: AgentDashboardContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const roleName = role?.role_name || "Sales Agent"

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <AgentOverviewTab
            stats={dashboardStats}
            agent={agent}
            setActiveTab={setActiveTab}
            registrations={registrations}
            commissions={commissions}
          />
        )
      case "registrations":
        return (
          <AgentRegistrationsTab
            initialRegistrations={registrations}
            agent={agent}
          />
        )
      case "commissions":
        return (
          <AgentCommissionTab
            commissions={commissions}
            summary={commissionSummary}
            leaderboard={leaderboard}
            myRank={myRank}
          />
        )
      case "performance":
        return (
          <AgentPerformanceTab
            agent={agent}
            trend={trend}
          />
        )
      case "notifications":
        return (
          <AgentNotifications
            agent={agent}
          />
        )
      default:
        return (
          <AgentOverviewTab
            stats={dashboardStats}
            agent={agent}
            setActiveTab={setActiveTab}
            registrations={registrations}
            commissions={commissions}
          />
        )
    }
  }

  // Get current date formatted beautifully
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Sidebar navigation */}
      <AgentSidebar
        agent={agent}
        roleName={roleName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main content body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-base md:text-lg font-bold text-slate-900 capitalize">
                {activeTab.replace("-", " ")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Clock / Date Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 p-2 rounded-lg">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>{todayStr}</span>
            </div>

            {/* Quick Agent Badge */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                {agent.agent_code}
              </span>
            </div>
          </div>
        </header>

        {/* Tab Content view container */}
        <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto">
          {renderTabContent()}
        </main>
      </div>
    </div>
  )
}
