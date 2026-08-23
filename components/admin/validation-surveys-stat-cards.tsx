"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, TrendingUp, ShieldCheck, Truck, Store, Search, BarChart3, AlertTriangle, Wifi, CreditCard } from "lucide-react"
import type { SurveyStats } from "@/lib/admin/validation-surveys-types"

interface ValidationSurveysStatCardsProps {
  stats: SurveyStats
}

/** Extracted from validation-surveys-tab.tsx -- purely presentational, no state or fetching of its own. */
export function ValidationSurveysStatCards({ stats }: ValidationSurveysStatCardsProps) {
  const statCards = [
    { label: "Total Responses", value: stats.totalResponses, icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
    { label: "Consumers", value: stats.totalConsumers, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Vendors", value: stats.totalVendors, icon: Store, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Transporters", value: stats.totalTransporters, icon: Truck, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Trust Problem", value: `${stats.trustProblemPct}%`, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    { label: "Info Gap", value: `${stats.informationGapPct}%`, icon: Search, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Digital Adoption", value: `${stats.digitalAdoptionPct}%`, icon: Wifi, color: "text-cyan-600", bg: "bg-cyan-100" },
    { label: "Willing to Pay", value: `${stats.willingnessToPayPct}%`, icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Escrow Acceptance", value: `${stats.escrowAcceptancePct}%`, icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" },
    {
      label: "Buyer Protection",
      value: `${stats.buyerProtectionAcceptancePct}%`,
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-100",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {statCards.map((sc) => (
        <Card key={sc.label} className="shadow-sm border border-slate-100">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{sc.label}</span>
              <div className={`h-7 w-7 rounded-full ${sc.bg} flex items-center justify-center`}>
                <sc.icon className={`h-3.5 w-3.5 ${sc.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{sc.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
