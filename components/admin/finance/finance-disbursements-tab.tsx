"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Store,
  Truck,
  DollarSign,
  PieChart,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react"
import { format } from "date-fns"

interface FinanceDisbursementsTabProps {
  orders: any[]
}

// Revenue split constants
const TOLA_COMMISSION_RATE = 0.10
const DELIVERY_FEE_TRANSPORTER_SHARE = 0.85

export function FinanceDisbursementsTab({ orders }: FinanceDisbursementsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  // Only show disbursement data for orders that have been paid
  const paidOrders = useMemo(() => {
    return orders.filter((o) => o.payment_status === "paid")
  }, [orders])

  const disbursements = useMemo(() => {
    return paidOrders
      .map((order) => {
        const total = order.total_amount || 0
        const deliveryFee = order.delivery_fee || 0
        const productRevenue = total - deliveryFee
        const tolaProductCommission = productRevenue * TOLA_COMMISSION_RATE
        const vendorShare = productRevenue - tolaProductCommission
        const transporterShare = deliveryFee * DELIVERY_FEE_TRANSPORTER_SHARE
        const tolaDeliveryCommission = deliveryFee - transporterShare
        const totalTolaCommission = tolaProductCommission + tolaDeliveryCommission

        return {
          id: order.id,
          orderNumber: order.order_number,
          orderStatus: order.status,
          vendorName: order.order_items?.[0]?.products?.shops?.vendors?.business_name || order.order_items?.[0]?.products?.shops?.name || "N/A",
          driverName: (() => {
            const activeAssignment = order.transporter_assignments?.find((a: any) => a.status !== "cancelled")
            return activeAssignment?.transporters?.users?.full_name || activeAssignment?.transporters?.business_name || "Unassigned"
          })(),
          total,
          deliveryFee,
          vendorShare,
          transporterShare,
          tolaCommission: totalTolaCommission,
          createdAt: order.created_at,
        }
      })
      .filter((d) => {
        // Status Filter
        if (statusFilter !== "all" && d.orderStatus !== statusFilter) return false

        // Search Filter
        const searchLower = searchQuery.toLowerCase()
        const orderNumber = (d.orderNumber || "").toLowerCase()
        const vendor = (d.vendorName || "").toLowerCase()
        const driver = (d.driverName || "").toLowerCase()

        return (
          orderNumber.includes(searchLower) ||
          vendor.includes(searchLower) ||
          driver.includes(searchLower)
        )
      })
  }, [paidOrders, searchQuery, statusFilter])

  const totals = useMemo(() => {
    return disbursements.reduce(
      (acc, d) => ({
        vendorShare: acc.vendorShare + d.vendorShare,
        transporterShare: acc.transporterShare + d.transporterShare,
        tolaCommission: acc.tolaCommission + d.tolaCommission,
        total: acc.total + d.total,
      }),
      { vendorShare: 0, transporterShare: 0, tolaCommission: 0, total: 0 }
    )
  }, [disbursements])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Disbursements</h3>
        <p className="text-slate-500 text-sm mt-1">Revenue split breakdown per order — Vendor share, Transporter share, and TOLA commission.</p>
      </div>

      {/* Aggregate Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm rounded-xl border-emerald-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">TZS {totals.total.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{disbursements.length} paid orders</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-blue-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Vendor Share</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Store className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">TZS {totals.vendorShare.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{totals.total > 0 ? ((totals.vendorShare / totals.total) * 100).toFixed(1) : 0}% of total</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-indigo-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Transporter Share</CardTitle>
            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
              <Truck className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">TZS {totals.transporterShare.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{totals.total > 0 ? ((totals.transporterShare / totals.total) * 100).toFixed(1) : 0}% of total</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-purple-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">TOLA Commission</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <PieChart className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">TZS {totals.tolaCommission.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{totals.total > 0 ? ((totals.tolaCommission / totals.total) * 100).toFixed(1) : 0}% of total</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      {paidOrders.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search order #, vendor, driver..."
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
      )}

      {/* Disbursement Table */}
      {paidOrders.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <PieChart className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No disbursement data</h3>
            <p className="text-slate-500 mt-1 text-sm">Revenue splits will appear once orders are paid.</p>
          </CardContent>
        </Card>
      ) : disbursements.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No matches found</h3>
            <p className="text-slate-500 mt-1 text-sm">No disbursements match your search or filter criteria.</p>
            <Button
              variant="link"
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
              className="mt-4 text-primary font-medium"
            >
              Clear all filters
            </Button>
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
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Order</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Vendor</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Driver</th>
                    <th className="text-right py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Total</th>
                    <th className="text-right py-3 px-4 font-bold text-xs uppercase tracking-wider text-blue-500">Vendor Share</th>
                    <th className="text-right py-3 px-4 font-bold text-xs uppercase tracking-wider text-indigo-500">Transporter</th>
                    <th className="text-right py-3 px-4 font-bold text-xs uppercase tracking-wider text-purple-500">TOLA</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {disbursements.map((d, idx) => (
                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-semibold text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">#{d.orderNumber}</span>
                        <Badge variant="outline" className="ml-2 text-[10px] rounded px-1.5 py-0">{d.orderStatus}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Store className="h-3.5 w-3.5 text-blue-500" />
                          <span className="font-medium text-slate-800">{d.vendorName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="font-medium text-slate-800">{d.driverName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">TZS {d.total.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-700">TZS {d.vendorShare.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-700">TZS {d.transporterShare.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-semibold text-purple-700">TZS {d.tolaCommission.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{format(new Date(d.createdAt), "MMM d, yyyy")}</td>
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
