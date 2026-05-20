"use client"

import { useState } from "react"
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
import { AgentRegisterUserDialog } from "./agent-register-user-dialog"

interface AgentOverviewTabProps {
  stats: any
  agent: any
  setActiveTab: (tab: string) => void
  registrations: any[]
}

export function AgentOverviewTab({
  stats,
  agent,
  setActiveTab,
  registrations,
}: AgentOverviewTabProps) {
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [registerType, setRegisterType] = useState<"vendor" | "customer" | "transporter">("vendor")

  const openRegisterDialog = (type: "vendor" | "customer" | "transporter") => {
    setRegisterType(type)
    setIsRegisterDialogOpen(true)
  }

  // Format currency
  const formatTzs = (amount: number) => {
    return `TZS ${(amount || 0).toLocaleString()}`
  }

  // Get recent 5 registrations
  const recentRegistrations = (registrations || []).slice(0, 5)

  // Quick Action List
  const quickActions = [
    {
      label: "Sajili Muuzaji (Vendor)",
      desc: "Sajili duka jipya au mfanyabiashara kwenye TolaTola",
      color: "from-emerald-500 to-teal-500",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
      icon: Store,
      action: () => openRegisterDialog("vendor"),
    },
    {
      label: "Sajili Mteja (Customer)",
      desc: "Sajili mnunuzi mpya kwenye soko la Tolatola",
      color: "from-blue-500 to-indigo-500",
      bgLight: "bg-blue-50",
      textColor: "text-blue-700",
      icon: Users,
      action: () => openRegisterDialog("customer"),
    },
    {
      label: "Sajili Msafirishaji",
      desc: "Sajili dereva wa bodaboda, bajaji au gari la mizigo",
      color: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-700",
      icon: Truck,
      action: () => openRegisterDialog("transporter"),
    },
  ]

  // KPI card configs
  const kpiCards = [
    {
      title: "Total Registrations",
      value: stats.totalRegistrations || 0,
      subtext: "Jumla ya usajili wote uliokamilika",
      icon: Users,
      color: "border-slate-200 text-slate-800",
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      title: "Vendors Registered",
      value: stats.vendorsRegistered || 0,
      subtext: "Jumla ya wauzaji uliowasajili",
      icon: Store,
      color: "border-emerald-100 text-emerald-800",
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Customers Registered",
      value: stats.customersRegistered || 0,
      subtext: "Jumla ya wateja uliowasajili",
      icon: Users,
      color: "border-blue-100 text-blue-800",
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Transporters Registered",
      value: stats.transportersRegistered || 0,
      subtext: "Wasafirishaji waliounganishwa",
      icon: Truck,
      color: "border-amber-100 text-amber-800",
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      title: "Total Commission Earned",
      value: formatTzs(stats.totalCommission || 0),
      subtext: "Jumla ya kamisheni zote",
      icon: Coins,
      color: "border-teal-200 bg-gradient-to-br from-white to-teal-50/20 text-teal-900",
      iconBg: "bg-teal-100 text-teal-600",
    },
    {
      title: "Pending Commission",
      value: formatTzs(stats.pendingCommission || 0),
      subtext: "Inasubiri kuidhinishwa na admin",
      icon: Clock,
      color: "border-indigo-100 text-indigo-800",
      iconBg: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Active Registrations",
      value: stats.activeUsers || 0,
      subtext: "Watumiaji waliothibitishwa",
      icon: ShieldCheck,
      color: "border-purple-100 text-purple-800",
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      title: "Monthly Registrations",
      value: stats.monthlyRegistrations || 0,
      subtext: "Utendaji wa mwezi huu",
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
            Karibu tena, {agent.users?.full_name || "Sales Officer"}!
          </h2>
          <p className="text-slate-600 text-sm md:text-base mb-4">
            Hapa ni kitovu cha usimamizi wako wa mauzo na usajili. Tumia vitendo vya haraka hapa chini kusajili wateja wapya, wauzaji au wasafirishaji na ufuatilie mapato yako moja kwa moja.
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

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Quick Actions — Vitendo vya Haraka
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((act, i) => {
            const Icon = act.icon
            return (
              <Card
                key={i}
                onClick={act.action}
                className="group relative cursor-pointer border border-slate-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 rounded-xl"
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`p-3.5 rounded-xl bg-gradient-to-tr ${act.color} text-white shadow-lg shadow-emerald-500/10`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm md:text-base mb-1 group-hover:text-emerald-600 transition-colors">
                      {act.label}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {act.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Performance Overview — Muhtasari wa Utendaji
        </h3>
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
              Usajili wa Hivi Karibuni
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("registrations")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-lg"
            >
              Tazama Zote
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentRegistrations.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400">Hujasajili mtumiaji yeyote bado.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openRegisterDialog("vendor")}
                  className="mt-3 text-xs"
                >
                  Sajili Sasa
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
              Miongozo ya Kamisheni
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs leading-relaxed text-slate-600">
            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100/60">
              <h5 className="font-bold text-amber-900 mb-1">Jinsi ya Kulipwa:</h5>
              <p>Kamisheni inatengenezwa kiotomatiki mara tu unaposajili duka, mteja au msafirishaji. Usajili unahitaji kuidhinishwa na admin kabla ya malipo kukamilika.</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="font-medium">Msajili wa Duka (Vendor)</span>
                <span className="font-bold text-slate-900">Kamisheni Nyingi</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="font-medium">Msajili wa Transporter</span>
                <span className="font-bold text-slate-900">Kamisheni ya Kati</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="font-medium">Msajili wa Mteja</span>
                <span className="font-bold text-slate-900">Kamisheni ya Msingi</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal italic">
              *Hakikisha usajili wako wote unatumia eneo sahihi la GPS ili kupunguza muda wa kuidhinishwa na admin.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unified Register User Dialog */}
      <AgentRegisterUserDialog
        isOpen={isRegisterDialogOpen}
        onClose={() => setIsRegisterDialogOpen(false)}
        type={registerType}
      />
    </div>
  )
}
