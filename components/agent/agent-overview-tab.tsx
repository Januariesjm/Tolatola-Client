"use client"

import { useState, useEffect, useMemo } from "react"
import { DateRangeFilter, filterByDateRange, type DatePeriod } from "../admin/date-range-filter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Store,
  Truck,
  TrendingUp,
  Award,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Coins
} from "lucide-react"

interface AgentOverviewTabProps {
  stats: any
  agent: any
  setActiveTab: (tab: string) => void
  registrations: any[]
  commissions: any[]
}

export function AgentOverviewTab({
  stats,
  agent,
  setActiveTab,
  registrations,
  commissions,
}: AgentOverviewTabProps) {
  const [referralLink, setReferralLink] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [isLoadingReferral, setIsLoadingReferral] = useState(true)
  const [period, setPeriod] = useState<DatePeriod>("all")

  useEffect(() => {
    async function loadReferral() {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

        const response = await fetch(`${apiBase}/agents/referral-link`, {
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        })

        if (response.ok) {
          const data = await response.json()
          setReferralLink(data.referral_link)
          setReferralCode(data.referral_code)
        }
      } catch (err) {
        console.error("Failed to load referral details:", err)
      } finally {
        setIsLoadingReferral(false)
      }
    }
    loadReferral()
  }, [])

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Hello! Register on TOLA using my referral link to get started: ${referralLink || "https://tolatola.co/auth/sign-up?ref=" + agent.agent_code}`
  )}`

  // Format currency
  const formatTzs = (amount: number) => {
    return `TZS ${(amount || 0).toLocaleString()}`
  }

  const dateFilteredRegistrations = useMemo(() => filterByDateRange(registrations || [], period), [registrations, period])
  const dateFilteredCommissions = useMemo(() => filterByDateRange(commissions || [], period), [commissions, period])

  // Get recent 5 registrations
  const recentRegistrations = (dateFilteredRegistrations || []).slice(0, 5)

  const totalRegistrationsVal = dateFilteredRegistrations.length
  const vendorsRegisteredVal = dateFilteredRegistrations.filter((r) => r.registration_type === "vendor").length
  const customersRegisteredVal = dateFilteredRegistrations.filter((r) => r.registration_type === "customer").length
  const transportersRegisteredVal = dateFilteredRegistrations.filter((r) => r.registration_type === "transporter").length
  const totalCommissionVal = dateFilteredCommissions.reduce((sum, c) => sum + Number(c.amount), 0)
  const pendingCommissionVal = dateFilteredCommissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.amount), 0)
  const activeUsersVal = dateFilteredRegistrations.filter((r) => r.status === "active").length
  const monthlyRegistrationsVal = dateFilteredRegistrations.filter((r) => {
    const d = new Date(r.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // KPI card configs
  const kpiCards = [
    {
      title: "Total Registrations",
      value: totalRegistrationsVal,
      subtext: "Total of all completed registrations",
      icon: Users,
      color: "border-slate-200 text-slate-800",
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      title: "Vendors Registered",
      value: vendorsRegisteredVal,
      subtext: "Total vendors registered by you",
      icon: Store,
      color: "border-emerald-100 text-emerald-800",
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Customers Registered",
      value: customersRegisteredVal,
      subtext: "Total customers registered by you",
      icon: Users,
      color: "border-blue-100 text-blue-800",
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Transporters Registered",
      value: transportersRegisteredVal,
      subtext: "Total transporters connected",
      icon: Truck,
      color: "border-amber-100 text-amber-800",
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      title: "Total Commission Earned",
      value: formatTzs(totalCommissionVal),
      subtext: "Sum of all commissions earned",
      icon: Coins,
      color: "border-teal-200 bg-gradient-to-br from-white to-teal-50/20 text-teal-900",
      iconBg: "bg-teal-100 text-teal-600",
    },
    {
      title: "Pending Commission",
      value: formatTzs(pendingCommissionVal),
      subtext: "Awaiting approval by admin",
      icon: Clock,
      color: "border-indigo-100 text-indigo-800",
      iconBg: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Active Registrations",
      value: activeUsersVal,
      subtext: "Total verified active users",
      icon: ShieldCheck,
      color: "border-purple-100 text-purple-800",
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      title: "Monthly Registrations",
      value: monthlyRegistrationsVal,
      subtext: "Performance for this month",
      icon: TrendingUp,
      color: "border-pink-100 text-pink-800",
      iconBg: "bg-pink-50 text-pink-600",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
            Welcome back, {agent.users?.full_name || "Sales Officer"}!
          </h2>
          <p className="text-slate-600 text-sm md:text-base mb-4">
            This is your sales and registration management hub. Share your unique referral link below to automatically register and attribute new customers, vendors, or transporters to your profile.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Agent Code: <span className="font-mono text-slate-900 font-bold">{agent.agent_code}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
              Status: <span className="font-bold capitalize">{agent.status}</span>
            </span>
          </div>
        </div>
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* Referral Link Card */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Your Referral Link
        </h3>
        <Card className="border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 mb-1">
                <Award className="h-3.5 w-3.5" />
                Refer & Earn Commission
              </div>
              <h4 className="text-lg font-bold text-slate-900">Invite new Customers, Vendors, and Transporters</h4>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xl">
                Share your unique referral link. When they click it and complete sign-up, they will be automatically mapped to your dashboard, and you will earn commissions upon approval.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-mono text-xs text-slate-700 select-all overflow-x-auto whitespace-nowrap shadow-inner flex-1 lg:flex-initial">
                {isLoadingReferral ? (
                  <span className="text-slate-400">Generating link...</span>
                ) : (
                  referralLink || `https://tolatola.co/auth/sign-up?ref=${agent.agent_code}`
                )}
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={handleCopy}
                  disabled={isLoadingReferral}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all text-xs"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold px-4 py-3 rounded-xl gap-1.5 shadow-md shadow-emerald-500/15 transition-all text-xs"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Performance Overview
          </h3>
          <DateRangeFilter value={period} onChange={setPeriod} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => {
            const Icon = kpi.icon
            return (
              <Card key={i} className={`shadow-sm rounded-xl border transition-all hover:shadow-md ${kpi.color}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    {kpi.title}
                  </CardTitle>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold tracking-tight mb-1">
                    {kpi.value}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {kpi.subtext}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Activity Table and Quick Leaderboard info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations Table */}
        <Card className="lg:col-span-2 shadow-sm rounded-xl border border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800">
              Recent Registrations
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("registrations")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-lg"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentRegistrations.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400">You haven't registered any users yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="mt-3 text-xs"
                >
                  Copy Referral Link
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3 px-1">Name</th>
                      <th className="py-3 px-1">Category</th>
                      <th className="py-3 px-1">Phone</th>
                      <th className="py-3 px-1">Status</th>
                      <th className="py-3 px-1">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-1 font-bold text-slate-900 truncate max-w-[120px]">
                          {reg.full_name}
                        </td>
                        <td className="py-3 px-1 capitalize">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            reg.registration_type === "vendor" ? "bg-emerald-50 text-emerald-700" :
                            reg.registration_type === "customer" ? "bg-blue-50 text-blue-700" :
                            "bg-amber-50 text-amber-700"
                          }`}>
                            {reg.registration_type}
                          </span>
                        </td>
                        <td className="py-3 px-1 text-slate-600 font-mono">
                          {reg.phone}
                        </td>
                        <td className="py-3 px-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                            reg.status === "active" ? "bg-emerald-100 text-emerald-800" :
                            reg.status === "pending" ? "bg-amber-100 text-amber-800" :
                            "bg-slate-100 text-slate-800"
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="py-3 px-1 text-slate-400">
                          {new Date(reg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tips or Rewards Info */}
        <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-amber-500" />
              Commission Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs leading-relaxed text-slate-600">
            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100/60">
              <h5 className="font-bold text-amber-900 mb-1">How to Earn:</h5>
              <p>Commissions are automatically calculated once someone registers using your referral link. Registrations must be approved by an administrator before payouts are finalized.</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="font-medium">Shop Registration (Vendor)</span>
                <span className="font-bold text-slate-900">High Commission</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="font-medium">Transporter Registration</span>
                <span className="font-bold text-slate-900">Medium Commission</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="font-medium">Customer Registration</span>
                <span className="font-bold text-slate-900">Standard Commission</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal italic">
              *Make sure all referred registrations complete their profile and verify email/SMS to minimize admin approval times.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
