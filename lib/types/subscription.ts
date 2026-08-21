/**
 * Subscription plan and checkout shapes shared by the vendor and transporter
 * subscription tabs.
 *
 * Derived from the fields those tabs actually read, not from an idealised
 * schema. The two tabs consume the same endpoints (`subscriptions/plans` and
 * `subscriptions/{vendors,transporters}`) with the same envelope, so they share
 * these types rather than each declaring `any`.
 */

/**
 * A plan as `GET subscriptions/plans` returns it.
 *
 * `name` and `price` are required because both tabs branch on the name and call
 * `price.toLocaleString()` without a guard. Everything else is a capability flag
 * that only one of the two plan families carries, so it is optional.
 */
export interface SubscriptionPlan {
  id: string
  name: string
  price: number

  /** Vendor plans: how many products the plan allows. */
  product_limit?: number | null
  support_level?: string | null
  analytics_level?: string | null
  has_analytics?: boolean | null
  has_promotions?: boolean | null
  has_consultation?: boolean | null
  has_verification_badge?: boolean | null

  features?: SubscriptionPlanFeatures | null
}

/**
 * Free-form capability bag from the backend. Only `description` is rendered
 * (by the vendor tab's plan card); the rest is carried but not read, so the
 * index signature keeps it addressable without widening to `any`.
 */
export interface SubscriptionPlanFeatures {
  description?: string | null
  [key: string]: unknown
}

/**
 * The plan a vendor or transporter is currently on, as it arrives nested under
 * `current_subscription`.
 *
 * `plan` is required: both tabs read `currentSubscription.plan.name` directly
 * once `currentSubscription` is non-null.
 */
export interface CurrentSubscription {
  plan: SubscriptionPlan
  expires_at?: string | null
  status?: string | null
}

/**
 * Envelope returned when a subscription checkout is initiated.
 *
 * `subscription` is required rather than optional because both tabs poll
 * `result.subscription.id` unconditionally inside the `success` branch -- typing
 * it optional would only move that existing assumption, not remove it.
 */
export interface SubscriptionCheckoutResult {
  success?: boolean
  message?: string
  /** Control number for a bank transfer, or a payment URL when it starts "http". */
  controlNumber?: string | null
  subscription: { id: string }
}
