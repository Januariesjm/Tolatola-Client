"use client"

/**
 * The "Agents" sub-tab of the admin agent management page: search/status
 * filters, the create-agent trigger, and the agent table.
 *
 * Extracted verbatim from components/admin/agent-management-tab.tsx.
 */

import { Loader2, Mail, MapPin, Search, Trash2, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatTzs } from "@/lib/agent/wallet"
import type { AdminAgent } from "@/lib/admin/agent-types"

export interface AgentsListSubTabProps {
  filteredAgents: AdminAgent[]
  isLoading: boolean
  isActionLoading: string | null
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  onCreateClick: () => void
  onToggleStatus: (agentId: string, currentStatus: string) => void
  onResendInvitation: (agentId: string) => void
  onDeleteTarget: (target: { id: string; name: string; code: string }) => void
}

export function AgentsListSubTab({
  filteredAgents,
  isLoading,
  isActionLoading,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  onCreateClick,
  onToggleStatus,
  onResendInvitation,
  onDeleteTarget,
}: AgentsListSubTabProps) {
  return (
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
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="pl-9 h-9 w-60 rounded-xl text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <Button onClick={onCreateClick} className="rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
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
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{agent.agent_code}</td>
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
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                          agent.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant={agent.status === "active" ? "destructive" : "outline"}
                          disabled={isActionLoading === `status-${agent.id}`}
                          onClick={() => onToggleStatus(agent.id, agent.status)}
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
                          onClick={() => onResendInvitation(agent.id)}
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
                          onClick={() => onDeleteTarget({ id: agent.id, name: agent.users?.full_name || "Agent", code: agent.agent_code })}
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
  )
}
