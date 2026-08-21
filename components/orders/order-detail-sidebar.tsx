"use client"

/**
 * The order detail page's right-hand column: summary, delivery address,
 * transport and payment.
 *
 * Extracted verbatim from components/orders/order-detail-content.tsx, which was
 * 676 lines with this inlined. Read-only -- every value comes from the `order`
 * prop, so there is no state here and nothing to fetch.
 */

import Link from "next/link"
import { Home, MapPin, Package, Phone, Truck, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { OrderTrackingMap } from "@/components/orders/order-tracking-map"
import type { Order } from "@/lib/schemas/order"

export function OrderDetailSidebar({ order }: { order: Order }) {
  return (
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
              <p className="font-bold text-gray-900">{order.shipping_address?.full_name}</p>
              <p className="text-muted-foreground">{order.shipping_address?.address}</p>
              <p className="text-muted-foreground">
                {order.shipping_address?.city}, {order.shipping_address?.region}
              </p>
              <p className="text-muted-foreground mt-2 flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                {order.shipping_address?.phone}
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
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic flex items-center gap-2">
              <Package className="h-4 w-4" />
              To be assigned
            </div>
          )}

          {/* Tracking Map */}
          {["shipped", "delivered"].includes(order.status ?? "") && order.transporter_assignments?.[0] && (
            <div className="mt-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Live Tracking
              </h4>
              <OrderTrackingMap
                origin={{
                  lat: order.order_items?.[0]?.products?.shops?.latitude || -6.7924,
                  lng: order.order_items?.[0]?.products?.shops?.longitude || 39.2083,
                  address: order.order_items?.[0]?.products?.shops?.address ?? undefined,
                }}
                destination={{
                  lat: order.shipping_address?.latitude || -6.7924, // Fallback if not available
                  lng: order.shipping_address?.longitude || 39.2083,
                  address: order.shipping_address?.address ?? undefined,
                }}
                transporterLocation={order.transporter_assignments?.[0]?.transporters?.current_location ?? undefined}
                className="w-full"
              />
              {order.transporter_assignments?.[0]?.transporters?.users && (
                <div className="mt-3 flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-blue-900">{order.transporter_assignments[0].transporters.users.full_name}</p>
                      <p className="text-xs text-blue-700">Your Transporter</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 gap-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100" asChild>
                    <Link href={`tel:${order.transporter_assignments[0].transporters.users.phone}`}>
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call</span>
                    </Link>
                  </Button>
                </div>
              )}
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
  )
}
