"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, CheckCircle, Package, Truck, MapPin, Store, CheckCircle2, Phone, Home } from "lucide-react"
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
                    <CardTitle className="flex items-center gap-2">
                      Order #{order.order_number}
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 py-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified by TOLA
                      </Badge>
                    </CardTitle>
                    <CardDescription>Placed on {new Date(order.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={statusColors[order.status]}>{order.status}</Badge>
                    <Badge className={paymentStatusColors[order.payment_status]}>{order.payment_status}</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.products.images?.[0] ? (
                        <img
                          src={item.products.images[0]}
                          alt={item.products.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.products.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Store className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {item.products.shops?.vendors?.business_name || item.products.shops?.name || "Verified Merchant"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Quantity: {item.quantity}</span>
                        <span className="font-semibold">TZS {item.total_price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Merchant Details (Unveiled Post-Order) */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Merchant Details</CardTitle>
                <CardDescription>Seller identity revealed for your order</CardDescription>
              </CardHeader>
              <CardContent>
                {order.order_items[0]?.products?.shops ? (
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl bg-background border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {order.order_items[0].products.shops.logo_url ? (
                        <img src={order.order_items[0].products.shops.logo_url} className="object-cover w-full h-full" />
                      ) : (
                        <Store className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg">
                        {order.order_items[0].products.shops.vendors?.business_name || order.order_items[0].products.shops.name}
                      </h4>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{order.order_items[0].products.shops.vendors?.contact_phone || order.order_items[0].products.shops.phone || "No contact info available"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {order.order_items[0].products.shops.address}, {order.order_items[0].products.shops.district}, {order.order_items[0].products.shops.region}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Merchant details unavailable</p>
                )}
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

            {/* Logistics & Delivery */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Logistics Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.transport_methods ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Home className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold">{order.transport_methods.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{order.transport_methods.provider_type || "Third-party Logistics"}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-blue-500/10">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span className="font-medium">TZS {order.delivery_fee?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                    {["shipped", "delivered"].includes(order.status) && (
                      <Badge variant="outline" className="w-full justify-center bg-blue-100 text-blue-700 border-blue-200 py-1">
                        Order Tracking Active
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Standard Delivery (Logistics TBC)
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize font-medium">{order.payment_method}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
