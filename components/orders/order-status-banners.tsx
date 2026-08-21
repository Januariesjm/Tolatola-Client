"use client"

/**
 * The three banners across the top and bottom of the order detail page.
 *
 * Extracted verbatim from components/orders/order-detail-content.tsx, which had
 * grown to 676 lines with these interleaved into the page layout. Each renders
 * for exactly one order state, and the two that act share the parent's
 * confirm-delivery handler rather than each owning a copy of it.
 *
 * These are presentational: the state and the request live in
 * hooks/use-confirm-delivery.ts.
 */

import Link from "next/link"
import { AlertTriangle, CheckCircle, CheckCircle2, Loader2, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Order } from "@/lib/schemas/order"

/** What a banner needs from the confirm-delivery hook. */
export interface ConfirmDeliveryState {
  isConfirming: boolean
  confirmError: string | null
  onConfirm: () => void
}

/**
 * Shown while the order is still `pending`: it confirms the order was placed,
 * not that anything has shipped.
 */
export function OrderPlacedBanner({ order }: { order: Order }) {
  if (order.status !== "pending") return null

  return (
    <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-6 flex items-start gap-4 shadow-sm">
      <div className="flex-shrink-0 bg-green-100 p-2 rounded-full">
        <CheckCircle className="h-6 w-6 text-green-600" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-green-900 mb-1">Order Placed Successfully!</h2>
        <p className="text-green-700 text-sm">Your order has been received and is being processed. You will receive updates via email.</p>
      </div>
    </div>
  )
}

/**
 * Shown when the transporter has asked the buyer to confirm receipt, and only
 * while the order is not already closed -- confirming finalises payments and
 * closes escrow, so it must not be offered twice.
 */
export function DeliveryConfirmationBanner({ order, isConfirming, confirmError, onConfirm }: { order: Order } & ConfirmDeliveryState) {
  if (!order.delivery_confirmation_requested || order.status === "delivered" || order.status === "completed") return null

  return (
    <div className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-blue-500/5 to-primary/5 p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl -mr-8 -mt-8" />
      <div className="flex items-start gap-4 flex-1">
        <div className="bg-primary/15 p-3 rounded-full flex-shrink-0">
          <Truck className="h-6 w-6 text-primary animate-bounce" />
        </div>
        <div className="text-left">
          <h2 className="text-lg font-extrabold text-foreground mb-1">Have you received your product? 🚚</h2>
          <p className="text-muted-foreground text-sm max-w-xl">
            Your transporter has requested confirmation to complete the delivery. Please confirm only if you have physically received your
            items. This will finalize payments and close escrows.
          </p>
          {confirmError && (
            <p role="alert" className="mt-2 text-sm font-medium text-destructive">
              {confirmError}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto flex-shrink-0">
        <Button
          onClick={onConfirm}
          disabled={isConfirming}
          className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold px-6 h-11 rounded-xl"
        >
          {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Confirm Delivery
        </Button>
        <Button
          asChild
          variant="destructive"
          className="flex-1 md:flex-none bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 gap-2 font-bold px-6 h-11 rounded-xl"
        >
          <Link href={`/track/complaint?orderId=${order.id}`}>
            <AlertTriangle className="h-4 w-4" />
            Report Issue
          </Link>
        </Button>
      </div>
    </div>
  )
}

/**
 * The `delivered` counterpart, shown lower down beside the order items: the
 * same action, offered once the transporter has marked the order delivered.
 */
export function VerifyReceiptBanner({ order, isConfirming, onConfirm }: { order: Order } & Omit<ConfirmDeliveryState, "confirmError">) {
  if (order.status !== "delivered") return null

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-blue-900">Verify Receipt</h3>
            <p className="text-sm text-blue-700 mt-1">
              Please confirm you have received the order. This will release funds to the vendor and transporter.
            </p>
          </div>
          <Button onClick={onConfirm} disabled={isConfirming} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]">
            {isConfirming ? "Verifying..." : "Verify Receipt"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
