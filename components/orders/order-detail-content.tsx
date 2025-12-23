"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, CheckCircle, Package, Truck, MapPin } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface OrderDetailContentProps {
  order: any
}

export function OrderDetailContent({ order }: OrderDetailContentProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const router = useRouter()

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    processing: "bg-purple-500",
    shipped: "bg-indigo-500",
    delivered: "bg-green-500",
    cancelled: "bg-red-500",
    refunded: "bg-gray-500",
  }

  const paymentStatusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    paid: "bg-green-500",
    failed: "bg-red-500",
    refunded: "bg-gray-500",
  }

  const handleConfirmDelivery = async () => {
    setIsConfirming(true)
    try {
      const response = await fetch("/api/orders/confirm-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error confirming delivery:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">TZ Marketplace</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/orders">
              <Button variant="ghost">My Orders</Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {order.status === "pending" && (
          <Card className="mb-8 border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
                    Order Placed Successfully!
                  </h2>
                  <p className="text-green-700 dark:text-green-300">
                    Your order has been received and is being processed. You will receive updates via email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order #{order.order_number}</CardTitle>
                    <CardDescription>Placed on {new Date(order.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={statusColors[order.status]}>{order.status}</Badge>
                    <Badge className={paymentStatusColors[order.payment_status]}>{order.payment_status}</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={`/.jpg?height=80&width=80&query=${encodeURIComponent(item.products.name)}`}
                        alt={item.products.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.products.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        by {item.products.shops?.vendors?.business_name || "Unknown"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Quantity: {item.quantity}</span>
                        <span className="font-semibold">TZS {item.total_price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status !== "pending" ? "bg-green-500" : "bg-green-500"}`}
                      >
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${["confirmed", "processing", "shipped", "delivered"].includes(order.status) ? "bg-green-500" : "bg-muted"}`}
                      >
                        <CheckCircle
                          className={`h-5 w-5 ${["confirmed", "processing", "shipped", "delivered"].includes(order.status) ? "text-white" : "text-muted-foreground"}`}
                        />
                      </div>
                    </div>
                    <div>
                      <p
                        className={`font-medium ${["confirmed", "processing", "shipped", "delivered"].includes(order.status) ? "" : "text-muted-foreground"}`}
                      >
                        Confirmed
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {["confirmed", "processing", "shipped", "delivered"].includes(order.status)
                          ? "Order confirmed by vendor"
                          : "Waiting for vendor confirmation"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${["processing", "shipped", "delivered"].includes(order.status) ? "bg-green-500" : "bg-muted"}`}
                      >
                        <Package
                          className={`h-5 w-5 ${["processing", "shipped", "delivered"].includes(order.status) ? "text-white" : "text-muted-foreground"}`}
                        />
                      </div>
                    </div>
                    <div>
                      <p
                        className={`font-medium ${["processing", "shipped", "delivered"].includes(order.status) ? "" : "text-muted-foreground"}`}
                      >
                        Processing
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {["processing", "shipped", "delivered"].includes(order.status)
                          ? "Order is being prepared"
                          : "Order will be processed soon"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${["shipped", "delivered"].includes(order.status) ? "bg-green-500" : "bg-muted"}`}
                      >
                        <Truck
                          className={`h-5 w-5 ${["shipped", "delivered"].includes(order.status) ? "text-white" : "text-muted-foreground"}`}
                        />
                      </div>
                    </div>
                    <div>
                      <p
                        className={`font-medium ${["shipped", "delivered"].includes(order.status) ? "" : "text-muted-foreground"}`}
                      >
                        Shipped
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {["shipped", "delivered"].includes(order.status)
                          ? "Order is on the way"
                          : "Order will be shipped soon"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === "delivered" ? "bg-green-500" : "bg-muted"}`}
                      >
                        <CheckCircle
                          className={`h-5 w-5 ${order.status === "delivered" ? "text-white" : "text-muted-foreground"}`}
                        />
                      </div>
                    </div>
                    <div>
                      <p className={`font-medium ${order.status === "delivered" ? "" : "text-muted-foreground"}`}>
                        Delivered
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.status === "delivered" ? "Order delivered successfully" : "Awaiting delivery"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Confirm Delivery Button */}
            {order.status === "shipped" && (
              <Card className="border-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium mb-1">Have you received your order?</p>
                      <p className="text-sm text-muted-foreground">Confirm delivery to release payment to the vendor</p>
                    </div>
                    <Button onClick={handleConfirmDelivery} disabled={isConfirming}>
                      {isConfirming ? "Confirming..." : "Confirm Delivery"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>TZS {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>TZS {order.total_amount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shipping_address.full_name}</p>
                  <p className="text-muted-foreground">{order.shipping_address.phone}</p>
                  <p className="text-muted-foreground">{order.shipping_address.address}</p>
                  <p className="text-muted-foreground">
                    {order.shipping_address.city}, {order.shipping_address.region}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className="capitalize">{order.payment_method}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
