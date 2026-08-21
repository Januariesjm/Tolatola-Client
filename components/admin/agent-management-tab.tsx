"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useAgentManagement } from "@/hooks/use-agent-management"
import { AgentDialogs } from "./agents/agent-dialogs"
import { AgentsListSubTab } from "./agents/agents-list-subtab"
import { CommissionsSubTab } from "./agents/commissions-subtab"
import { RatesSubTab } from "./agents/rates-subtab"
import { formatTzs } from "@/lib/agent/wallet"
import type { AdminAgent } from "@/lib/admin/agent-types"

interface AgentManagementTabProps {
  initialAgents: AdminAgent[]
}

export function AgentManagementTab({ initialAgents }: AgentManagementTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"agents" | "commissions" | "rates">("agents")

  const {
    agents,
    filteredAgents,
    commissions,
    rates,
    stats,
    isLoading,
    isActionLoading,
    isUpdatingRates,
    isCreating,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isCreateOpen,
    setIsCreateOpen,
    createForm,
    setCreateForm,
    deleteTarget,
    setDeleteTarget,
    handleUpdateRates,
    handleRateAmountChange,
    handleToggleStatus,
    handleDeleteAgent,
    handleResendInvitation,
    handleApproveCommission,
    handleCreateAgent,
  } = useAgentManagement(initialAgents)

  return (
    <div className="space-y-6">
      {/* Top dashboard metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Agents</span>
            <span className="text-xl font-black text-slate-900 block">{stats.totalAgents}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-emerald-100">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Agents</span>
            <span className="text-xl font-black text-emerald-600 block">{stats.activeAgents}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-rose-100">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Suspended</span>
            <span className="text-xl font-black text-rose-600 block">{stats.suspendedAgents}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-blue-100">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Registered</span>
            <span className="text-xl font-black text-blue-600 block">{stats.totalRegistrations}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-teal-100">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Commission</span>
            <span className="text-xl font-black text-teal-600 block">{formatTzs(stats.totalCommission)}</span>
          </CardContent>
        </Card>
      </div>

      {/* Segment switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab("agents")}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === "agents" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Agents List
        </button>
        <button
          onClick={() => setActiveSubTab("commissions")}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === "commissions" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Commission Approvals ({commissions.filter((c) => c.status === "pending").length} Pending)
        </button>
        <button
          onClick={() => setActiveSubTab("rates")}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === "rates" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Commission Rates
        </button>
      </div>

      {activeSubTab === "agents" && (
        <AgentsListSubTab
          filteredAgents={filteredAgents}
          isLoading={isLoading}
          isActionLoading={isActionLoading}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onCreateClick={() => setIsCreateOpen(true)}
          onToggleStatus={handleToggleStatus}
          onResendInvitation={handleResendInvitation}
          onDeleteTarget={setDeleteTarget}
        />
      )}

      {activeSubTab === "commissions" && (
        <CommissionsSubTab
          commissions={commissions}
          isLoading={isLoading}
          isActionLoading={isActionLoading}
          onApproveCommission={handleApproveCommission}
        />
      )}

      {activeSubTab === "rates" && (
        <RatesSubTab
          rates={rates}
          isUpdatingRates={isUpdatingRates}
          onRateAmountChange={handleRateAmountChange}
          onSubmit={handleUpdateRates}
        />
      )}

      <AgentDialogs
        isCreateOpen={isCreateOpen}
        setIsCreateOpen={setIsCreateOpen}
        createForm={createForm}
        setCreateForm={setCreateForm}
        isCreating={isCreating}
        handleCreateAgent={handleCreateAgent}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        isActionLoading={isActionLoading}
        handleDeleteAgent={handleDeleteAgent}
      />
    </div>
  )
}
