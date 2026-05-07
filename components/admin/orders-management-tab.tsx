"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter, Calendar, MapPin, Phone, Mail, User, Package, Truck, CreditCard, ChevronRight, ShoppingCart } from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

interface OrdersManagementTabProps {
  orders: any[]
}

export function OrdersManagementTab({ orders }: OrdersManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status Filter
      if (statusFilter !== "all" && order.status !== statusFilter) return false

      // Search Filter
      const searchLower = searchQuery.toLowerCase()
      const customerName = (order.users?.full_name || order.shipping_address?.full_name || "").toLowerCase()
      const customerEmail = (order.users?.email || order.shipping_address?.email || "").toLowerCase()
      const customerPhone = (order.users?.phone || order.shipping_address?.phone || "").toLowerCase()
      const orderNumber = (order.order_number || "").toLowerCase()
      const street = (order.shipping_address?.street || "").toLowerCase()
      const ward = (order.shipping_address?.ward || "").toLowerCase()

      return (
        orderNumber.includes(searchLower) ||
        customerName.includes(searchLower) ||
        customerEmail.includes(searchLower) ||
        customerPhone.includes(searchLower) ||
        street.includes(searchLower) ||
        ward.includes(searchLower)
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
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-rose-100 text-rose-700 border-rose-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
  }

  const transporterStatusColors: Record<string, string> = {
    unassigned: "bg-slate-100 text-slate-600 border-slate-200",
    assigned: "bg-sky-100 text-sky-700 border-sky-200",
    at_pickup: "bg-indigo-100 text-indigo-700 border-indigo-200",
    in_transit: "bg-blue-100 text-blue-700 border-blue-200",
    arrived: "bg-teal-100 text-teal-700 border-teal-200",
    delivered: "bg-green-100 text-green-700 border-green-200",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Orders Management</h2>
          <p className="text-slate-500 mt-1">Track and manage all marketplace orders across various stages.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <Input
              placeholder="Search order #, customer, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-primary focus:border-primary shadow-sm"
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
              <DropdownMenuCheckboxItem checked={statusFilter === "all"} onCheckedChange={() => setStatusFilter("all")}>All Status</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === "pending"} onCheckedChange={() => setStatusFilter("pending")}>Pending</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === "confirmed"} onCheckedChange={() => setStatusFilter("confirmed")}>Confirmed</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === "processing"} onCheckedChange={() => setStatusFilter("processing")}>Processing</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === "shipped"} onCheckedChange={() => setStatusFilter("shipped")}>Shipped</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === "delivered"} onCheckedChange={() => setStatusFilter("delivered")}>Delivered</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === "cancelled"} onCheckedChange={() => setStatusFilter("cancelled")}>Cancelled</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-20 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No orders found</h3>
            <p className="text-slate-500 mt-1 max-w-xs mx-auto">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your filters or search term to find what you're looking for." 
                : "There are currently no orders in the system."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <Button 
                variant="link" 
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="mt-4 text-primary font-medium"
              >
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-all border-slate-200 group">
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Order</span>
                        <h3 className="text-xl font-bold text-slate-900">#{order.order_number}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(order.created_at), "PPP 'at' p")}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={`rounded-lg px-3 py-1 font-semibold border-2 ${statusColors[order.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {order.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className={`rounded-lg px-3 py-1 font-semibold border-2 ${paymentStatusColors[order.payment_status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        <CreditCard className="h-3 w-3 mr-1.5" />
                        {order.payment_status}
                      </Badge>
                      {order.transporter_status && (
                        <Badge variant="outline" className={`rounded-lg px-3 py-1 font-semibold border-2 ${transporterStatusColors[order.transporter_status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          <Truck className="h-3 w-3 mr-1.5" />
                          {order.transporter_status.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Customer</p>
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 leading-none">
                            {order.users?.full_name || order.shipping_address?.full_name || "Guest Customer"}
                          </p>
                          <p className="text-sm text-slate-500 truncate max-w-[180px]">
                            {order.users?.email || order.shipping_address?.email || "No email"}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.users?.phone || order.shipping_address?.phone || "No phone"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Shipping To</p>
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <MapPin className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-900">{order.shipping_address?.street || "Street N/A"}</p>
                          <p>{order.shipping_address?.ward}, {order.shipping_address?.district}</p>
                          <p>{order.shipping_address?.region}, {order.shipping_address?.country}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Order Items</p>
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">
                            {order.order_items?.length || 0} Products
                          </p>
                          <p className="text-sm text-slate-500">
                            {order.order_items?.[0]?.products?.name || "N/A"}
                            {(order.order_items?.length || 0) > 1 && ` + ${order.order_items.length - 1} more`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Amount</p>
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-slate-900">
                          TZS {order.total_amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                          via {order.payment_method.replace("-", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 lg:w-16 flex lg:flex-col items-center justify-center p-4 border-t lg:border-t-0 lg:border-l border-slate-200 group-hover:bg-primary/5 transition-colors">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-white transition-all shadow-sm">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
