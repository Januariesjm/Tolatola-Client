"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Coins,
  MapPin,
  Search,
  CheckCircle,
  XCircle,
  UserPlus,
  Eye,
  EyeOff,
  Trash2,
  Mail,
} from "lucide-react"
import { useAgentManagement } from "@/hooks/use-agent-management"
import { AgentDialogs } from "./agents/agent-dialogs"
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

  const formatTzs = (amount: number) => {
    return `TZS ${(amount || 0).toLocaleString()}`
  }
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
          Commission Approvals ({commissions.filter(c => c.status === "pending").length} Pending)
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
        <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Agent Management</CardTitle>
                <CardDescription className="text-xs">Activate, suspend, delete, or resend activation emails to sales agents.</CardDescription>
              </div>
              
              {/* Search and Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-60 rounded-xl text-xs"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Create New Agent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <span className="text-xs text-slate-400">Loading agents list...</span>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xs text-slate-400">No agents found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-6 w-[50px]">#</th>
                      <th className="py-3 px-6">Agent Details</th>
                      <th className="py-3 px-4">Agent Code</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Region Assigned</th>
                      <th className="py-3 px-4">Performance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAgents.map((agent, index) => (
                      <tr key={agent.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-6 font-medium text-slate-400">{index + 1}</td>
                        <td className="py-3 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{agent.users?.full_name || "Sales Agent"}</span>
                            <span className="text-[10px] text-slate-400">{agent.users?.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {agent.agent_code}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className="bg-slate-100 text-slate-700 font-bold text-[9px] uppercase">
                            {agent.agent_roles?.role_name || "Sales Agent"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-rose-500" />
                            <span>{agent.region || "Not assigned"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{agent.total_registrations} regs</span>
                            <span className="text-[10px] text-emerald-600 font-bold">{formatTzs(agent.total_commission)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                            agent.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {agent.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant={agent.status === "active" ? "destructive" : "outline"}
                              disabled={isActionLoading === `status-${agent.id}`}
                              onClick={() => handleToggleStatus(agent.id, agent.status)}
                              className="rounded-xl text-xs h-8"
                            >
                              {isActionLoading === `status-${agent.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : agent.status === "active" ? (
                                "Suspend"
                              ) : (
                                "Activate"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isActionLoading === `resend-${agent.id}`}
                              onClick={() => handleResendInvitation(agent.id)}
                              className="rounded-xl text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                              title="Resend activation email"
                            >
                              {isActionLoading === `resend-${agent.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Mail className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isActionLoading === `delete-${agent.id}`}
                              onClick={() => setDeleteTarget({ id: agent.id, name: agent.users?.full_name || "Agent", code: agent.agent_code })}
                              className="rounded-xl text-xs h-8 text-rose-600 hover:bg-rose-50"
                              title="Delete agent permanently"
                            >
                              {isActionLoading === `delete-${agent.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSubTab === "commissions" && (
        <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Commission Approval Queue</CardTitle>
            <CardDescription className="text-xs">Review and approve commission payouts for sales agents.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <span className="text-xs text-slate-400">Loading commission queue...</span>
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xs text-slate-400">No commissions awaiting approval at this time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-6 w-[50px]">#</th>
                      <th className="py-3 px-6">Agent Details</th>
                      <th className="py-3 px-4">Registration Detail</th>
                      <th className="py-3 px-4">Payout Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Request Date</th>
                      <th className="py-3 px-6 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commissions.map((comm, index) => (
                      <tr key={comm.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-6 font-medium text-slate-400">{index + 1}</td>
                        <td className="py-3 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">
                              {comm.agents?.users?.full_name || "Sales Agent"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Code: {comm.agents?.agent_code}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">
                              {comm.agent_registrations?.full_name || "New Registered User"}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize">
                              Category: {comm.agent_registrations?.registration_type}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-600">
                          {formatTzs(comm.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                            comm.status === "paid" ? "bg-emerald-100 text-emerald-800" :
                            comm.status === "approved" ? "bg-teal-100 text-teal-800" :
                            comm.status === "pending" ? "bg-amber-100 text-amber-800" :
                            "bg-rose-100 text-rose-800"
                          }`}>
                            {comm.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(comm.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-6 text-right">
                          {comm.status === "pending" ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isActionLoading !== null}
                                onClick={() => handleApproveCommission(comm.id, "approved")}
                                className="rounded-xl h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
                              >
                                {isActionLoading === `comm-${comm.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isActionLoading !== null}
                                onClick={() => handleApproveCommission(comm.id, "rejected")}
                                className="rounded-xl h-8 text-xs text-rose-600 hover:bg-rose-50"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : comm.status === "approved" ? (
                            <Button
                              size="sm"
                              disabled={isActionLoading !== null}
                              onClick={() => handleApproveCommission(comm.id, "paid")}
                              className="rounded-xl h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Disburse (Mark Paid)
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No Action Needed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSubTab === "rates" && (
        <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Coins className="h-4.5 w-4.5 text-teal-500" />
              Referral Commission Rates
            </CardTitle>
            <CardDescription className="text-xs">
              Set the commission amount (in TZS) agents earn for each type of referral registration. Changes apply immediately to all future referrals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rates.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400">No commission rates configured yet.</p>
              </div>
            ) : (
              <form onSubmit={handleUpdateRates} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {rates.map((rate) => {
                    const typeConfig: Record<string, { label: string; icon: string; color: string; border: string }> = {
                      vendor: { label: "Vendor Registration", icon: "🏪", color: "bg-emerald-50 text-emerald-800", border: "border-emerald-200" },
                      customer: { label: "Customer Registration", icon: "👤", color: "bg-blue-50 text-blue-800", border: "border-blue-200" },
                      transporter: { label: "Transporter Registration", icon: "🚚", color: "bg-amber-50 text-amber-800", border: "border-amber-200" },
                    }
                    const config = typeConfig[rate.registration_type] || { label: rate.registration_type, icon: "📋", color: "bg-slate-50 text-slate-800", border: "border-slate-200" }
                    return (
                      <div
                        key={rate.registration_type}
                        className={`rounded-xl border ${config.border} p-5 space-y-3 transition-all hover:shadow-md`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{config.icon}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Commission Amount (TZS)
                          </label>
                          <Input
                            type="number"
                            min={0}
                            step={100}
                            value={rate.amount}
                            onChange={(e) => handleRateAmountChange(rate.registration_type, e.target.value)}
                            className="rounded-xl text-sm h-10 font-bold"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Current: <span className="font-bold text-slate-600">TZS {(rate.amount || 0).toLocaleString()}</span> per referral
                        </p>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isUpdatingRates}
                    className="rounded-xl text-xs h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/10"
                  >
                    {isUpdatingRates ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Commission Rates"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
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
