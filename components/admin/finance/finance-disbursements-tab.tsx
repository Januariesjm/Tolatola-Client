"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Store,
  Truck,
  DollarSign,
  PieChart,
  TrendingUp,
} from "lucide-react"
import { format } from "date-fns"

interface FinanceDisbursementsTabProps {
  orders: any[]
}

// Revenue split constants
const TOLA_COMMISSION_RATE = 0.10
const DELIVERY_FEE_TRANSPORTER_SHARE = 0.85

export function FinanceDisbursementsTab({ orders }: FinanceDisbursementsTabProps) {
  // Only show disbursement data for orders that have been paid
  const paidOrders = useMemo(() => {
    return orders.filter((o) => o.payment_status === "paid")
  }, [orders])

  const disbursements = useMemo(() => {
    return paidOrders.map((order) => {
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
  }, [paidOrders])

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

      {/* Disbursement Table */}
      {disbursements.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <PieChart className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No disbursement data</h3>
            <p className="text-slate-500 mt-1 text-sm">Revenue splits will appear once orders are paid.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
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
                  {disbursements.map((d) => (
                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
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
