"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Progress } from "../../../components/ui/progress"
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
import type { OrderTrackingInfo } from "../../../lib/types"
import SiteHeader from "../../../components/layout/site-header"
import { OrderTrackingMap } from "../../../components/orders/order-tracking-map"

const TIMELINE_STEPS: { id: string; label: string }[] = [
  { id: "ORDER_RECEIVED", label: "Order Received" },
  { id: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
  { id: "PROCESSING", label: "Processing" },
  { id: "DISPATCHED", label: "Dispatched" },
  { id: "IN_TRANSIT", label: "In Transit" },
  { id: "DELIVERED", label: "Delivered" },
]

const STATUS_INDEX_MAP: Record<string, number> = {
  ORDER_RECEIVED: 0,
  pending: 0,
  pending_payment: 0,
  PAYMENT_CONFIRMED: 1,
  confirmed: 1,
  paid: 1,
  PROCESSING: 2,
  processing: 2,
  preparing: 2,
  DISPATCHED: 3,
  dispatched: 3,
  ready_for_pickup: 3,
  picked_up: 3,
  IN_TRANSIT: 4,
  in_transit: 4,
  shipped: 4,
  DELIVERED: 5,
  delivered: 5,
  completed: 5,
}

function StatusDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [data, setData] = useState<OrderTrackingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const fetchStatus = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/tracking/status?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      if (!res.ok) {
        throw new Error(res.status === 401 ? "Session expired. Please verify again." : "Failed to load status.")
      }
      const d = await res.json()
      const normalized = d?.data || d
      const order = normalized?.order || normalized
      if (!order) {
        throw new Error("Order status data not found.")
      }
      setData({
        ...normalized,
        order,
      } as any)
    } catch (e: any) {
      if (!silent) setError(e?.message || "Failed to load order status.")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setError("Missing tracking session. Please start from the track order page.")
      setLoading(false)
      return
    }
    
    // Initial fetch
    fetchStatus(false)

    // Polling every 8 seconds to fetch transporter status and request updates in real time
    const interval = setInterval(() => {
      fetchStatus(true)
    }, 8000)

    return () => clearInterval(interval)
  }, [token])

  const handleConfirmDelivery = async () => {
    if (!data?.order?.id) return
    setConfirming(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
      const res = await fetch(`${base.replace(/\/$/, "")}/orders/${data.order.id}/confirm-delivery`, {
        method: "POST",
      })
      if (!res.ok) {
        throw new Error("Failed to confirm delivery. Please try again.")
      }
      alert("Delivery successfully confirmed! Escrow released. 🎉")
      await fetchStatus(true)
    } catch (err: any) {
      alert(err.message || "Failed to confirm delivery.")
    } finally {
      setConfirming(false)
    }
  }

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
  const currentIndex = STATUS_INDEX_MAP[String(order.status)] ?? TIMELINE_STEPS.findIndex((s) => s.id === order.status)
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

        {/* Premium Alternative Confirmation Request Banner */}
        {order.delivery_confirmation_requested && order.status !== "delivered" && order.status !== "completed" && (
          <div className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-blue-500/5 to-primary/5 p-6 rounded-2xl shadow-md flex flex-col items-center gap-4 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl -mr-8 -mt-8" />
            <div className="bg-primary/10 p-3 rounded-full">
              <Truck className="h-6 w-6 text-primary animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground mb-1">
                Have you received your product? 🚚
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Your transporter has requested confirmation to complete the delivery. Please confirm only if you have physically received your items.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm mt-1">
              <Button 
                onClick={handleConfirmDelivery} 
                disabled={confirming} 
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold h-11 rounded-xl"
              >
                {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirm Delivery
              </Button>
              <Button 
                asChild
                variant="destructive"
                className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 gap-2 font-bold h-11 rounded-xl"
              >
                <Link href={`/track/complaint?token=${encodeURIComponent(token!)}&orderId=${order.id}`}>
                  <AlertTriangle className="h-4 w-4" />
                  Report Issue
                </Link>
              </Button>
            </div>
          </div>
        )}

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
