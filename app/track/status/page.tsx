"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Package,
  CheckCircle2,
  Circle,
  Truck,
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import type { OrderTrackingInfo, OrderStatus } from "@/lib/types"
import SiteHeader from "@/components/layout/site-header"
import { OrderTrackingMap } from "@/components/orders/order-tracking-map"

const TIMELINE_STEPS: { id: OrderStatus; label: string }[] = [
  { id: "ORDER_RECEIVED", label: "Order Received" },
  { id: "PAYMENT_SECURED", label: "Payment Secured" },
  { id: "VENDOR_PREPARING", label: "Vendor Preparing" },
  { id: "PICKED_UP", label: "Picked Up" },
  { id: "IN_TRANSIT", label: "In Transit" },
  { id: "DELIVERED", label: "Delivered" },
]

function StatusDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [data, setData] = useState<OrderTrackingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError("Missing tracking session. Please start from the track order page.")
      setLoading(false)
      return
    }
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
    fetch(`${base.replace(/\/$/, "")}/tracking/status?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Session expired. Please verify again." : "Failed to load status.")
        return r.json()
      })
      .then((d) => setData(d.data || d))
      .catch((e) => setError(e?.message || "Failed to load order status."))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading order status…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader user={null} profile={null} kycStatus={null} />
        <main className="container max-w-lg mx-auto px-4 py-12">
          <Card className="border-2 border-destructive/20">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">{error || "Order not found."}</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/track">Track another order</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const order = data.order
  const timeline = data.timeline || []
  const currentIndex = TIMELINE_STEPS.findIndex((s) => s.id === order.status)
  const progressPercent = currentIndex >= 0 ? ((currentIndex + 1) / TIMELINE_STEPS.length) * 100 : 0

  return (
    <div className="min-h-screen bg-background pb-24">
      <SiteHeader user={null} profile={null} kycStatus={null} />
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to home
          </Link>
        </div>

        <Card className="border-2 shadow-xl rounded-2xl overflow-hidden mb-6">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">Order {order.order_number}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono mt-1">{order.tracking_code}</p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {order.status?.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Timeline progress */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Order timeline
              </h3>
              <Progress value={progressPercent} className="h-2 rounded-full" />
              <ul className="space-y-3">
                {TIMELINE_STEPS.map((step, idx) => {
                  const done = currentIndex > idx || (currentIndex === idx && order.status === "DELIVERED")
                  const current = currentIndex === idx && order.status !== "DELIVERED"
                  return (
                    <li key={step.id} className="flex items-center gap-3">
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : current ? (
                        <Circle className="h-5 w-5 text-primary border-2 border-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span
                        className={
                          done
                            ? "font-medium text-foreground"
                            : current
                              ? "font-semibold text-primary"
                              : "text-muted-foreground"
                        }
                      >
                        {step.label}
                      </span>
                      {timeline.find((t: any) => t.status === step.id)?.completed_at && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(timeline.find((t: any) => t.status === step.id).completed_at).toLocaleString()}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Delivery details */}
            {data.transporter && (
              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Delivery details
                </h3>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{data.transporter.name}</span>
                </div>
                {data.transporter.phone_masked && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono text-sm">{data.transporter.phone_masked}</span>
                  </div>
                )}
                {order.estimated_arrival && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">
                      Estimated arrival: {new Date(order.estimated_arrival).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Optional map - if we have coordinates from API we could pass them */}
            {order.shipping_address && (order.shipping_address as any).latitude && (
              <OrderTrackingMap
                origin={{ lat: 0, lng: 0 }}
                destination={{
                  lat: (order.shipping_address as any).latitude,
                  lng: (order.shipping_address as any).longitude,
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button asChild variant="outline" className="rounded-xl h-12">
            <Link href="/contact" className="flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </Link>
          </Button>
          <Button asChild className="rounded-xl h-12" variant="secondary">
            <Link
              href={`/track/complaint?token=${encodeURIComponent(token!)}&orderId=${order.id}`}
              className="flex items-center justify-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Raise Complaint
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function TrackStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <StatusDashboardInner />
    </Suspense>
  )
}
