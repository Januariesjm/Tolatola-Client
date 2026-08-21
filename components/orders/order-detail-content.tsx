"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, CheckCircle2, ChevronLeft, Home, MapPin, Package, Phone, Store, Truck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChatButton } from "@/components/messaging/chat-button"
import { OrderTrackingMap } from "@/components/orders/order-tracking-map"
import { getPaymentStatusColor, getStatusColor } from "@/lib/orders/status-colors"
import { DeliveryConfirmationBanner, OrderPlacedBanner, VerifyReceiptBanner } from "@/components/orders/order-status-banners"
import { OrderDetailSidebar } from "@/components/orders/order-detail-sidebar"
import { useConfirmDelivery } from "@/hooks/use-confirm-delivery"
import type { Order, OrderItem } from "@/lib/schemas/order"

interface OrderDetailContentProps {
  order: Order
}

export function OrderDetailContent({ order }: OrderDetailContentProps) {
  const { isConfirming, confirmError, confirmDelivery } = useConfirmDelivery(order.id)

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
        </div>

        {/* Success Banner */}
        <OrderPlacedBanner order={order} />

        {/* Premium Alternative Confirmation Request Banner */}
        <DeliveryConfirmationBanner order={order} isConfirming={isConfirming} confirmError={confirmError} onConfirm={confirmDelivery} />

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
                      Placed on {new Date(order.created_at).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("px-3 py-1 text-sm font-medium capitalize", getStatusColor(order.status))}>{order.status}</Badge>
                    <Badge className={cn("px-3 py-1 text-sm font-medium capitalize", getPaymentStatusColor(order.payment_status))}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Delivery PIN Alert */}
                {["dispatched", "shipped", "in_transit"].includes(order.status?.toLowerCase() ?? "") && order.delivery_pin && (
                  <div className="bg-primary/10 border-y border-primary/20 p-4">
                    <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-full">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">Your Delivery PIN</p>
                          <p className="text-xs text-muted-foreground">Share this with your transporter upon delivery</p>
                        </div>
                      </div>
                      <div className="bg-white border-2 border-primary/30 px-6 py-2 rounded-xl shadow-sm">
                        <span className="text-2xl font-black tracking-[0.2em] text-primary">{order.delivery_pin}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="relative">
                    {/* Timeline with vertical line */}
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200" />

                    <div className="space-y-8 relative">
                      {/* Placed */}
                      <div className="flex gap-6">
                        <div className="relative z-10 flex-shrink-0">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100",
                              "bg-green-500 text-white",
                            )}
                          >
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
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100",
                              [
                                "processing",
                                "preparing",
                                "ready_for_pickup",
                                "dispatched",
                                "shipped",
                                "in_transit",
                                "delivered",
                                "completed",
                              ].includes(order.status ?? "")
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-400",
                            )}
                          >
                            <Package className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <h3
                            className={cn(
                              "font-semibold",
                              [
                                "processing",
                                "preparing",
                                "ready_for_pickup",
                                "dispatched",
                                "shipped",
                                "in_transit",
                                "delivered",
                                "completed",
                              ].includes(order.status ?? "")
                                ? "text-gray-900"
                                : "text-gray-500",
                            )}
                          >
                            Processing
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {[
                              "processing",
                              "preparing",
                              "ready_for_pickup",
                              "dispatched",
                              "shipped",
                              "in_transit",
                              "delivered",
                              "completed",
                            ].includes(order.status ?? "")
                              ? "Your order is being prepared."
                              : "We are waiting for vendor confirmation."}
                          </p>
                        </div>
                      </div>

                      {/* Shipped */}
                      <div className="flex gap-6">
                        <div className="relative z-10 flex-shrink-0">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100",
                              ["dispatched", "shipped", "in_transit", "delivered", "completed"].includes(order.status ?? "")
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-400",
                            )}
                          >
                            <Truck className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <h3
                            className={cn(
                              "font-semibold",
                              ["dispatched", "shipped", "in_transit", "delivered", "completed"].includes(order.status ?? "")
                                ? "text-gray-900"
                                : "text-gray-500",
                            )}
                          >
                            Out for Delivery
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {["dispatched", "shipped", "in_transit", "delivered", "completed"].includes(order.status ?? "")
                              ? "Your order is on the way to you."
                              : "Order is not yet shipped."}
                          </p>
                        </div>
                      </div>

                      {/* Delivered */}
                      <div className="flex gap-6">
                        <div className="relative z-10 flex-shrink-0">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100",
                              ["delivered", "completed"].includes(order.status ?? "")
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-400",
                            )}
                          >
                            <Home className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <h3
                            className={cn(
                              "font-semibold",
                              ["delivered", "completed"].includes(order.status ?? "") ? "text-gray-900" : "text-gray-500",
                            )}
                          >
                            Delivered
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {["delivered", "completed"].includes(order.status ?? "") ? "Package has been delivered." : "Estimated soon."}
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
                {order.order_items?.map((item: OrderItem) => {
                  const imageUrl = item.products?.images?.[0] || item.products?.primary_image_url || "/placeholder-product.png"
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-6">
                      <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={item.products?.name ?? undefined}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              `https://placehold.co/100x100?text=${encodeURIComponent(item.products?.name?.substring(0, 2) || "PR")}`
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{item.products?.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <Store className="h-3.5 w-3.5" />
                              <span>
                                {item.products?.shops?.vendors?.business_name || item.products?.shops?.name || "Verified Merchant"}
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
                            <span>TZS {item.products?.price?.toLocaleString() || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Merchant / Service Provider Details */}
            {(() => {
              const isServiceOrder = order.order_items?.some(
                (item: OrderItem) =>
                  item.products?.categories?.slug === "services" ||
                  item.products?.categories?.name?.toLowerCase() === "services" ||
                  item.products?.category_name?.toLowerCase() === "services",
              )
              const shop = order.order_items?.[0]?.products?.shops
              const vendorPhone = shop?.vendors?.users?.phone || shop?.phone

              return (
                <Card
                  className={cn(
                    "border-indigo-100 shadow-sm",
                    isServiceOrder
                      ? "bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-indigo-50/40 border-emerald-200 ring-2 ring-emerald-500/20"
                      : "bg-indigo-50/30 dark:bg-indigo-950/10",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Store className="h-5 w-5 text-indigo-600" />
                        {isServiceOrder ? "🛠️ Service Provider Contact Details" : "Merchant Information"}
                      </CardTitle>
                      {isServiceOrder && (
                        <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider px-3 py-1">
                          Service Unlocked
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {isServiceOrder
                        ? "Use these contact details to schedule, coordinate, or receive your purchased service."
                        : "Contact details for the seller"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {shop ? (
                      <div className="space-y-4">
                        {isServiceOrder && (
                          <div className="p-3.5 bg-emerald-100/60 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span>Service Purchased! Contact your service provider below to coordinate your service.</span>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                          <div className="h-16 w-16 rounded-full bg-indigo-50 border flex items-center justify-center overflow-hidden flex-shrink-0">
                            {shop.logo_url ? (
                              <img src={shop.logo_url} className="object-cover w-full h-full" alt="Shop Logo" />
                            ) : (
                              <Store className="h-8 w-8 text-indigo-400" />
                            )}
                          </div>
                          <div className="space-y-1 flex-1">
                            <h4 className="font-bold text-lg text-gray-900">{shop.vendors?.business_name || shop.name}</h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                              {vendorPhone && (
                                <a href={`tel:${vendorPhone}`} className="flex items-center gap-1.5 font-bold text-primary hover:underline">
                                  <Phone className="h-3.5 w-3.5 text-primary" />
                                  <span>{vendorPhone}</span>
                                </a>
                              )}
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                                <span>
                                  {shop.address}, {shop.district}, {shop.region}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            {vendorPhone && (
                              <a
                                href={`tel:${vendorPhone}`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex-1 sm:flex-initial"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                Call Provider
                              </a>
                            )}
                            <ChatButton
                              shopId={shop.id ?? undefined}
                              shopName={shop.vendors?.business_name || shop.name || undefined}
                              productId={order.order_items?.[0]?.product_id ?? undefined}
                              productName={order.order_items?.[0]?.products?.name ?? undefined}
                              receiverId={shop.vendors?.user_id ?? undefined}
                              orderId={order.id}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Merchant details unavailable</p>
                    )}
                  </CardContent>
                </Card>
              )
            })()}

            {/* Confirm Delivery Action */}
            <VerifyReceiptBanner order={order} isConfirming={isConfirming} onConfirm={confirmDelivery} />
          </div>

          {/* Sidebar */}
          <OrderDetailSidebar order={order} />
        </div>
      </div>
    </div>
  )
}
