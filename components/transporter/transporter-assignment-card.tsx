"use client"

import { useMemo, type ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Package, CheckCircle, Truck, Phone, Navigation, Home, ShoppingBag } from "lucide-react"
import { ChatButton } from "@/components/messaging/chat-button"
import { getProductPosition, productPositionDescription, productPositionLabel } from "@/lib/maps/navigation"
import type { TransporterAssignment } from "@/lib/types/transporter"

interface TransporterAssignmentCardProps {
  assignment: TransporterAssignment
  updating: string | null
  onUpdateStatus: (assignmentId: string, newStatus: string, isAvailableOrder?: boolean, orderId?: string) => Promise<void>
  onOpenNavigation: (assignment: TransporterAssignment, target: "pickup" | "dropoff" | "auto") => void
  onOpenPinModal: (assignmentId: string) => void
  getStatusBadge: (assignment: TransporterAssignment) => ReactNode
}

export function TransporterAssignmentCard({
  assignment,
  updating,
  onUpdateStatus,
  onOpenNavigation,
  onOpenPinModal,
  getStatusBadge,
}: TransporterAssignmentCardProps) {
  const isAccepted = ["accepted", "picked_up", "in_transit", "delivered"].includes(assignment.status) || !!assignment.accepted_at
  const isNotYetAccepted = ["assigned", "ready_for_pickup", "available"].includes(assignment.status) && !assignment.accepted_at
  const displayStatus = assignment.status === "assigned" && assignment.accepted_at ? "accepted" : assignment.status
  const productPosition = getProductPosition(displayStatus)
  const delivered = displayStatus === "delivered"

  const dropoffAddress = useMemo(() => {
    const addr = assignment.orders?.shipping_address
    if (!addr) return null
    const street = addr.street || addr.address
    const ward = addr.ward || addr.village
    const parts = [street, ward, addr.district, addr.region].filter((p): p is string =>
      Boolean(p && String(p).trim() !== "" && String(p).trim() !== ","),
    )
    return parts.length > 0 ? parts.join(", ") : null
  }, [assignment.orders?.shipping_address])

  const shopAddress = useMemo(() => {
    const s = assignment.shops
    if (!s) return null
    const parts = [s.address, s.district, s.region].filter((p): p is string =>
      Boolean(p && String(p).trim() !== "" && String(p).trim() !== ","),
    )
    return parts.length > 0 ? parts.join(", ") : null
  }, [assignment.shops])

  return (
    <Card
      id={`order-${assignment.order_id}`}
      className={`rounded-2xl transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
        !isAccepted
          ? "border-primary/40 bg-gradient-to-br from-primary/5 via-card to-card ring-1 ring-primary/20"
          : "border-border/80 bg-card"
      }`}
    >
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                Order #{assignment.orders?.order_number || assignment.order_id?.slice(0, 8) || assignment.id.slice(0, 8)}
              </CardTitle>
              {assignment.transport_methods?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/60">
                  {assignment.transport_methods.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-primary" />
              <span>
                {assignment.transport_methods?.name} • {assignment.distance_km} km
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">{getStatusBadge(assignment)}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6 py-4 sm:py-5">
        {/* Visual Route Stepper (Pickup to Drop-off) */}
        <div className="relative pl-6 sm:pl-7 space-y-4 before:absolute before:left-[11px] sm:before:left-[13px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-blue-400 before:to-violet-500">
          {/* Shop / Pickup Node */}
          <div className="relative">
            <span className="absolute -left-6 sm:-left-7 top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-border/70 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Package className="h-3 w-3" /> Pickup Stop
                </span>
                {isAccepted && assignment.shops?.phone && (
                  <a
                    href={`tel:${assignment.shops.phone}`}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {assignment.shops.phone}
                  </a>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Pickup from: {assignment.shops?.name}</p>
                {shopAddress && <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-0.5">{shopAddress}</p>}
              </div>
              {isAccepted && assignment.shops?.latitude && assignment.shops?.longitude && (
                <Button
                  type="button"
                  onClick={() => onOpenNavigation(assignment, "pickup")}
                  className="w-full mt-2 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Navigation className="h-4 w-4" />
                  Navigate to pickup
                </Button>
              )}
            </div>
          </div>

          {/* Customer / Drop-off Node */}
          <div className="relative">
            <span className="absolute -left-6 sm:-left-7 top-1 h-3.5 w-3.5 rounded-full bg-violet-500 ring-4 ring-violet-500/20 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-border/70 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Drop-off Destination
                </span>
                {isAccepted && assignment.orders?.users?.phone && (
                  <a
                    href={`tel:${assignment.orders.users.phone}`}
                    className="text-xs font-semibold text-violet-700 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md hover:bg-violet-500/20 transition-colors flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {assignment.orders.users.phone}
                  </a>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Deliver to: {assignment.orders?.users?.full_name || assignment.orders?.shipping_address?.full_name || "Customer"}
                </p>
                {dropoffAddress ? (
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-0.5">{dropoffAddress}</p>
                ) : assignment.orders?.shipping_address?.latitude ? (
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    GPS: {Number(assignment.orders.shipping_address.latitude).toFixed(4)},{" "}
                    {Number(assignment.orders.shipping_address.longitude).toFixed(4)}
                  </p>
                ) : null}
              </div>
              {isAccepted && assignment.orders?.shipping_address?.latitude && assignment.orders?.shipping_address?.longitude && (
                <Button
                  type="button"
                  onClick={() => onOpenNavigation(assignment, "dropoff")}
                  className="w-full mt-2 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Navigation className="h-4 w-4" />
                  Navigate to drop-off
                </Button>
              )}
            </div>
          </div>
        </div>

        {isAccepted && (
          <div
            className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-2xs ${
              productPosition === "delivered"
                ? "border-emerald-200 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                : productPosition === "with_driver"
                  ? "border-violet-200 bg-violet-500/10 text-violet-950 dark:text-violet-200"
                  : "border-sky-200 bg-sky-500/10 text-sky-950 dark:text-sky-200"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                productPosition === "delivered"
                  ? "bg-emerald-500/20 text-emerald-600"
                  : productPosition === "with_driver"
                    ? "bg-violet-500/20 text-violet-600"
                    : "bg-sky-500/20 text-sky-600"
              }`}
            >
              {productPosition === "delivered" ? (
                <CheckCircle className="h-4 w-4" />
              ) : productPosition === "with_driver" ? (
                <Package className="h-4 w-4" />
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold">Product: {productPositionLabel(productPosition)}</p>
              <p className="text-xs opacity-80 mt-0.5">{productPositionDescription(productPosition)}</p>
            </div>
          </div>
        )}

        {!isAccepted && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5 font-medium">
            <Package className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Exact locations will be revealed after you accept this cargo.</span>
          </div>
        )}

        {/* Delivery Fee Highlight */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Delivery Fee</span>
            <p className="text-[10px] text-muted-foreground">Paid directly to your driver wallet upon delivery</p>
          </div>
          <span className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {Number(assignment.delivery_fee).toLocaleString()} TZS
          </span>
        </div>

        {/* In-app navigation shortcuts */}
        {isAccepted && !delivered && assignment.shops?.latitude && assignment.orders?.shipping_address?.latitude && (
          <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5" />
              <span>GPS Route Navigator</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onOpenNavigation(assignment, "auto")}
                className="w-full text-xs text-center bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Navigation className="h-3.5 w-3.5" />
                {displayStatus === "accepted" ? "Start pickup navigation" : "Start delivery navigation"}
              </button>
              <button
                type="button"
                onClick={() => onOpenNavigation(assignment, "dropoff")}
                className="w-full text-xs text-center border border-border bg-card hover:bg-accent text-foreground py-2.5 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-2xs"
              >
                <Home className="h-3.5 w-3.5" />
                Preview drop-off destination
              </button>
            </div>
          </div>
        )}

        {isAccepted && (
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            {assignment.shops?.vendors?.user_id && (
              <div className="flex-1">
                <ChatButton
                  receiverId={assignment.shops.vendors.user_id}
                  orderId={assignment.order_id}
                  shopName={assignment.shops?.name || "Vendor"}
                  label="Chat with Shop"
                />
              </div>
            )}
            <div className="flex-1">
              <ChatButton
                receiverId={assignment.orders?.customer_id}
                orderId={assignment.order_id}
                shopName={assignment.orders?.users?.full_name || "Customer"}
                label="Chat with Customer"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isNotYetAccepted && (
          <div className="flex gap-2.5 pt-1">
            {!assignment.is_available_order && (
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold"
                onClick={() => onUpdateStatus(assignment.id, "rejected", assignment.is_available_order, assignment.order_id)}
                disabled={updating === assignment.id}
              >
                Reject Cargo
              </Button>
            )}
            <Button
              className="flex-1 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-xs hover:shadow transition-all"
              onClick={() => onUpdateStatus(assignment.id, "accepted", assignment.is_available_order, assignment.order_id)}
              disabled={updating === assignment.id}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {updating === assignment.id ? "Accepting..." : "Accept Cargo"}
            </Button>
          </div>
        )}

        {(displayStatus === "accepted" || displayStatus === "assigned") && isAccepted && (
          <Button
            className="w-full rounded-xl font-bold shadow-xs hover:shadow transition-all"
            onClick={() => onUpdateStatus(assignment.id, "picked_up")}
            disabled={updating === assignment.id}
          >
            <Package className="h-4 w-4 mr-2" />
            {updating === assignment.id ? "Updating..." : "Mark as Picked Up"}
          </Button>
        )}

        {assignment.status === "picked_up" && (
          <Button
            className="w-full rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all"
            onClick={() => onUpdateStatus(assignment.id, "in_transit")}
            disabled={updating === assignment.id}
          >
            <Truck className="h-4 w-4 mr-2" />
            {updating === assignment.id ? "Updating..." : "Start Delivery"}
          </Button>
        )}

        {assignment.status === "in_transit" && (
          <div className="space-y-2 pt-1">
            <Button
              className="w-full h-11 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-xs hover:shadow transition-all"
              onClick={() => onOpenNavigation(assignment, "dropoff")}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navigate to customer
            </Button>
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => onOpenPinModal(assignment.id)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground underline decoration-dotted transition-colors"
              >
                Already at customer? Enter delivery PIN
              </button>
            </div>
          </div>
        )}

        {assignment.status === "delivered" && assignment.delivered_at && (
          <div className="text-center py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">✓ Completed</p>
            <p className="text-xs text-muted-foreground mt-0.5">Delivered on {new Date(assignment.delivered_at).toLocaleDateString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
