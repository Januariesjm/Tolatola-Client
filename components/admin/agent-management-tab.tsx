"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Users,
  MapPin,
  Loader2,
  Coins,
  Search,
  CheckCircle,
  XCircle,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react"

interface AgentManagementTabProps {
  initialAgents: any[]
}

export function AgentManagementTab({ initialAgents }: AgentManagementTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeSubTab, setActiveSubTab] = useState<"agents" | "commissions">("agents")
  
  // Loading & Data States
  const [agents, setAgents] = useState<any[]>(initialAgents || [])
  const [commissions, setCommissions] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    totalAgents: 0,
    activeAgents: 0,
    suspendedAgents: 0,
    totalRegistrations: 0,
    totalCommission: 0,
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Create Agent Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role_name: "Sales Agent",
    region: "",
    district: "",
    area: "",
  })

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

      const [statsRes, agentsRes, commsRes] = await Promise.all([
        fetch(`${apiBase}/admin/agents/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiBase}/admin/agents`, { headers }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch(`${apiBase}/admin/agents/commissions`, { headers }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      ])

      if (statsRes?.stats) setStats(statsRes.stats)
      if (agentsRes) setAgents(agentsRes.data || [])
      if (commsRes) setCommissions(commsRes.data || [])
    } catch (err) {
      console.error("[ADMIN AGENTS] Fetch failed:", err)
      toast({
        title: "Hitilafu ya kupakia",
        description: "Imeshindwa kupata taarifa za mawakala.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
        title: "Hali ya Wakala Imesasishwa",
        description: `Wakala sasa yuko ${nextStatus}.`,
      })
      fetchAllData()
    } catch (err) {
      toast({
        title: "Imeshindikana",
        description: "Imeshindwa kusasisha hali ya wakala.",
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
        title: "Kamisheni Imesasishwa",
        description: `Hali ya malipo imebadilishwa kuwa ${status}.`,
      })
      fetchAllData()
    } catch (err) {
      toast({
        title: "Imeshindikana",
        description: "Imeshindwa kuidhinisha kamisheni.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  // Create Agent handler
  const handleCreateAgent = async () => {
    if (!createForm.email || !createForm.password || !createForm.full_name || !createForm.phone) {
      toast({
        title: "Taarifa Zinakosekana",
        description: "Tafadhali jaza email, password, jina kamili, na nambari ya simu.",
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
        title: "Wakala Ameundwa!",
        description: result.message || `Wakala ${createForm.full_name} ameundwa kwa mafanikio.`,
      })

      setIsCreateOpen(false)
      setCreateForm({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role_name: "Sales Agent",
        region: "",
        district: "",
        area: "",
      })
      fetchAllData()
    } catch (err: any) {
      toast({
        title: "Imeshindikana",
        description: err.message || "Imeshindwa kuunda wakala mpya.",
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
          Orodha ya Mawakala (Agents List)
        </button>
        <button
          onClick={() => setActiveSubTab("commissions")}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === "commissions" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Kuidhinisha Kamisheni ({commissions.filter(c => c.status === "pending").length} Pending)
        </button>
      </div>

      {activeSubTab === "agents" ? (
        <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Usimamizi wa Mawakala</CardTitle>
                <CardDescription className="text-xs">Fungua, fungia, au sasisha maeneo ya mawakala wa mauzo.</CardDescription>
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
                  <option value="all">Hali Zote (All Status)</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Unda Wakala Mpya
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
                <p className="text-xs text-slate-400">Hakuna wakala aliyepatikana.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
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
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-slate-50/40 transition-colors">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Foleni ya Kuidhinisha Kamisheni</CardTitle>
            <CardDescription className="text-xs">Uhakiki na idhini ya malipo ya kamisheni kwa mawakala.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <span className="text-xs text-slate-400">Loading commission queue...</span>
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xs text-slate-400">Hakuna kamisheni zinazosubiri idhini kwa sasa.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-6">Agent Details</th>
                      <th className="py-3 px-4">Registration Detail</th>
                      <th className="py-3 px-4">Payout Amount</th>
                      <th className="py-3 px-4">Hali (Status)</th>
                      <th className="py-3 px-4">Request Date</th>
                      <th className="py-3 px-6 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commissions.map((comm) => (
                      <tr key={comm.id} className="hover:bg-slate-50/40 transition-colors">
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

      {/* ── Create Agent Dialog ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Unda Wakala Mpya (Create New Agent)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Jaza taarifa za wakala mpya. Akaunti itaundwa na nywila uliyoweka.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Jina Kamili (Full Name) *</label>
              <Input
                placeholder="e.g. John Mwakasege"
                value={createForm.full_name}
                onChange={(e) => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                className="rounded-xl text-sm h-10"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Email Address *</label>
              <Input
                type="email"
                placeholder="e.g. john@tolatola.co"
                value={createForm.email}
                onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                className="rounded-xl text-sm h-10"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Password *</label>
              <div className="relative">
                <Input
                  type={showCreatePassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className="rounded-xl text-sm h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Nambari ya Simu (Phone) *</label>
              <Input
                type="tel"
                placeholder="e.g. +255712345678"
                value={createForm.phone}
                onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                className="rounded-xl text-sm h-10"
              />
            </div>

            {/* Role + Region Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Role</label>
                <select
                  value={createForm.role_name}
                  onChange={(e) => setCreateForm(f => ({ ...f, role_name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 outline-none"
                >
                  <option value="Sales Agent">Sales Agent</option>
                  <option value="Regional Supervisor">Regional Supervisor</option>
                  <option value="Sales Manager">Sales Manager</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Mkoa (Region)</label>
                <Input
                  placeholder="e.g. Dar es Salaam"
                  value={createForm.region}
                  onChange={(e) => setCreateForm(f => ({ ...f, region: e.target.value }))}
                  className="rounded-xl text-sm h-10"
                />
              </div>
            </div>

            {/* District + Area Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Wilaya (District)</label>
                <Input
                  placeholder="e.g. Ilala"
                  value={createForm.district}
                  onChange={(e) => setCreateForm(f => ({ ...f, district: e.target.value }))}
                  className="rounded-xl text-sm h-10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Eneo (Area)</label>
                <Input
                  placeholder="e.g. Kariakoo"
                  value={createForm.area}
                  onChange={(e) => setCreateForm(f => ({ ...f, area: e.target.value }))}
                  className="rounded-xl text-sm h-10"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
                className="rounded-xl text-xs h-9"
              >
                Ghairi (Cancel)
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={isCreating}
                className="rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Inaunda...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Unda Wakala
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
