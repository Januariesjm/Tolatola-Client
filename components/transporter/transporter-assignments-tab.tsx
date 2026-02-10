"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Package, CheckCircle, Truck, Phone, MessageSquare } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChatButton } from "@/components/messaging/chat-button"

interface TransporterAssignmentsTabProps {
  assignments: any[]
  transporterId: string
}

export function TransporterAssignmentsTab({ assignments, transporterId }: TransporterAssignmentsTabProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

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

  const getStatusBadge = (status: string) => {
    const variants: any = {
      assigned: "secondary",
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

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No delivery assignments yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const isAccepted = ["accepted", "picked_up", "in_transit", "delivered"].includes(assignment.status)

        return (
          <Card key={assignment.id} className={!isAccepted ? "border-primary/20 bg-primary/5" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Order #{assignment.orders?.order_number}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {assignment.transport_methods?.name} • {assignment.distance_km} km
                  </p>
                </div>
                {getStatusBadge(assignment.status)}
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
                    Deliver to: {assignment.orders?.users?.full_name}
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
                <ChatButton
                  receiverId={assignment.orders?.customer_id}
                  orderId={assignment.order_id}
                  shopName={assignment.orders?.users?.full_name || "Customer"}
                />
              )}

              {/* Action Buttons */}
              {assignment.status === "assigned" && (
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => updateStatus(assignment.id, "accepted")}
                  disabled={updating === assignment.id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {updating === assignment.id ? "Accepting..." : "Accept Cargo"}
                </Button>
              )}

              {assignment.status === "accepted" && (
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
