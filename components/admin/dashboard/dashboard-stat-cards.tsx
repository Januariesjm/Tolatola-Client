"use client"

import type { ReactNode } from "react"
import {
  Briefcase,
  CreditCard,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangeFilter, type DatePeriod } from "../date-range-filter"

/** One overview metric. */
interface StatCard {
  key: string
  title: string
  icon: LucideIcon
  /** Tailwind classes for the card border and the icon bubble. */
  border: string
  iconBubble: string
  iconColor: string
  value: ReactNode
  isVisible: boolean
}

export interface DashboardStatCardsProps {
  permissions: string[]
  canManageAgents: boolean
  period: DatePeriod
  onPeriodChange: (period: DatePeriod) => void
  /** Metric values, computed by the caller from date-filtered data. */
  metrics: {
    grossMerchandiseValue: number
    pendingPayouts: number
    activeOrders: number
    pendingVendorKyc: number
    pendingTransporterKyc: number
    totalCustomers?: number
    openTickets: number
    totalAdmins?: number
    pendingJobs: number
    salesAgents: number
  }
}

/**
 * The "Overview" metric strip. Each card is permission-gated, so an admin only
 * sees the numbers their role covers.
 */
export function DashboardStatCards({
  permissions,
  canManageAgents,
  period,
  onPeriodChange,
  metrics,
}: DashboardStatCardsProps) {
  const can = (permission: string) => permissions.includes(permission)

  const cards: StatCard[] = [
    {
      key: "gmv",
      title: "Total GMV",
      icon: DollarSign,
      border: "border-primary/20",
      iconBubble: "bg-emerald-50",
      iconColor: "text-emerald-600",
      value: `TZS ${metrics.grossMerchandiseValue.toLocaleString()}`,
      isVisible: can("manage_transactions"),
    },
    {
      key: "pending-payouts",
      title: "Pending Payouts",
      icon: CreditCard,
      border: "border-indigo-100",
      iconBubble: "bg-indigo-50",
      iconColor: "text-indigo-600",
      value: metrics.pendingPayouts,
      isVisible: can("manage_payouts"),
    },
    {
      key: "active-orders",
      title: "Active Orders",
      icon: ShoppingCart,
      border: "border-primary/15",
      iconBubble: "bg-primary/5",
      iconColor: "text-primary",
      value: metrics.activeOrders,
      isVisible: can("manage_orders"),
    },
    {
      key: "pending-vendor-kyc",
      title: "Pending Vendor KYC",
      icon: Store,
      border: "border-amber-100",
      iconBubble: "bg-amber-50",
      iconColor: "text-amber-600",
      value: metrics.pendingVendorKyc,
      isVisible: can("manage_kyc"),
    },
    {
      key: "pending-transporter-kyc",
      title: "Pending Transporter KYC",
      icon: Truck,
      border: "border-amber-100",
      iconBubble: "bg-amber-50",
      iconColor: "text-amber-600",
      value: metrics.pendingTransporterKyc,
      isVisible: can("manage_transporters"),
    },
    {
      key: "total-customers",
      title: "Total Customers",
      icon: Users,
      border: "border-blue-100",
      iconBubble: "bg-blue-50",
      iconColor: "text-blue-600",
      value: metrics.totalCustomers?.toLocaleString() || 0,
      isVisible: can("manage_customers"),
    },
    {
      key: "open-tickets",
      title: "Open Tickets",
      icon: MessageSquare,
      border: "border-red-100",
      iconBubble: "bg-red-50",
      iconColor: "text-red-600",
      value: metrics.openTickets,
      isVisible: can("manage_support"),
    },
    {
      key: "system-admins",
      title: "System Admins",
      icon: ShieldCheck,
      border: "border-purple-100",
      iconBubble: "bg-purple-50",
      iconColor: "text-purple-600",
      value: metrics.totalAdmins?.toLocaleString() || 0,
      isVisible: can("manage_admins") || can("manage_system"),
    },
    {
      key: "pending-jobs",
      title: "Pending Jobs",
      icon: Briefcase,
      border: "border-pink-100",
      iconBubble: "bg-pink-50",
      iconColor: "text-pink-600",
      value: metrics.pendingJobs,
      isVisible: can("manage_hr"),
    },
    {
      key: "sales-agents",
      title: "Sales Agents",
      icon: Users,
      border: "border-teal-100",
      iconBubble: "bg-teal-50",
      iconColor: "text-teal-600",
      value: metrics.salesAgents,
      isVisible: canManageAgents,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-800">Overview</h2>
        <DateRangeFilter value={period} onChange={onPeriodChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards
          .filter((card) => card.isVisible)
          .map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.key} className={`shadow-sm rounded-xl border ${card.border} bg-white`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {card.title}
                  </CardTitle>
                  <div
                    className={`h-8 w-8 rounded-full ${card.iconBubble} flex items-center justify-center`}
                  >
                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{card.value}</div>
                </CardContent>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
