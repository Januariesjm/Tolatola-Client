"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"

/**
 * Buyer confirmation that an order was received.
 *
 * This is the action that finalises payments and closes escrow, so a failure
 * must be visible: an earlier version only refreshed on `response.ok` and
 * ignored every other outcome, which made a 409 or a 500 indistinguishable from
 * success.
 *
 * Extracted from components/orders/order-detail-content.tsx so the three banners
 * that offer the action can share one handler, and so the failure path is
 * testable without rendering the whole page.
 */

const log = logger.child("orders.confirm-delivery")

export interface ConfirmDelivery {
  /** True while the request is in flight; the buttons disable on it. */
  isConfirming: boolean
  /** User-facing failure message, or null. Cleared on the next success. */
  confirmError: string | null
  confirmDelivery: () => Promise<void>
}

export function useConfirmDelivery(orderId: string): ConfirmDelivery {
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const router = useRouter()

  const confirmDelivery = async () => {
    setIsConfirming(true)
    try {
      const response = await fetch("/api/orders/confirm-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) {
        throw new Error(`confirm-delivery failed with ${response.status}`)
      }
      setConfirmError(null)
      router.refresh()
    } catch (error) {
      log.error("failed to confirm delivery", error, { orderId })
      setConfirmError("We couldn't confirm delivery. Please try again.")
    } finally {
      setIsConfirming(false)
    }
  }

  return { isConfirming, confirmError, confirmDelivery }
}
