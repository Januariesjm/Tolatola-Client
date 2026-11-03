"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Truck, ListTodo } from "lucide-react"
import { useState, useEffect, type ComponentProps } from "react"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"
import type { TransporterAssignment } from "@/lib/types/transporter"
import { TransporterAssignmentCard } from "./transporter-assignment-card"

const log = logger.child("transporter.transporter-assignments-tab")

interface TransporterAssignmentsTabProps {
  assignments: TransporterAssignment[]
  transporterId: string
  initialOrderId?: string
}

const TAB_AVAILABLE = "available"
const TAB_ACCEPTED = "accepted"
const TAB_IN_TRANSIT = "in_transit"
const TAB_COMPLETED = "completed"

export function TransporterAssignmentsTab({ assignments, initialOrderId }: TransporterAssignmentsTabProps) {
  const router = useRouter()

  const initialAssignment = initialOrderId
    ? assignments.find((a) => a.order_id === initialOrderId || a.id === initialOrderId || a.orders?.order_number === initialOrderId)
    : undefined

  let initialInnerTab = TAB_AVAILABLE
  if (initialAssignment) {
    if (initialAssignment.status === "accepted") initialInnerTab = TAB_ACCEPTED
    else if (["picked_up", "in_transit"].includes(initialAssignment.status)) initialInnerTab = TAB_IN_TRANSIT
    else if (initialAssignment.status === "delivered") initialInnerTab = TAB_COMPLETED
    else if (initialAssignment.accepted_at) initialInnerTab = TAB_ACCEPTED
  }

  const [activeTab, setActiveTab] = useState(initialInnerTab)
  const [updating, setUpdating] = useState<string | null>(null)

  // Delivery PIN State
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [deliveryPin, setDeliveryPin] = useState("")

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
    (a) => a.is_available_order || (["assigned", "ready_for_pickup"].includes(a.status) && !a.accepted_at),
  )
  const acceptedTrips = assignments.filter(
    (a) => !a.is_available_order && (a.status === "accepted" || (a.status === "assigned" && !!a.accepted_at)),
  )
  const inTransitTrips = assignments.filter((a) => !a.is_available_order && ["picked_up", "in_transit"].includes(a.status))
  const completedTrips = assignments.filter((a) => !a.is_available_order && a.status === "delivered")

  const updateStatus = async (assignmentId: string, newStatus: string, isAvailableOrder?: boolean, orderId?: string) => {
    setUpdating(assignmentId)
    try {
      const { clientApiPatch, clientApiPost } = await import("@/lib/api-client")

      // If accepting an order from the general available pool
      if (isAvailableOrder && newStatus === "accepted" && orderId) {
        await clientApiPost(`assignments/accept/${orderId}`)
      } else {
        // Standard assignment update
        const updateData: { status: string; picked_up_at?: string; delivered_at?: string } = { status: newStatus }

        if (newStatus === "picked_up") {
          updateData.picked_up_at = new Date().toISOString()
        } else if (newStatus === "delivered") {
          updateData.delivered_at = new Date().toISOString()
        }

        await clientApiPatch(`assignments/${assignmentId}`, updateData)
      }

      router.refresh()
    } catch (error) {
      log.error("error updating assignment", error)
      alert("Failed to update assignment status")
    } finally {
      setUpdating(null)
    }
  }

  /**
   * Opens the in-app navigator. `auto` follows the trip status (pickup first,
   * then drop-off); the explicit targets are used by the per-stop links.
   */
  const openNavigation = (assignment: TransporterAssignment, target: "pickup" | "dropoff" | "auto") => {
    router.push(`/transporter/navigate?assignmentId=${encodeURIComponent(assignment.id)}&target=${target}`)
  }

  const verifyDeliveryPin = async () => {
    if (!selectedAssignmentId || !deliveryPin || deliveryPin.trim().length !== 4) {
      alert("Please enter a valid 4-digit Delivery PIN.")
      return
    }

    setUpdating(selectedAssignmentId)
    try {
      const { clientApiPost } = await import("@/lib/api-client")
      await clientApiPost(`assignments/${selectedAssignmentId}/verify-pin`, { pin: deliveryPin })

      setPinModalOpen(false)
      setSelectedAssignmentId(null)
      setDeliveryPin("")
      router.refresh()
    } catch (error) {
      log.error("error verifying PIN", error)
      alert("Failed to verify Delivery PIN. Please check and try again.")
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (assignment: TransporterAssignment) => {
    const status = assignment.status === "assigned" && assignment.accepted_at ? "accepted" : assignment.status
    const variants: Record<string, string> = {
      assigned: "secondary",
      ready_for_pickup: "secondary",
      available: "secondary",
      accepted: "outline",
      picked_up: "default",
      in_transit: "default",
      delivered: "success",
      cancelled: "destructive",
    }
    return (
      <Badge variant={(variants[status] || "secondary") as ComponentProps<typeof Badge>["variant"]} className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const renderList = (list: TransporterAssignment[]) => {
    if (list.length === 0) {
      return (
        <Card className="rounded-2xl border-dashed border-border/80">
          <CardContent className="py-16 text-center space-y-3">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground shadow-xs">
              <Truck className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">No trips in this tab</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                When new trips are assigned to you or made available in your service area, they will appear right here.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }
    return (
      <div className="space-y-4">
        {list.map((assignment) => (
          <TransporterAssignmentCard
            key={assignment.id}
            assignment={assignment}
            updating={updating}
            onUpdateStatus={updateStatus}
            onOpenNavigation={openNavigation}
            onOpenPinModal={(id) => {
              setSelectedAssignmentId(id)
              setDeliveryPin("")
              setPinModalOpen(true)
            }}
            getStatusBadge={getStatusBadge}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto -mx-1 px-1 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full grid-cols-none">
            <TabsTrigger value={TAB_AVAILABLE} className="text-xs sm:text-sm px-2 sm:px-3 gap-1">
              <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Available Trips</span>
              <span className="sm:hidden">Available</span>
              {availableTrips.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] sm:text-xs">
                  {availableTrips.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value={TAB_ACCEPTED} className="text-xs sm:text-sm px-2 sm:px-3 gap-1">
              <span className="hidden sm:inline">Accepted Trips</span>
              <span className="sm:hidden">Accepted</span>
              {acceptedTrips.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] sm:text-xs">
                  {acceptedTrips.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value={TAB_IN_TRANSIT} className="text-xs sm:text-sm px-2 sm:px-3 gap-1">
              <span className="hidden sm:inline">In Transit</span>
              <span className="sm:hidden">Transit</span>
              {inTransitTrips.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] sm:text-xs">
                  {inTransitTrips.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value={TAB_COMPLETED} className="text-xs sm:text-sm px-2 sm:px-3 gap-1">
              Completed
              {completedTrips.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] sm:text-xs">
                  {completedTrips.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
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

      <Dialog
        open={pinModalOpen}
        onOpenChange={(open) => {
          setPinModalOpen(open)
          if (!open) setDeliveryPin("")
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Delivery 📦</DialogTitle>
            <DialogDescription>
              Please enter the 4-digit Delivery PIN sent to the customer's phone to complete this delivery and release your escrow funds.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input
              type="text"
              maxLength={4}
              placeholder="e.g. 1234"
              value={deliveryPin}
              onChange={(e) => setDeliveryPin(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest font-bold"
            />
            <Button onClick={verifyDeliveryPin} disabled={updating === selectedAssignmentId || deliveryPin.length !== 4} className="w-full">
              {updating === selectedAssignmentId ? "Verifying..." : "Verify & Complete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
