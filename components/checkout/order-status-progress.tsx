"use client"

/**
 * Order status stepper for the checkout success page: a horizontal summary
 * plus a detailed vertical timeline, both driven by the same status map.
 *
 * Extracted verbatim from components/checkout/checkout-success-content.tsx.
 */

import { CheckCircle2, Home, MapPin, Package, ShieldCheck, Truck } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS_DETAILS = [
  { id: "ORDER_RECEIVED", label: "Order Received", icon: CheckCircle2 },
  { id: "PAYMENT_CONFIRMED", label: "Payment Confirmed", icon: ShieldCheck },
  { id: "PROCESSING", label: "Processing Order", icon: Package },
  { id: "DISPATCHED", label: "Dispatched & Picked Up", icon: MapPin },
  { id: "IN_TRANSIT", label: "In Transit to You", icon: Truck },
  { id: "DELIVERED", label: "Delivered", icon: Home },
]

const FULL_STATUS_MAP: Record<string, number> = {
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

export function OrderStatusProgress({ status }: { status: string }) {
  const currentIndex = FULL_STATUS_MAP[status] ?? 0
  const isCompleted = status === "DELIVERED" || status === "delivered" || status === "completed"

  return (
    <div className="space-y-8">
      {/* Horizontal Visual Summary - hidden on mobile */}
      <div className="relative hidden sm:flex justify-between w-full max-w-md mx-auto py-8">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-stone-100 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-1000"
          style={{ width: `${Math.min((currentIndex / (STEPS_DETAILS.length - 1)) * 100, 100)}%` }}
        />
        {STEPS_DETAILS.filter((_, idx) => idx % 2 === 0 || idx === STEPS_DETAILS.length - 1).map((step) => {
          const originalIdx = STEPS_DETAILS.findIndex((s) => s.id === step.id)
          const Icon = step.icon
          const isActive = originalIdx <= currentIndex
          const isCurrent = originalIdx === currentIndex
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                  isActive ? "bg-primary border-primary text-white" : "bg-white border-stone-100 text-stone-300",
                  isCurrent && isActive && "animate-pulse ring-4 ring-primary/20",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider text-center max-w-[80px]",
                  isActive ? "text-primary" : "text-stone-400",
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Detailed Vertical Tracking List */}
      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
        <h4 className="text-sm font-black text-stone-900 border-b border-stone-200 pb-3 mb-4">Detailed Tracking Events</h4>
        <div className="space-y-5">
          {STEPS_DETAILS.map((step, idx) => {
            const isDone = currentIndex > idx || (currentIndex === idx && isCompleted)
            const isCurrent = currentIndex === idx && !isDone
            const Icon = step.icon
            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center border-2 border-white ring-2 ring-transparent shadow-sm flex-shrink-0 z-10",
                      isDone ? "bg-green-500" : isCurrent ? "bg-primary animate-pulse" : "bg-stone-200",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4 text-white" /> : <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  {idx !== STEPS_DETAILS.length - 1 && (
                    <div className={cn("w-0.5 h-full min-h-[20px] -my-1", isDone ? "bg-green-500" : "bg-stone-200")} />
                  )}
                </div>
                <div className="pt-0.5 pb-2">
                  <p className={cn("text-sm font-bold", isDone ? "text-stone-900" : isCurrent ? "text-primary" : "text-stone-400")}>
                    {step.label}
                  </p>
                  {isCurrent && <p className="text-xs text-stone-500 mt-1">Currently in progress...</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
