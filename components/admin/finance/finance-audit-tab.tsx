"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  DollarSign,
  ShieldCheck,
  PieChart,
  Wallet,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"

interface FinanceAuditTabProps {
  orders: any[]
  transactions: any[]
  payouts: any[]
}

type AuditStep = {
  label: string
  status: "success" | "pending" | "failed" | "none"
  timestamp?: string
  detail?: string
}

export function FinanceAuditTab({ orders, transactions, payouts }: FinanceAuditTabProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Build an audit timeline per order
  const auditRecords = useMemo(() => {
    return orders.map((order) => {
      const escrow = transactions.find((t) => t.order_id === order.id)
      const orderPayouts = payouts.filter((p) => p.order_id === order.id)

      const steps: AuditStep[] = []

      // Step 1: Collection
      const collectionStatus = order.payment_status === "paid" ? "success" : order.payment_status === "failed" ? "failed" : "pending"
      steps.push({
        label: "Collection",
        status: collectionStatus,
        timestamp: order.created_at,
        detail: collectionStatus === "success"
          ? `TZS ${(order.total_amount || 0).toLocaleString()} via ${order.payment_method?.replace("-", " ") || "Mobile Money"}`
          : collectionStatus === "failed"
          ? "Payment failed"
          : "Awaiting payment",
      })

      // Step 2: Settlement
      if (escrow) {
        const settlementStatus = escrow.status === "released" ? "success" : escrow.status === "refunded" ? "failed" : "pending"
        steps.push({
          label: "Settlement",
          status: settlementStatus,
          timestamp: escrow.created_at,
          detail: settlementStatus === "success"
            ? `Settled on ${format(new Date(escrow.released_at || escrow.created_at), "MMM d, yyyy")}`
            : settlementStatus === "failed"
            ? "Funds refunded"
            : `TZS ${(escrow.amount || 0).toLocaleString()} held`,
        })
      } else {
        steps.push({
          label: "Settlement",
          status: order.payment_status === "paid" ? "pending" : "none",
          detail: order.payment_status === "paid" ? "Awaiting settlement" : "Not applicable",
        })
      }

      // Step 3: Disbursement (derived)
      const isDisbursed = order.status === "delivered" && order.payment_status === "paid"
      steps.push({
        label: "Disbursement",
        status: isDisbursed ? "success" : order.payment_status === "paid" ? "pending" : "none",
        detail: isDisbursed
          ? "Revenue split calculated"
          : order.payment_status === "paid"
          ? "Pending delivery confirmation"
          : "Not applicable",
      })

      // Step 4: Payout
      if (orderPayouts.length > 0) {
        const allCompleted = orderPayouts.every((p) => p.status === "completed")
        const anyFailed = orderPayouts.some((p) => p.status === "failed")
        steps.push({
          label: "Payout",
          status: allCompleted ? "success" : anyFailed ? "failed" : "pending",
          timestamp: orderPayouts[0]?.created_at,
          detail: allCompleted
            ? `${orderPayouts.length} payout(s) sent`
            : anyFailed
            ? "Payout failed"
            : `${orderPayouts.length} payout(s) pending`,
        })
      } else {
        steps.push({
          label: "Payout",
          status: isDisbursed ? "pending" : "none",
          detail: isDisbursed ? "Awaiting payout processing" : "Not applicable",
        })
      }

      return {
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.users?.full_name || order.shipping_address?.full_name || "Guest",
        vendorName: order.shops?.name || "N/A",
        totalAmount: order.total_amount || 0,
        orderStatus: order.status,
        createdAt: order.created_at,
        steps,
      }
    })
  }, [orders, transactions, payouts])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return auditRecords.filter(
      (r) =>
        r.orderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.vendorName.toLowerCase().includes(q)
    )
  }, [auditRecords, searchQuery])

  const stepIcons: Record<string, React.ReactNode> = {
    Collection: <DollarSign className="h-4 w-4" />,
    Settlement: <ShieldCheck className="h-4 w-4" />,
    Disbursement: <PieChart className="h-4 w-4" />,
    Payout: <Wallet className="h-4 w-4" />,
  }

  const statusIconMap = (status: AuditStep["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-rose-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-slate-300" />
    }
  }

  const statusBg = (status: AuditStep["status"]) => {
    switch (status) {
      case "success":
        return "bg-emerald-50 border-emerald-200"
      case "pending":
        return "bg-amber-50 border-amber-200"
      case "failed":
        return "bg-rose-50 border-rose-200"
      default:
        return "bg-slate-50 border-slate-200"
    }
  }

  const connectorColor = (status: AuditStep["status"]) => {
    switch (status) {
      case "success":
        return "bg-emerald-400"
      case "pending":
        return "bg-amber-300"
      case "failed":
        return "bg-rose-300"
      default:
        return "bg-slate-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Audit & Timeline</h3>
          <p className="text-slate-500 text-sm mt-1">
            Full financial lifecycle per order: Collection → Settlement → Disbursement → Payout.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search order #, customer, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-slate-200 shadow-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Clock className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No audit records</h3>
            <p className="text-slate-500 mt-1 text-sm">No orders match your search query.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((record) => (
            <Card key={record.id} className="shadow-sm hover:shadow-md transition-all border-slate-200 overflow-hidden">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-slate-900">Order #{record.orderNumber}</span>
                      <Badge variant="outline" className="text-[11px] rounded-lg">{record.orderStatus}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {record.customerName} • {record.vendorName} • {format(new Date(record.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Amount</p>
                    <p className="text-xl font-bold text-slate-900">TZS {record.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex flex-col md:flex-row items-stretch gap-0">
                  {record.steps.map((step, idx) => (
                    <div key={step.label} className="flex items-center flex-1">
                      <div className={`flex-1 p-4 rounded-xl border-2 ${statusBg(step.status)} transition-all`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
                            step.status === "success" ? "bg-emerald-100" :
                            step.status === "pending" ? "bg-amber-100" :
                            step.status === "failed" ? "bg-rose-100" : "bg-slate-100"
                          }`}>
                            {stepIcons[step.label]}
                          </div>
                          <span className="font-bold text-sm text-slate-700">{step.label}</span>
                          {statusIconMap(step.status)}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{step.detail}</p>
                        {step.timestamp && (
                          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                            {format(new Date(step.timestamp), "MMM d, yyyy 'at' p")}
                          </p>
                        )}
                      </div>
                      {idx < record.steps.length - 1 && (
                        <div className="hidden md:flex items-center px-1">
                          <div className={`h-0.5 w-4 ${connectorColor(step.status)} rounded-full`} />
                          <ArrowRight className={`h-3.5 w-3.5 shrink-0 ${
                            step.status === "success" ? "text-emerald-400" :
                            step.status === "pending" ? "text-amber-300" : "text-slate-300"
                          }`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
