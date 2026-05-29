"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  Calendar,
  User,
  Store,
  Truck,
  CreditCard,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Package,
  MapPin,
  Phone,
  ArrowRight,
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

interface FinanceOrdersTabProps {
  orders: any[]
  transactions: any[]
  payouts: any[]
}

// Revenue split constants (derive from order total)
const TOLA_COMMISSION_RATE = 0.10
const DELIVERY_FEE_SHARE_RATE = 0.85 // 85% of delivery fee goes to transporter

export function FinanceOrdersTab({ orders, transactions, payouts }: FinanceOrdersTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false
      const searchLower = searchQuery.toLowerCase()
      const orderNumber = (order.order_number || "").toLowerCase()
      const customerName = (order.users?.full_name || order.shipping_address?.full_name || "").toLowerCase()
      const vendorName = (
        order.order_items?.[0]?.products?.shops?.vendors?.business_name ||
        order.order_items?.[0]?.products?.shops?.name ||
        ""
      ).toLowerCase()
      return (
        orderNumber.includes(searchLower) ||
        customerName.includes(searchLower) ||
        vendorName.includes(searchLower)
      )
    })
  }, [orders, searchQuery, statusFilter])

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    processing: "bg-purple-100 text-purple-700 border-purple-200",
    shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
    delivered: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    pending_payment: "bg-orange-100 text-orange-700 border-orange-200",
  }

  const paymentStatusColors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    pending: "bg-amber-100 text-amber-700",
  }

  // Compute revenue breakdown for a single order
  const getRevenueBreakdown = (order: any) => {
    const total = order.total_amount || 0
    const deliveryFee = order.delivery_fee || 0
    const productRevenue = total - deliveryFee
    const tolaCommission = productRevenue * TOLA_COMMISSION_RATE
    const vendorShare = productRevenue - tolaCommission
    const transporterShare = deliveryFee * DELIVERY_FEE_SHARE_RATE
    const tolaDeliveryShare = deliveryFee - transporterShare
    return {
      total,
      deliveryFee,
      productRevenue,
      tolaCommission: tolaCommission + tolaDeliveryShare,
      vendorShare,
      transporterShare,
    }
  }

  // Lookup matching escrow and payout records for the order
  const getOrderEscrow = (orderId: string) => transactions.find((t) => t.order_id === orderId)
  const getOrderPayouts = (orderId: string) => payouts.filter((p) => p.order_id === orderId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Order Economics</h3>
          <p className="text-slate-500 text-sm mt-1">Financial view of all marketplace orders with revenue breakdowns.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search order #, customer, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200 shadow-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-slate-200 px-4 gap-2">
                <Filter className="h-4 w-4" />
                <span>{statusFilter === "all" ? "All Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                <DropdownMenuCheckboxItem key={s} checked={statusFilter === s} onCheckedChange={() => setStatusFilter(s)}>
                  {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-20 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No orders found</h3>
            <p className="text-slate-500 mt-1 max-w-xs mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters or search term."
                : "There are currently no orders in the system."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const rev = getRevenueBreakdown(order)
            const isExpanded = expandedOrder === order.id
            const escrow = getOrderEscrow(order.id)

            return (
              <Card key={order.id} className="overflow-hidden hover:shadow-md transition-all border-slate-200">
                {/* Summary row */}
                <div
                  className="flex flex-col md:flex-row md:items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">#{order.order_number}</span>
                        <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold border ${statusColors[order.status] || "bg-slate-100 text-slate-600"}`}>
                          {order.status?.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${paymentStatusColors[order.payment_status] || "bg-slate-100 text-slate-600"}`}>
                          <CreditCard className="h-3 w-3 mr-1" />
                          {order.payment_status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {format(new Date(order.created_at), "PPP 'at' p")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-3 md:mt-0">
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total</p>
                      <p className="text-lg font-bold text-slate-900">TZS {rev.total.toLocaleString()}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/30 p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    {/* Identity & Parties */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><User className="h-3 w-3" /> Customer</p>
                        <p className="font-semibold text-slate-900">{order.users?.full_name || order.shipping_address?.full_name || "Guest"}</p>
                        <p className="text-sm text-slate-500">{order.users?.email || order.shipping_address?.email || "—"}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" />{order.users?.phone || order.shipping_address?.phone || "—"}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><Store className="h-3 w-3" /> Merchant</p>
                        <p className="font-semibold text-slate-900">
                          {order.order_items?.[0]?.products?.shops?.vendors?.business_name || order.order_items?.[0]?.products?.shops?.name || "N/A"}
                        </p>
                        <p className="text-sm text-slate-500">{order.order_items?.[0]?.products?.shops?.phone || "—"}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><Truck className="h-3 w-3" /> Driver</p>
                        {(() => {
                          const activeAssignment = order.transporter_assignments?.find((a: any) => a.status !== "cancelled")
                          const driverName = activeAssignment?.transporters?.users?.full_name || activeAssignment?.transporters?.business_name || "Unassigned"
                          const driverPhone = activeAssignment?.transporters?.users?.phone || "—"
                          return (
                            <>
                              <p className="font-semibold text-slate-900">{driverName}</p>
                              <p className="text-sm text-slate-500">{driverPhone}</p>
                            </>
                          )
                        })()}
                        {order.transporter_status && (
                          <Badge variant="outline" className="text-[11px] mt-1">
                            {order.transporter_status.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Payment summary */}
                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><CreditCard className="h-3 w-3" /> Payment Summary</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Method</p>
                          <p className="font-semibold text-slate-800 capitalize">{order.payment_method?.replace("-", " ") || "—"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Status</p>
                          <p className="font-semibold text-slate-800 capitalize">{order.payment_status}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Escrow</p>
                          <p className="font-semibold text-slate-800">{escrow ? escrow.status : "None"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Delivery</p>
                          <p className="font-semibold text-slate-800 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-rose-500" />
                            {order.shipping_address?.ward || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Revenue breakdown */}
                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Revenue Breakdown</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                          <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Order Total</p>
                          <p className="text-lg font-bold text-emerald-700 mt-1">TZS {rev.total.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                          <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Vendor Share</p>
                          <p className="text-lg font-bold text-blue-700 mt-1">TZS {rev.vendorShare.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                          <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Transporter</p>
                          <p className="text-lg font-bold text-indigo-700 mt-1">TZS {rev.transporterShare.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
                          <p className="text-[10px] uppercase font-bold text-purple-500 tracking-wider">TOLA Commission</p>
                          <p className="text-lg font-bold text-purple-700 mt-1">TZS {rev.tolaCommission.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                          <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Delivery Fee</p>
                          <p className="text-lg font-bold text-amber-700 mt-1">TZS {rev.deliveryFee.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
