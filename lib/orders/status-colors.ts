/**
 * Badge colour mappings for order and payment status.
 *
 * Pure functions, extracted from components/orders/order-detail-content.tsx so
 * they can be unit-tested and reused. They also now tolerate a missing status:
 * the originals called `.toLowerCase()` on the raw value, which threw for an
 * order whose status column was null.
 */

const FALLBACK = "bg-gray-100 text-gray-600 border-gray-200"

/** Tailwind classes for an order status badge. */
export function getStatusColor(status?: string | null): string {
  if (!status) return FALLBACK
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-500/15 text-yellow-600 border-yellow-200"
    case "confirmed":
      return "bg-blue-500/15 text-blue-600 border-blue-200"
    case "processing":
      return "bg-purple-500/15 text-purple-600 border-purple-200"
    case "shipped":
    case "dispatched":
    case "in_transit":
      return "bg-indigo-500/15 text-indigo-600 border-indigo-200"
    case "delivered":
      return "bg-green-500/15 text-green-600 border-green-200"
    case "completed":
      return "bg-green-600/15 text-green-700 border-green-300"
    case "cancelled":
      return "bg-red-500/15 text-red-600 border-red-200"
    case "refunded":
      return "bg-gray-500/15 text-gray-600 border-gray-200"
    default:
      return "bg-gray-100 text-gray-600 border-gray-200"
  }
}

/** Tailwind classes for a payment status badge. */
export function getPaymentStatusColor(status?: string | null): string {
  if (!status) return FALLBACK
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-green-500/15 text-green-600 border-green-200"
    case "pending":
      return "bg-yellow-500/15 text-yellow-600 border-yellow-200"
    case "failed":
      return "bg-red-500/15 text-red-600 border-red-200"
    default:
      return "bg-gray-100 text-gray-600 border-gray-200"
  }
}
