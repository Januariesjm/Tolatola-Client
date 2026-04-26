"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Package, CheckCircle, Truck, Phone, ListTodo, ShoppingBag, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface TransporterAssignmentsTabProps {
  assignments: any[]
  availableOrders?: any[]
  transporterId: string
  initialOrderId?: string
}

const TAB_AVAILABLE = "available"
const TAB_ACCEPTED = "accepted"
const TAB_IN_TRANSIT = "in_transit"
const TAB_COMPLETED = "completed"

export function TransporterAssignmentsTab({ assignments, availableOrders = [], transporterId, initialOrderId }: TransporterAssignmentsTabProps) {
  const router = useRouter()

  const initialAssignment = initialOrderId
    ? assignments.find((a) => a.order_id === initialOrderId || a.id === initialOrderId || a.orders?.order_number === initialOrderId)
    : undefined

  let initialInnerTab = TAB_AVAILABLE
  if (initialAssignment) {
    if (["picked_up", "in_transit"].includes(initialAssignment.status)) initialInnerTab = TAB_IN_TRANSIT
    else if (["delivered", "completed"].includes(initialAssignment.status)) initialInnerTab = TAB_COMPLETED
    else if (initialAssignment.accepted_at) initialInnerTab = TAB_ACCEPTED
  }

  const [activeTab, setActiveTab] = useState(initialInnerTab)
  const [updating, setUpdating] = useState<string | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  useEffect(() => {
    if (initialOrderId) {
      setTimeout(() => {
        const element = document.getElementById(`order-${initialOrderId}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
          element.classList.add("ring-2", "ring-primary", "ring-offset-4", "transition-all", "duration-1000")
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "ring-offset-4")
          }, 3000)
        }
      }, 500)
    }
  }, [initialOrderId])

  // Split existing assignments into tabs
  const acceptedTrips = assignments.filter(
    (a) => a.status === "accepted" || (a.status === "assigned" && !!a.accepted_at)
  )
  const inTransitTrips = assignments.filter((a) => ["picked_up", "in_transit"].includes(a.status))
  const completedTrips = assignments.filter((a) => ["delivered", "completed"].includes(a.status))

  /** Accept an open order — creates the assignment on the backend */
  const handleAccept = async (orderId: string) => {
    setAccepting(orderId)
    setAcceptError(null)
    try {
      const { clientApiPost } = await import("@/lib/api-client")
      await clientApiPost(`available-trips/${orderId}/accept`, {})
      router.refresh()
      setActiveTab(TAB_ACCEPTED)
    } catch (err: any) {
      let msg = "Failed to accept trip. It may have already been claimed."
      try {
        const raw = err?.message || ""
        const jsonPart = raw.substring(raw.indexOf("{"))
        if (jsonPart) {
          const parsed = JSON.parse(jsonPart)
          if (parsed.error) msg = parsed.error
        }
      } catch { /* keep default msg */ }
      setAcceptError(msg)
    } finally {
      setAccepting(null)
    }
  }

  /** Update an existing assignment's status */
  const updateStatus = async (assignmentId: string, newStatus: string) => {
    setUpdating(assignmentId)
    try {
      const { clientApiPatch } = await import("@/lib/api-client")
      const updateData: any = { status: newStatus }
      if (newStatus === "picked_up") updateData.picked_up_at = new Date().toISOString()
      else if (newStatus === "delivered") updateData.delivered_at = new Date().toISOString()
      await clientApiPatch(`assignments/${assignmentId}`, updateData)
      router.refresh()
    } catch (error) {
      console.error("Error updating assignment:", error)
      alert("Failed to update assignment status")
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      assigned: "secondary",
      accepted: "outline",
      picked_up: "default",
      in_transit: "default",
      delivered: "success",
      completed: "success",
      cancelled: "destructive",
    }
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status.replace(/_/g, " ")}
      </Badge>
    )
  }

  /** Render a card for an available open order */
  const renderAvailableOrder = (order: any) => {
    const firstItem = order.order_items?.[0]
    const shop = firstItem?.products?.shops
    const totalItems = order.order_items?.length || 0
    const deliveryFee = order.order_items?.reduce((s: number, i: any) => s + (i.delivery_fee || 0), 0) || 0
    const distance = order.order_items?.reduce((s: number, i: any) => s + (i.delivery_distance_km || 0), 0) || 0

    return (
      <Card
        key={order.id}
        id={`order-${order.id}`}
        className="border-primary/20 bg-primary/5 rounded-2xl overflow-hidden"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base font-bold">Order #{order.order_number}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.transport_methods?.name} • {distance.toFixed(1)} km
              </p>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
              Available
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Pickup Info */}
          {shop && (
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <p className="font-medium text-sm">Pickup: {shop.name}</p>
                <p className="text-xs text-muted-foreground">{shop.district}, {shop.region}</p>
              </div>
            </div>
          )}

          {/* Delivery Info */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-0.5">
              <p className="font-medium text-sm">
                Deliver to: {order.shipping_address?.full_name || "Customer"}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.shipping_address?.district}, {order.shipping_address?.region}
              </p>
            </div>
          </div>

          {/* Earnings */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <div>
              <p className="text-xs text-muted-foreground">Your Earnings</p>
              <p className="text-lg font-bold text-green-700">TZS {deliveryFee.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="font-bold">{totalItems}</p>
            </div>
          </div>

          {/* Accept button */}
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => handleAccept(order.id)}
            disabled={accepting === order.id}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {accepting === order.id ? "Claiming Trip..." : "Accept This Trip"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  /** Render a card for an accepted/in-transit assignment */
  const renderAssignmentCard = (assignment: any) => {
    const isAccepted = assignment.status === "accepted" ||
      (assignment.status === "assigned" && assignment.accepted_at) ||
      ["picked_up", "in_transit", "delivered", "completed"].includes(assignment.status)
    const displayStatus = (assignment.status === "assigned" && assignment.accepted_at) ? "accepted" : assignment.status

    return (
      <Card key={assignment.id} id={`order-${assignment.order_id}`} className="rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base font-bold">
                Order #{assignment.orders?.order_number}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {assignment.transport_methods?.name} • {assignment.distance_km} km
              </p>
            </div>
            {getStatusBadge(displayStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Pickup */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-0.5">
              <p className="font-medium text-sm">Pickup: {assignment.shops?.name || "Shop"}</p>
              <p className="text-xs text-muted-foreground">{assignment.shops?.district}, {assignment.shops?.region}</p>
              {isAccepted && assignment.shops?.address && (
                <p className="text-xs text-muted-foreground border-t pt-1 mt-1">{assignment.shops.address}</p>
              )}
              {isAccepted && assignment.shops?.phone && (
                <a href={`tel:${assignment.shops.phone}`} className="text-xs text-blue-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" />{assignment.shops.phone}
                </a>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-0.5">
              <p className="font-medium text-sm">
                Deliver to: {assignment.orders?.users?.full_name || assignment.orders?.shipping_address?.full_name || "Customer"}
              </p>
              <p className="text-xs text-muted-foreground">
                {assignment.orders?.shipping_address?.district}, {assignment.orders?.shipping_address?.region}
              </p>
              {isAccepted && assignment.orders?.shipping_address && (
                <p className="text-xs text-muted-foreground border-t pt-1 mt-1">
                  {assignment.orders.shipping_address.street || assignment.orders.shipping_address.address},{" "}
                  {assignment.orders.shipping_address.ward || assignment.orders.shipping_address.village}
                </p>
              )}
              {isAccepted && (assignment.orders?.users?.phone || assignment.orders?.shipping_address?.phone) && (
                <a
                  href={`tel:${assignment.orders.users?.phone || assignment.orders.shipping_address?.phone}`}
                  className="text-xs text-blue-600 flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  {assignment.orders.users?.phone || assignment.orders.shipping_address?.phone}
                </a>
              )}
            </div>
          </div>

          {/* Earnings */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <div>
              <p className="text-xs text-muted-foreground">Earnings</p>
              <p className="text-lg font-bold text-green-700">TZS {(assignment.delivery_fee || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {(displayStatus === "accepted" || (displayStatus === "assigned" && isAccepted)) && (
            <Button className="w-full" onClick={() => updateStatus(assignment.id, "picked_up")} disabled={updating === assignment.id}>
              <Package className="h-4 w-4 mr-2" />
              {updating === assignment.id ? "Updating..." : "Mark as Picked Up"}
            </Button>
          )}

          {assignment.status === "picked_up" && (
            <Button className="w-full" onClick={() => updateStatus(assignment.id, "in_transit")} disabled={updating === assignment.id}>
              <Truck className="h-4 w-4 mr-2" />
              {updating === assignment.id ? "Updating..." : "Start Delivery (In Transit)"}
            </Button>
          )}

          {assignment.status === "in_transit" && (
            <Button className="w-full" variant="default" onClick={() => updateStatus(assignment.id, "delivered")} disabled={updating === assignment.id}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {updating === assignment.id ? "Completing..." : "Complete Delivery"}
            </Button>
          )}

          {["delivered", "completed"].includes(assignment.status) && assignment.delivered_at && (
            <div className="text-center py-2">
              <p className="text-sm text-green-600 font-medium">✓ Delivery Complete</p>
              <p className="text-xs text-muted-foreground">{new Date(assignment.delivered_at).toLocaleDateString()}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderEmpty = (message: string) => (
    <Card>
      <CardContent className="py-12 text-center">
        <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      {acceptError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {acceptError}
          <button className="ml-auto text-xs underline" onClick={() => setAcceptError(null)}>Dismiss</button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value={TAB_AVAILABLE}>
            <ListTodo className="h-4 w-4 mr-1.5 hidden sm:inline" />
            Available
            {availableOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs bg-amber-100 text-amber-800">
                {availableOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value={TAB_ACCEPTED}>
            Accepted
            {acceptedTrips.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{acceptedTrips.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value={TAB_IN_TRANSIT}>In Transit</TabsTrigger>
          <TabsTrigger value={TAB_COMPLETED}>Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={TAB_AVAILABLE} className="mt-4">
          {availableOrders.length === 0
            ? renderEmpty("No available trips right now. You'll be notified when new orders are ready.")
            : <div className="space-y-4">{availableOrders.map(renderAvailableOrder)}</div>}
        </TabsContent>

        <TabsContent value={TAB_ACCEPTED} className="mt-4">
          {acceptedTrips.length === 0
            ? renderEmpty("No accepted trips yet.")
            : <div className="space-y-4">{acceptedTrips.map(renderAssignmentCard)}</div>}
        </TabsContent>

        <TabsContent value={TAB_IN_TRANSIT} className="mt-4">
          {inTransitTrips.length === 0
            ? renderEmpty("No trips currently in transit.")
            : <div className="space-y-4">{inTransitTrips.map(renderAssignmentCard)}</div>}
        </TabsContent>

        <TabsContent value={TAB_COMPLETED} className="mt-4">
          {completedTrips.length === 0
            ? renderEmpty("No completed deliveries yet.")
            : <div className="space-y-4">{completedTrips.map(renderAssignmentCard)}</div>}
        </TabsContent>
      </Tabs>
    </div>
  )
}
