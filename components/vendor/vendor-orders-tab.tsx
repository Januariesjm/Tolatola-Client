"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, CheckCircle } from "lucide-react"
import { clientApiGet, clientApiPatch } from "@/lib/api-client"

interface VendorOrdersTabProps {
  shopId: string
}

export function VendorOrdersTab({ shopId }: VendorOrdersTabProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    confirmed: "bg-blue-500",
    processing: "bg-purple-500",
    shipped: "bg-indigo-500",
    delivered: "bg-green-500",
    cancelled: "bg-red-500",
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
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No orders yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                    <CardDescription>
                      Customer: {order.users?.full_name || order.users?.email || "Unknown"}
                    </CardDescription>
                  </div>
                  <Badge className={statusColors[order.status]}>{order.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.products.name} x {item.quantity}
                        </span>
                        <span className="font-medium">TZS {item.total_price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-1">Shipping Address:</p>
                    <p className="text-sm text-muted-foreground">
                      {order.shipping_address.full_name}, {order.shipping_address.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.region}
                    </p>
                  </div>

                  {/* Order Actions */}
                  <div className="border-t pt-3 flex gap-2">
                    {order.status === "pending" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "confirmed")}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Order
                      </Button>
                    )}
                    {order.status === "confirmed" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "processing")}>
                        Start Processing
                      </Button>
                    )}
                    {order.status === "processing" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "shipped")}>
                        Mark as Shipped
                      </Button>
                    )}
                    {order.status === "shipped" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "delivered")}>
                        Mark as Delivered
                      </Button>
                    )}
                    {order.status === "delivered" && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
