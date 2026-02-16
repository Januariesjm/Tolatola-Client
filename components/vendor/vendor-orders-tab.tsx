"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, CheckCircle, ChevronDown, ChevronUp, Calendar, MapPin, DollarSign, Truck, Clock } from "lucide-react"
import { clientApiGet, clientApiPatch } from "@/lib/api-client"

interface VendorOrdersTabProps {
  shopId: string
}

export function VendorOrdersTab({ shopId }: VendorOrdersTabProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrders()
  }, [shopId])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const res = await clientApiGet<{ orders: any[] }>(`shops/${shopId}/orders`)
      setOrders(res.orders || [])
    } catch (err) {
      console.error("Failed to load orders", err)
    }
    setIsLoading(false)
  }

  const toggleOrderDetails = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await clientApiPatch(`vendors/orders/${orderId}/status`, { status: newStatus })
      fetchOrders()
    } catch (err) {
      console.error("Failed to update order", err)
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    pending_payment: "bg-orange-500",
    confirmed: "bg-blue-500",
    processing: "bg-purple-500",
    ready_for_pickup: "bg-green-600",
    shipped: "bg-indigo-500",
    delivered: "bg-green-500",
    cancelled: "bg-red-500",
  }

  const getCustomerName = (order: any) => {
    return order.users?.full_name ||
      order.users?.email ||
      order.shipping_address?.full_name ||
      order.shipping_address?.phone ||
      "Unknown"
  }

  const getOrderTotal = (order: any) => {
    return order.items.reduce((sum: number, item: any) =>
      sum + item.total_price + (item.delivery_fee || 0), 0
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading orders...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Orders</h2>
        <Badge variant="secondary">{orders.length} Total</Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No orders yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedOrders.has(order.id)
            const orderTotal = getOrderTotal(order)

            return (
              <Card key={order.id} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleOrderDetails(order.id)}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">{order.order_number}</span>
                          <Badge className={statusColors[order.status]} variant="secondary">
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold">
                          TZS {orderTotal.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.length} items
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="px-4 pb-4 pt-0 space-y-4 animate-in slide-in-from-top-2 border-t mt-2">
                    {/* Customer Details */}
                    <div className="pt-4 grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Customer</h4>
                        <p className="font-medium text-sm">{getCustomerName(order)}</p>
                      </div>
                      <div className="space-y-1 sm:text-right">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Amount</h4>
                        <p className="font-bold text-lg text-primary">TZS {orderTotal.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Order Items ({order.items.length})
                      </h4>
                      <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="font-medium">
                              {item.products.name} × {item.quantity}
                            </span>
                            <div className="text-right">
                              <p className="font-semibold">
                                TZS {(item.unit_price * item.quantity).toLocaleString()}
                              </p>
                              {item.delivery_fee > 0 && (
                                <p className="text-[10px] text-green-600 font-bold">
                                  + Delivery: TZS {item.delivery_fee.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-border pt-2 mt-2 flex justify-between items-center font-bold">
                          <span className="text-xs uppercase tracking-wide">Total</span>
                          <span className="text-base text-primary">
                            TZS {orderTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                        <p className="font-medium">
                          {order.shipping_address.full_name}
                        </p>
                        <p className="text-muted-foreground">
                          {order.shipping_address.phone}
                        </p>
                        <p className="text-muted-foreground">
                          {order.shipping_address.address}
                        </p>
                        <p className="text-muted-foreground">
                          {order.shipping_address.city}, {order.shipping_address.region}
                        </p>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex gap-2 flex-wrap pt-2">
                      {order.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "confirmed")}
                          className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Order
                        </Button>
                      )}
                      {order.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "processing")}
                          className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Start Processing
                        </Button>
                      )}
                      {order.status === "processing" && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "ready_for_pickup")}
                          className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Assign Transporter
                        </Button>
                      )}
                      {order.status === "ready_for_pickup" && (
                        <div className="flex-1 sm:flex-none">
                          <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50 py-1 px-3">
                            <Clock className="h-4 w-4 mr-2 animate-pulse" />
                            Waiting for Transporter
                          </Badge>
                        </div>
                      )}
                      {order.status === "shipped" && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "delivered")}
                          className="flex-1 sm:flex-none"
                        >
                          Mark as Delivered
                        </Button>
                      )}
                      {order.status === "delivered" && (
                        <Badge className="bg-green-500 py-1 px-3">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
