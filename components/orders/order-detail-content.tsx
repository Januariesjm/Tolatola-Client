"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Package, Truck, MapPin, Store, CheckCircle2, Phone, Home, CreditCard, Calendar, ChevronLeft, ArrowRight, Wallet } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface OrderDetailContentProps {
  order: any
}

export function OrderDetailContent({ order }: OrderDetailContentProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/15 text-yellow-600 border-yellow-200"
      case "confirmed":
        return "bg-blue-500/15 text-blue-600 border-blue-200"
      case "processing":
        return "bg-purple-500/15 text-purple-600 border-purple-200"
      case "shipped":
        return "bg-indigo-500/15 text-indigo-600 border-indigo-200"
      case "delivered":
        return "bg-green-500/15 text-green-600 border-green-200"
      case "cancelled":
        return "bg-red-500/15 text-red-600 border-red-200"
      case "refunded":
        return "bg-gray-500/15 text-gray-600 border-gray-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-500/15 text-green-600 border-green-200"
      case "pending":
        return "bg-yellow-500/15 text-yellow-600 border-yellow-200"
      case "failed":
        return "bg-red-500/15 text-red-600 border-red-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
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
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-4 py-8">

        {/* Breadcrumb / Back Navigation */}
        <div className="mb-6">
          <Link href="/orders" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
        </div>

        {/* Success Banner */}
        {order.status === "pending" && (
          <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-6 flex items-start gap-4 shadow-sm">
            <div className="flex-shrink-0 bg-green-100 p-2 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-900 mb-1">
                Order Placed Successfully!
              </h2>
              <p className="text-green-700 text-sm">
                Your order has been received and is being processed. You will receive updates via email.
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header Card */}
            <Card className="border-border/60 overflow-hidden">
              <CardHeader className="bg-white border-b pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 font-normal">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Placed on {new Date(order.created_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("px-3 py-1 text-sm font-medium capitalize", getStatusColor(order.status))}>
                      {order.status}
                    </Badge>
                    <Badge className={cn("px-3 py-1 text-sm font-medium capitalize", getPaymentStatusColor(order.payment_status))}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="relative">
                    {/* Timeline with vertical line */}
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200" />

                    <div className="space-y-8 relative">
                      {/* Placed */}
                      <div className="flex gap-6">
                        <div className="relative z-10 flex-shrink-0">
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100",
                            "bg-green-500 text-white"
                          )}>
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <h3 className="font-semibold text-gray-900">Order Placed</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Processing */}
                      <div className="flex gap-6">
                        <div className="relative z-10 flex-shrink-0">
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100",
                            ["processing", "shipped", "delivered"].includes(order.status) ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                          )}>
                            <Package className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <h3 className={cn("font-semibold", ["processing", "shipped", "delivered"].includes(order.status) ? "text-gray-900" : "text-gray-500")}>
                            Processing
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {["processing", "shipped", "delivered"].includes(order.status)
                              ? "Your order is being prepared."
                              : "We are waiting for vendor confirmation."}
                          </p>
                        </div>
                      </div>

                      {/* Shipped */}
                      <div className="flex gap-6">
                        <div className="relative z-10 flex-shrink-0">
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100",
                            ["shipped", "delivered"].includes(order.status) ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                          )}>
                            <Truck className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <h3 className={cn("font-semibold", ["shipped", "delivered"].includes(order.status) ? "text-gray-900" : "text-gray-500")}>
                            Out for Delivery
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {["shipped", "delivered"].includes(order.status)
                              ? "Your order is executed and handled by logistics."
                              : "Order is not yet shipped."}
                          </p>
                        </div>
                      </div>

                      {/* Delivered */}
                      <div className="flex gap-6">
                        <div className="relative z-10 flex-shrink-0">
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100",
                            order.status === "delivered" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                          )}>
                            <Home className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <h3 className={cn("font-semibold", order.status === "delivered" ? "text-gray-900" : "text-gray-500")}>
                            Delivered
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {order.status === "delivered" ? "Package has been delivered." : "Estimated soon."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="border-border/60">
              <CardHeader className="border-b bg-gray-50/30">
                <CardTitle className="text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {order.order_items.map((item: any) => {
                  const imageUrl = item.products?.images?.[0] || item.products?.primary_image_url || "/placeholder-product.png";
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-6">
                      <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={item.products.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/100x100?text=${encodeURIComponent(item.products?.name?.substring(0, 2) || 'PR')}`
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{item.products.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <Store className="h-3.5 w-3.5" />
                              <span>
                                {item.products.shops?.vendors?.business_name || item.products.shops?.name || "Verified Merchant"}
                              </span>
                            </div>
                          </div>
                          <p className="font-bold text-lg whitespace-nowrap">TZS {item.total_price.toLocaleString()}</p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
                          <div className="text-sm">
                            <span className="text-muted-foreground mr-2">Quantity:</span>
                            <span className="font-medium">{item.quantity}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground mr-2">Unit Price:</span>
                            <span>TZS {item.products.price?.toLocaleString() || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Merchant Details */}
            <Card className="border-indigo-100 bg-indigo-50/30 dark:bg-indigo-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5 text-indigo-600" />
                  Merchant Information
                </CardTitle>
                <CardDescription>Contact details for the seller</CardDescription>
              </CardHeader>
              <CardContent>
                {order.order_items[0]?.products?.shops ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                    <div className="h-16 w-16 rounded-full bg-indigo-50 border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {order.order_items[0].products.shops.logo_url ? (
                        <img src={order.order_items[0].products.shops.logo_url} className="object-cover w-full h-full" alt="Shop Logo" />
                      ) : (
                        <Store className="h-8 w-8 text-indigo-400" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-lg text-gray-900">
                        {order.order_items[0].products.shops.vendors?.business_name || order.order_items[0].products.shops.name}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{order.order_items[0].products.shops.vendors?.users?.phone || order.order_items[0].products.shops.phone || "No phone"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                          <span>
                            {order.order_items[0].products.shops.address}, {order.order_items[0].products.shops.district}, {order.order_items[0].products.shops.region}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto flex gap-2">
                      Contact Seller
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Merchant details unavailable</p>
                )}
              </CardContent>
            </Card>

            {/* Confirm Delivery Action */}
            {order.status === "shipped" && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-blue-900">Confirm Delivery</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Have you received this order properly? Confirming releases the payment to the vendor.
                      </p>
                    </div>
                    <Button onClick={handleConfirmDelivery} disabled={isConfirming} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]">
                      {isConfirming ? "Procesing..." : "Confirm Receipt"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>TZS {order.subtotal?.toLocaleString() || order.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>TZS {order.delivery_fee?.toLocaleString() || "0"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax / VAT</span>
                    <span>TZS 0</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">TZS {order.total_amount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-bold text-gray-900">{order.shipping_address.full_name}</p>
                    <p className="text-muted-foreground">{order.shipping_address.address}</p>
                    <p className="text-muted-foreground">
                      {order.shipping_address.city}, {order.shipping_address.region}
                    </p>
                    <p className="text-muted-foreground mt-2 flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {order.shipping_address.phone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logistics */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-4 w-4" />
                  Logistics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {order.transport_methods ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <Home className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{order.transport_methods.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{order.transport_methods.provider_type || "Logistics"}</p>
                      </div>
                    </div>
                    {["shipped", "delivered"].includes(order.status) ? (
                      <Button variant="outline" className="w-full text-xs h-8">
                        Track Shipment
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded text-center">Tracking available after shipping</p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    To be assigned
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className=" text-lg">Payment</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 border flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <span className="block font-medium capitalization text-sm">{order.payment_method || "Online Payment"}</span>
                    <span className="text-xs text-muted-foreground">{order.payment_status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
