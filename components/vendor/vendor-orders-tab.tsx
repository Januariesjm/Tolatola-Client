"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, CheckCircle, ChevronDown, ChevronUp, Calendar, MapPin, DollarSign, Truck, Clock, Wallet, Loader2 } from "lucide-react"
import { clientApiGet, clientApiPatch } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface VendorOrdersTabProps {
  shopId: string
  initialOrderId?: string
}

const TAB_NEW = "new"
const TAB_PREPARING = "preparing"
const TAB_READY = "ready"
const TAB_COMPLETED = "completed"
const TAB_EARNINGS = "earnings"

export function VendorOrdersTab({ shopId, initialOrderId }: VendorOrdersTabProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(TAB_NEW)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [shopId])

  // Handle initial expansion if orderId is provided
  useEffect(() => {
    if (!isLoading && initialOrderId && orders.length > 0) {
      const order = orders.find(o => o.id === initialOrderId)
      if (order) {
        setExpandedOrders(new Set([initialOrderId]))
        // Determine correct tab
        const destTab = statusToTab[order.status] || (["pending", "paid", "confirmed"].includes(order.status) ? TAB_NEW : TAB_NEW)
        setActiveTab(destTab)

        // Scroll into view (optional but helpful)
        setTimeout(() => {
          document.getElementById(`order-${initialOrderId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 500)
      }
    }
  }, [isLoading, initialOrderId, orders])

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

  const statusToTab: Record<string, string> = {
    processing: TAB_PREPARING,
    ready_for_pickup: TAB_READY,
    shipped: TAB_COMPLETED,
    delivered: TAB_COMPLETED,
    confirmed: TAB_NEW,
  }

  const statusLabels: Record<string, string> = {
    confirmed: "Order Confirmed",
    processing: "Preparing",
    ready_for_pickup: "Ready for Pickup",
    shipped: "Shipped",
    delivered: "Delivered",
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    try {
      await clientApiPatch(`vendors/orders/${orderId}/status`, { status: newStatus })
      toast({
        title: "Order Updated ✓",
        description: `Order moved to "${statusLabels[newStatus] || newStatus}"`,
      })
      await fetchOrders()
      // Auto-switch to the destination tab
      const destTab = statusToTab[newStatus]
      if (destTab) setActiveTab(destTab)
    } catch (err) {
      console.error("Failed to update order", err)
      toast({
        title: "Update Failed",
        description: "Could not update the order status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrderId(null)
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
    return (order.items || []).reduce((sum: number, item: any) => {
      const line = Number(item.total_price ?? ((item.unit_price ?? item.price ?? 0) * (item.quantity ?? 0)))
      return sum + line + Number(item.delivery_fee || 0)
    }, 0)
  }

  const newOrders = orders.filter((o) => ["pending", "pending_payment", "confirmed", "paid", "payment_received"].includes(o.status))
  const preparingOrders = orders.filter((o) => ["processing", "preparing"].includes(o.status))
  const readyOrders = orders.filter((o) => o.status === "ready_for_pickup")
  const completedOrders = orders.filter((o) => ["dispatched", "in_transit", "delivered", "shipped", "completed"].includes(o.status))
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (getOrderTotal(o) || 0), 0)

  const renderOrderList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No orders in this tab</p>
          </CardContent>
        </Card>
      )
    }
    return (
      <div className="space-y-3">
        {list.map((order) => renderOrderCard(order))}
      </div>
    )
  }

  const renderOrderCard = (order: any) => {
    const isExpanded = expandedOrders.has(order.id)
    const orderTotal = getOrderTotal(order)
    return (
      <Card key={order.id} id={`order-${order.id}`} className="overflow-hidden transition-all hover:shadow-md">
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
                    {order.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold">TZS {orderTotal.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{order.items.length} items</div>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="px-4 pb-4 pt-0 space-y-4 animate-in slide-in-from-top-2 border-t mt-2">
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
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Items ({order.items.length})
              </h4>
              <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="font-medium">{item.products?.name} × {item.quantity}</span>
                    <div className="text-right">
                      <p className="font-semibold">TZS {(item.unit_price * item.quantity).toLocaleString()}</p>
                      {item.delivery_fee > 0 && (
                        <p className="text-[10px] text-green-600 font-bold">+ Delivery: TZS {item.delivery_fee.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2 flex justify-between items-center font-bold">
                  <span className="text-xs uppercase tracking-wide">Total</span>
                  <span className="text-base text-primary">TZS {orderTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {order.shipping_address && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                    <p className="font-medium">{order.shipping_address.full_name}</p>
                    <p className="text-muted-foreground">{order.shipping_address.phone}</p>
                    <p className="text-muted-foreground">{order.shipping_address.address || order.shipping_address.street}</p>
                    <p className="text-muted-foreground">
                      {order.shipping_address.city || order.shipping_address.ward}, {order.shipping_address.region}
                    </p>
                  </div>
                </div>
                {order.transporter_assignment && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Logistics
                    </h4>
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-primary">
                            {order.transporter_assignment.transporters?.business_name ||
                              order.transporter_assignment.transporters?.users?.full_name ||
                              "Assigned Transporter"}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {order.transporter_assignment.transporters?.vehicle_type} • {order.transporter_assignment.transporters?.license_plate || "—"}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {order.transporter_assignment.status === "assigned" && !order.transporter_assignment.accepted_at
                            ? "Searching..."
                            : (order.transporter_assignment.accepted_at ? "Accepted" : order.transporter_assignment.status?.replace("_", " "))}
                        </Badge>
                      </div>
                      {order.transporter_assignment.transporters?.users?.phone && (
                        <div className="flex items-center gap-2 text-xs pt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{order.transporter_assignment.transporters.users.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 flex-wrap pt-2">
              {order.status === "pending" && (
                <Button size="sm" onClick={() => updateOrderStatus(order.id, "confirmed")} disabled={updatingOrderId === order.id} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700">
                  {updatingOrderId === order.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Confirm Order
                </Button>
              )}
              {order.status === "confirmed" && (
                <Button size="sm" onClick={() => updateOrderStatus(order.id, "processing")} disabled={updatingOrderId === order.id} className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 font-bold">
                  {updatingOrderId === order.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Package className="h-4 w-4 mr-2" />}
                  Start Processing
                </Button>
              )}
              {(order.status === "processing" || order.status === "preparing") && (
                <Button size="sm" onClick={() => updateOrderStatus(order.id, "ready_for_pickup")} disabled={updatingOrderId === order.id} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 font-bold">
                  {updatingOrderId === order.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Truck className="h-4 w-4 mr-2" />}
                  Mark Ready for Pickup
                </Button>
              )}
              {order.status === "ready_for_pickup" && (
                <div className="flex-1 sm:flex-none">
                  <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50 py-1 px-3">
                    <Clock className="h-4 w-4 mr-2 animate-pulse" />
                    {order.transporter_assignment?.accepted_at
                      ? "Transporter Accepted: Waiting for Pickup"
                      : order.transporter_assignment
                        ? "Transporter Assigned: Waiting for Acceptance"
                        : "Searching for Transporter..."}
                  </Badge>
                </div>
              )}
              {(order.status === "shipped" || order.status === "delivered") && (
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:flex lg:flex-wrap">
          <TabsTrigger value={TAB_NEW}>
            New Orders
            {newOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{newOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value={TAB_PREPARING}>Preparing</TabsTrigger>
          <TabsTrigger value={TAB_READY}>Ready for Pickup</TabsTrigger>
          <TabsTrigger value={TAB_COMPLETED}>Completed</TabsTrigger>
          <TabsTrigger value={TAB_EARNINGS}>
            <Wallet className="h-4 w-4 mr-1 hidden sm:inline" />
            Earnings
          </TabsTrigger>
        </TabsList>
        <TabsContent value={TAB_NEW} className="mt-4">
          {renderOrderList(newOrders)}
        </TabsContent>
        <TabsContent value={TAB_PREPARING} className="mt-4">
          {renderOrderList(preparingOrders)}
        </TabsContent>
        <TabsContent value={TAB_READY} className="mt-4">
          {renderOrderList(readyOrders)}
        </TabsContent>
        <TabsContent value={TAB_COMPLETED} className="mt-4">
          {renderOrderList(completedOrders)}
        </TabsContent>
        <TabsContent value={TAB_EARNINGS} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Earnings summary
              </CardTitle>
              <CardDescription>From completed orders (delivered)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-primary">TZS {totalEarnings.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-1">{completedOrders.length} orders completed</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
