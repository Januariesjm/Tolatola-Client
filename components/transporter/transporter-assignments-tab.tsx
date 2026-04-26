"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Package, CheckCircle, Truck, Phone, MessageSquare, ListTodo } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChatButton } from "@/components/messaging/chat-button"

interface TransporterAssignmentsTabProps {
  assignments: any[]
  transporterId: string
  initialOrderId?: string
}

const TAB_AVAILABLE = "available"
const TAB_ACCEPTED = "accepted"
const TAB_IN_TRANSIT = "in_transit"
const TAB_COMPLETED = "completed"

export function TransporterAssignmentsTab({ assignments, transporterId, initialOrderId }: TransporterAssignmentsTabProps) {
  const router = useRouter()

  const initialAssignment = initialOrderId
    ? assignments.find((a) => a.order_id === initialOrderId || a.id === initialOrderId || a.orders?.order_number === initialOrderId)
    : undefined;

  let initialInnerTab = TAB_AVAILABLE;
  if (initialAssignment) {
    if (initialAssignment.status === "accepted") initialInnerTab = TAB_ACCEPTED;
    else if (["picked_up", "in_transit"].includes(initialAssignment.status)) initialInnerTab = TAB_IN_TRANSIT;
    else if (initialAssignment.status === "delivered") initialInnerTab = TAB_COMPLETED;
    else if (initialAssignment.accepted_at) initialInnerTab = TAB_ACCEPTED;
  }

  const [activeTab, setActiveTab] = useState(initialInnerTab);
  const [updating, setUpdating] = useState<string | null>(null)

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

  const availableTrips = assignments.filter(
    (a) => ["assigned", "ready_for_pickup"].includes(a.status) && !a.accepted_at
  )
  const acceptedTrips = assignments.filter(
    (a) => a.status === "accepted" || (a.status === "assigned" && !!a.accepted_at)
  )
  const inTransitTrips = assignments.filter((a) => ["picked_up", "in_transit"].includes(a.status))
  const completedTrips = assignments.filter((a) => a.status === "delivered")

  const updateStatus = async (assignmentId: string, newStatus: string) => {
    setUpdating(assignmentId)
    try {
      const { clientApiPatch } = await import("@/lib/api-client")
      const updateData: any = { status: newStatus }

      if (newStatus === "picked_up") {
        updateData.picked_up_at = new Date().toISOString()
      } else if (newStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString()
      }

      await clientApiPatch(`assignments/${assignmentId}`, updateData)
      router.refresh()
    } catch (error) {
      console.error("Error updating assignment:", error)
      alert("Failed to update assignment status")
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (assignment: any) => {
    const status = (assignment.status === "assigned" && assignment.accepted_at) ? "accepted" : assignment.status
    const variants: any = {
      assigned: "secondary",
      ready_for_pickup: "secondary",
      accepted: "outline",
      picked_up: "default",
      in_transit: "default",
      delivered: "success",
      cancelled: "destructive",
    }
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const renderList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No trips in this tab</p>
          </CardContent>
        </Card>
      )
    }
    return (
      <div className="space-y-4">
        {list.map((assignment) => {
          const isAccepted = ["accepted", "picked_up", "in_transit", "delivered"].includes(assignment.status) || !!assignment.accepted_at
          const isNotYetAccepted = (["assigned", "ready_for_pickup"].includes(assignment.status)) && !assignment.accepted_at
          const displayStatus = (assignment.status === "assigned" && assignment.accepted_at) ? "accepted" : assignment.status
          
          return (
          <Card 
            key={assignment.id} 
            id={`order-${assignment.order_id}`}
            className={!isAccepted ? "border-primary/20 bg-primary/5" : ""}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Order #{assignment.orders?.order_number}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {assignment.transport_methods?.name} • {assignment.distance_km} km
                  </p>
                </div>
                {getStatusBadge(assignment)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Shop Info */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-sm">
                    Pickup from: {assignment.shops?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {assignment.shops?.district}, {assignment.shops?.region}
                  </p>
                  {isAccepted && assignment.shops?.address && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground border-t pt-1 mt-1">
                        {assignment.shops.address}
                      </p>
                      {assignment.shops.latitude && assignment.shops.longitude && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${assignment.shops.latitude},${assignment.shops.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                        >
                          <MapPin className="h-3 w-3" />
                          View Pickup Location
                        </a>
                      )}
                    </div>
                  )}
                  {isAccepted && assignment.shops?.phone && (
                    <a href={`tel:${assignment.shops.phone}`} className="text-sm text-blue-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {assignment.shops.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-sm">
                    Deliver to: {assignment.orders?.users?.full_name || assignment.orders?.shipping_address?.full_name || "Customer"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {assignment.orders?.shipping_address?.district}, {assignment.orders?.shipping_address?.region}
                  </p>
                  {isAccepted && assignment.orders?.shipping_address && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground border-t pt-1 mt-1">
                        {assignment.orders.shipping_address.street || assignment.orders.shipping_address.address},{" "}
                        {assignment.orders.shipping_address.ward || assignment.orders.shipping_address.village}
                      </p>
                      {assignment.orders.shipping_address.latitude && assignment.orders.shipping_address.longitude && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${assignment.orders.shipping_address.latitude},${assignment.orders.shipping_address.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                        >
                          <MapPin className="h-3 w-3" />
                          View Delivery Location
                        </a>
                      )}
                    </div>
                  )}
                  {isAccepted && assignment.orders?.users?.phone && (
                    <a
                      href={`tel:${assignment.orders.users.phone}`}
                      className="text-sm text-blue-600 flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {assignment.orders.users.phone}
                    </a>
                  )}
                </div>
              </div>

              {!isAccepted && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Exact locations will be revealed after you accept this cargo.
                </div>
              )}

              {/* Delivery Fee */}
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm font-medium">Delivery Fee</span>
                <span className="text-lg font-bold text-green-700">
                  {Number(assignment.delivery_fee).toLocaleString()} TZS
                </span>
              </div>

              {isAccepted && (
                <div className="flex flex-col sm:flex-row gap-3">
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
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => updateStatus(assignment.id, "rejected")}
                    disabled={updating === assignment.id}
                  >
                    Reject Cargo
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => updateStatus(assignment.id, "accepted")}
                    disabled={updating === assignment.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updating === assignment.id ? "Accepting..." : "Accept Cargo"}
                  </Button>
                </div>
              )}

              {/* isAccepted covers ("accepted" status OR "assigned" with accepted_at) */}
              {(displayStatus === "accepted" || displayStatus === "assigned") && isAccepted && (
                <Button
                  className="w-full"
                  onClick={() => updateStatus(assignment.id, "picked_up")}
                  disabled={updating === assignment.id}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {updating === assignment.id ? "Updating..." : "Mark as Picked Up"}
                </Button>
              )}

              {assignment.status === "picked_up" && (
                <Button
                  className="w-full"
                  onClick={() => updateStatus(assignment.id, "in_transit")}
                  disabled={updating === assignment.id}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  {updating === assignment.id ? "Updating..." : "Start Delivery"}
                </Button>
              )}

              {assignment.status === "in_transit" && (
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => updateStatus(assignment.id, "delivered")}
                  disabled={updating === assignment.id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {updating === assignment.id ? "Completing..." : "Complete Delivery"}
                </Button>
              )}

              {assignment.status === "delivered" && assignment.delivered_at && (
                <div className="text-center py-2">
                  <p className="text-sm text-green-600 font-medium">✓ Completed</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(assignment.delivered_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value={TAB_AVAILABLE}>
            <ListTodo className="h-4 w-4 mr-1.5 hidden sm:inline" />
            Available Trips
            {availableTrips.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{availableTrips.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value={TAB_ACCEPTED}>Accepted Trips</TabsTrigger>
          <TabsTrigger value={TAB_IN_TRANSIT}>In Transit</TabsTrigger>
          <TabsTrigger value={TAB_COMPLETED}>Completed</TabsTrigger>
        </TabsList>
        <TabsContent value={TAB_AVAILABLE} className="mt-4">
          {renderList(availableTrips)}
        </TabsContent>
        <TabsContent value={TAB_ACCEPTED} className="mt-4">
          {renderList(acceptedTrips)}
        </TabsContent>
        <TabsContent value={TAB_IN_TRANSIT} className="mt-4">
          {renderList(inTransitTrips)}
        </TabsContent>
        <TabsContent value={TAB_COMPLETED} className="mt-4">
          {renderList(completedTrips)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
