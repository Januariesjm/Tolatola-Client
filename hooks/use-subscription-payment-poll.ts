import { clientApiGet } from "@/lib/api-client"
import { logger } from "@/lib/logger"

/**
 * Polls a subscription checkout until it settles.
 *
 * Extracted from components/transporter/transporter-subscription-tab.tsx,
 * where this exact logic (only the `type=` query param differed) was also
 * duplicated in components/vendor/vendor-subscription-tab.tsx. Both now share
 * this one implementation.
 *
 * A mobile-money push or a bank control number does not resolve
 * synchronously: ClickPesa confirms asynchronously via its own webhook, so the
 * only way the client learns the outcome is to ask. This polls
 * `GET subscriptions/status/:id` every `intervalMs` until the status leaves
 * "pending", or gives up after `maxAttempts`.
 */

const log = logger.child("hooks.use-subscription-payment-poll")

/** Which account type's subscription endpoint to poll. */
export type SubscriptionAccountType = "vendor" | "transporter"

interface SubscriptionStatusResponse {
  data: {
    status: string
    click_pesa_error?: string
  }
}

export interface UseSubscriptionPaymentPollOptions {
  accountType: SubscriptionAccountType
  /** Called once the subscription is confirmed active. */
  onActive: () => void
  /** Called once the checkout is rejected or fails, with a message to show. */
  onFailed: (message: string) => void
  /** Called if the status never resolves within maxAttempts. */
  onTimeout: () => void
  /** Milliseconds between checks. Defaults to 3000 (~2 minutes at 40 attempts). */
  intervalMs?: number
  /** Checks before giving up. Defaults to 40. */
  maxAttempts?: number
}

export interface UseSubscriptionPaymentPoll {
  /** Starts polling `subscriptionId`. Returns a function that stops it early. */
  startPolling: (subscriptionId: string) => () => void
}

const DEFAULT_INTERVAL_MS = 3000
const DEFAULT_MAX_ATTEMPTS = 40

export function useSubscriptionPaymentPoll({
  accountType,
  onActive,
  onFailed,
  onTimeout,
  intervalMs = DEFAULT_INTERVAL_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}: UseSubscriptionPaymentPollOptions): UseSubscriptionPaymentPoll {
  const startPolling = (subscriptionId: string) => {
    let attempts = 0

    const checkStatus = async (): Promise<boolean> => {
      try {
        const res = await clientApiGet<SubscriptionStatusResponse>(`subscriptions/status/${subscriptionId}?type=${accountType}`)
        const { status } = res.data

        if (status === "active") {
          onActive()
          return true
        }

        if (status === "rejected" || status === "failed") {
          onFailed(res.data.click_pesa_error || "The transaction was unsuccessful. Please try again.")
          return true
        }

        return false
      } catch (err) {
        log.error("polling error", err)
        return false
      }
    }

    const interval = setInterval(async () => {
      attempts++
      const finished = await checkStatus()
      if (finished) {
        clearInterval(interval)
        return
      }
      // Checked after, not alongside, `finished`: the original inline version
      // of this poll fired the timeout toast even on an attempt that had just
      // succeeded, if that attempt happened to also be the last one allowed.
      if (attempts >= maxAttempts) {
        clearInterval(interval)
        onTimeout()
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }

  return { startPolling }
}
