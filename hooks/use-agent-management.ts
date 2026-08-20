"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { logger, normalizeError } from "@/lib/logger"
import {
  EMPTY_AGENT_STATS,
  type AdminAgent,
  type AgentCommission,
  type AgentCommissionRate,
  type AgentStats,
} from "@/lib/admin/agent-types"

const log = logger.child("admin.agent-management")

/**
 * Data layer for the admin agent-management tab: the agent/commission/rate
 * lists, the stats row, and every mutation the tab can perform.
 *
 * Extracted from components/admin/agent-management-tab.tsx, which mixed all of
 * this with ~600 lines of JSX in one 950-line file. Keeping fetches and
 * mutations here means the components are presentational and this logic is
 * testable on its own.
 */
export function useAgentManagement(initialAgents: AdminAgent[]) {
  const { toast } = useToast()

  // Loading & Data States
  const [agents, setAgents] = useState<AdminAgent[]>(initialAgents || [])
  const [commissions, setCommissions] = useState<AgentCommission[]>([])
  const [rates, setRates] = useState<AgentCommissionRate[]>([])
  const [isUpdatingRates, setIsUpdatingRates] = useState(false)
  const [stats, setStats] = useState<AgentStats>(EMPTY_AGENT_STATS)

  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Create Agent Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    role_name: "Sales Agent",
    region: "",
    district: "",
    area: "",
  })

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; code: string } | null>(null)

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    }
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

  // Fetch stats & lists
  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const headers = await getAuthHeaders()

      const [statsRes, agentsRes, commsRes, ratesRes] = await Promise.all([
        fetch(`${apiBase}/admin/agents/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiBase}/admin/agents`, { headers }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch(`${apiBase}/admin/agents/commissions`, { headers }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch(`${apiBase}/admin/agents/commission-rates`, { headers }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      ])

      if (statsRes?.stats) setStats(statsRes.stats)
      if (agentsRes) setAgents(agentsRes.data || [])
      if (commsRes) setCommissions(commsRes.data || [])
      if (ratesRes?.data) setRates(ratesRes.data || [])
    } catch (err) {
      log.error("failed to load agent data", err)
      toast({
        title: "Loading Failed",
        description: "Failed to load agent data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRates = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingRates(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${apiBase}/admin/agents/commission-rates`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ rates }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update rates")

      toast({
        title: "Rates Updated Successfully",
        description: "Agent referral commission rates have been saved.",
      })
      fetchAllData()
    } catch (err) {
      log.error("failed to update commission rates", err)
      toast({
        title: "Update Failed",
        description: normalizeError(err).message || "Could not update commission rates.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingRates(false)
    }
  }

  const handleRateAmountChange = (type: string, amount: string) => {
    setRates(prev => prev.map(r => r.registration_type === type ? { ...r, amount: Number(amount) || 0 } : r))
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  // Action: Toggle agent status
  const handleToggleStatus = async (agentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active"
    setIsActionLoading(`status-${agentId}`)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${apiBase}/admin/agents/${agentId}/activate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) throw new Error("Failed to update agent status")

      toast({
        title: "Agent Status Updated",
        description: `Agent is now ${nextStatus}.`,
      })
      fetchAllData()
    } catch (err) {
      log.error("failed to update agent status", err, { agentId, nextStatus })
      toast({
        title: "Failed",
        description: "Could not update agent status.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  // Action: Delete agent permanently
  const handleDeleteAgent = async (agentId: string) => {
    setIsActionLoading(`delete-${agentId}`)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${apiBase}/admin/agents/${agentId}`, {
        method: "DELETE",
        headers,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to delete agent")
      toast({
        title: "Agent Deleted",
        description: result.message || "Agent has been permanently removed.",
      })
      setDeleteTarget(null)
      fetchAllData()
    } catch (err) {
      log.error("failed to delete agent", err, { agentId })
      toast({
        title: "Delete Failed",
        description: normalizeError(err).message || "Could not delete agent.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  // Action: Resend activation email
  const handleResendInvitation = async (agentId: string) => {
    setIsActionLoading(`resend-${agentId}`)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${apiBase}/admin/agents/${agentId}/resend-invitation`, {
        method: "POST",
        headers,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to resend invitation")
      toast({
        title: "Email Sent",
        description: result.message || "Activation email has been resent.",
      })
    } catch (err) {
      log.error("failed to resend agent invitation", err, { agentId })
      toast({
        title: "Resend Failed",
        description: normalizeError(err).message || "Could not resend the invitation email.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  // Action: Approve commission payout
  const handleApproveCommission = async (commId: string, status: "approved" | "paid" | "rejected") => {
    setIsActionLoading(`comm-${commId}`)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${apiBase}/admin/agents/commissions/${commId}/approve`, {
        method: "POST",
        headers,
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Failed to update commission")

      toast({
        title: "Commission Updated",
        description: `Commission status has been changed to ${status}.`,
      })
      fetchAllData()
    } catch (err) {
      log.error("failed to update commission status", err, { commissionId: commId, status })
      toast({
        title: "Failed",
        description: "Could not approve commission.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  // Create Agent handler
  const handleCreateAgent = async () => {
    if (!createForm.email || !createForm.full_name || !createForm.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in email, full name, and phone number.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${apiBase}/admin/agents`, {
        method: "POST",
        headers,
        body: JSON.stringify(createForm),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create agent")
      }

      toast({
        title: "Agent Created!",
        description: result.message || `Agent ${createForm.full_name} has been created successfully.`,
      })

      setIsCreateOpen(false)
      setCreateForm({
        email: "",
        full_name: "",
        phone: "",
        role_name: "Sales Agent",
        region: "",
        district: "",
        area: "",
      })
      fetchAllData()
    } catch (err) {
      log.error("failed to create agent", err, { email: createForm.email })
      toast({
        title: "Failed",
        description: normalizeError(err).message || "Could not create new agent.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Filters application
  const filteredAgents = agents.filter((agent) => {
    const name = agent.users?.full_name || ""
    const code = agent.agent_code || ""
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return {
    // data
    agents,
    filteredAgents,
    commissions,
    rates,
    stats,
    // load / action state
    isLoading,
    isActionLoading,
    isUpdatingRates,
    isCreating,
    // filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    // create dialog
    isCreateOpen,
    setIsCreateOpen,
    createForm,
    setCreateForm,
    // delete dialog
    deleteTarget,
    setDeleteTarget,
    // actions
    refresh: fetchAllData,
    handleUpdateRates,
    handleRateAmountChange,
    handleToggleStatus,
    handleDeleteAgent,
    handleResendInvitation,
    handleApproveCommission,
    handleCreateAgent,
  }
}

export type AgentManagementState = ReturnType<typeof useAgentManagement>
