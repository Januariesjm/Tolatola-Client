"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Smartphone,
  ArrowDownRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

interface FinanceCollectionsTabProps {
  orders: any[]
}

export function FinanceCollectionsTab({ orders }: FinanceCollectionsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")

  // Derive collection records from orders (incoming payments from customers)
  const collections = useMemo(() => {
    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.users?.full_name || order.shipping_address?.full_name || "Guest",
      customerPhone: order.users?.phone || order.shipping_address?.phone || "—",
      vendorName: order.order_items?.[0]?.products?.shops?.vendors?.business_name || order.order_items?.[0]?.products?.shops?.name || "N/A",
      amount: order.total_amount || 0,
      paymentMethod: order.payment_method || "mobile-money",
      paymentStatus: order.payment_status || "pending",
      createdAt: order.created_at,
      orderStatus: order.status,
    }))
  }, [orders])

  const filtered = useMemo(() => {
    return collections.filter((c) => {
      if (paymentFilter !== "all" && c.paymentStatus !== paymentFilter) return false
      const q = searchQuery.toLowerCase()
      return (
        c.orderNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.toLowerCase().includes(q) ||
        c.vendorName.toLowerCase().includes(q)
      )
    })
  }, [collections, searchQuery, paymentFilter])

  const totalCollected = filtered.filter((c) => c.paymentStatus === "paid").reduce((sum, c) => sum + c.amount, 0)
  const totalPending = filtered.filter((c) => c.paymentStatus === "pending").reduce((sum, c) => sum + c.amount, 0)
  const totalFailed = filtered.filter((c) => c.paymentStatus === "failed").reduce((sum, c) => sum + c.amount, 0)

  const statusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    if (status === "failed") return <XCircle className="h-4 w-4 text-rose-600" />
    return <Clock className="h-4 w-4 text-amber-600" />
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      failed: "bg-rose-100 text-rose-700 border-rose-200",
    }
    return colors[status] || "bg-slate-100 text-slate-600 border-slate-200"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Collections</h3>
          <p className="text-slate-500 text-sm mt-1">Incoming payments from customers linked to order references.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search order #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200 shadow-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-slate-200 px-4 gap-2">
                <Filter className="h-4 w-4" />
                <span>{paymentFilter === "all" ? "All" : paymentFilter.charAt(0).toUpperCase() + paymentFilter.slice(1)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
              <DropdownMenuLabel>Payment Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["all", "paid", "pending", "failed"].map((s) => (
                <DropdownMenuCheckboxItem key={s} checked={paymentFilter === s} onCheckedChange={() => setPaymentFilter(s)}>
                  {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm rounded-xl border-emerald-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Successful</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">TZS {totalCollected.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{filtered.filter((c) => c.paymentStatus === "paid").length} payments</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-amber-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Pending</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">TZS {totalPending.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{filtered.filter((c) => c.paymentStatus === "pending").length} payments</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-rose-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Failed</CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">TZS {totalFailed.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{filtered.filter((c) => c.paymentStatus === "failed").length} payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Collection Records */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <ArrowDownRight className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No collection records</h3>
            <p className="text-slate-500 mt-1 text-sm">No incoming payments match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500 w-12">#</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Order Ref</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Source</th>
                    <th className="text-right py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Amount</th>
                    <th className="text-center py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-semibold text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">#{c.orderNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{c.customerName}</p>
                        <p className="text-xs text-slate-400">{c.customerPhone}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Shop: {c.vendorName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Smartphone className="h-3.5 w-3.5" />
                          <span className="capitalize text-xs font-medium">{c.paymentMethod.replace("-", " ")}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        TZS {c.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 text-[11px] font-semibold border ${statusBadge(c.paymentStatus)}`}>
                          <span className="mr-1">{statusIcon(c.paymentStatus)}</span>
                          {c.paymentStatus === "paid" ? "Success" : c.paymentStatus.charAt(0).toUpperCase() + c.paymentStatus.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {format(new Date(c.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
