import { clientApiGet, clientApiPost } from "@/lib/api-client"

/**
 * Deep-link hints a notification can carry.
 *
 * The known keys are typed because the notification popover builds an href from
 * them; the index signature keeps the payload open, since producers add fields
 * without a client change. `order_id` and `orderId` both appear in the wild.
 */
export interface NotificationData {
  url?: string
  orderId?: string
  order_id?: string
  [key: string]: unknown
}

export type AppNotification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: NotificationData
  is_read: boolean
  created_at: string
}

export async function fetchNotifications(opts?: { unreadOnly?: boolean; limit?: number }) {
  const params = new URLSearchParams()
  if (opts?.unreadOnly) params.set("unread_only", "true")
  if (opts?.limit) params.set("limit", String(opts.limit))

  const path = `notifications${params.toString() ? `?${params.toString()}` : ""}`

  const res = await clientApiGet<{ data?: AppNotification[] } | AppNotification[]>(path)
  const payload = (res as { data?: AppNotification[] })?.data ?? res

  // Must be an array-or-nothing: `payload || []` let a `{}` response through as
  // an object, and every caller maps over the result.
  return Array.isArray(payload) ? payload : []
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await clientApiGet<{ unread_count?: number } | { data?: { unread_count?: number } }>("notifications/unread-count")
  const root = res as { unread_count?: unknown; data?: { unread_count?: unknown } } | null

  if (typeof root?.unread_count === "number") return root.unread_count
  if (typeof root?.data?.unread_count === "number") return root.data.unread_count
  return 0
}

export async function markNotificationRead(id: string) {
  await clientApiPost(`notifications/${id}/read`, {})
}

export async function markAllNotificationsRead() {
  await clientApiPost("notifications/read-all", {})
}
