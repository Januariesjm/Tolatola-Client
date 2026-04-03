import { clientApiGet, clientApiPost } from "@/lib/api-client"

export type AppNotification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
}

export async function fetchNotifications(opts?: { unreadOnly?: boolean; limit?: number }) {
  const params = new URLSearchParams()
  if (opts?.unreadOnly) params.set("unread_only", "true")
  if (opts?.limit) params.set("limit", String(opts.limit))

  const path = `notifications${params.toString() ? `?${params.toString()}` : ""}`

  const res = await clientApiGet<{ data?: AppNotification[] } | AppNotification[]>(path)
  const payload = (res as any)?.data ?? res
  return (payload || []) as AppNotification[]
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await clientApiGet<{ unread_count?: number } | { data?: { unread_count?: number } }>(
    "notifications/unread-count",
  )
  const root = res as any
  if (typeof root.unread_count === "number") return root.unread_count
  if (root.data && typeof root.data.unread_count === "number") return root.data.unread_count
  return 0
}

export async function markNotificationRead(id: string) {
  await clientApiPost(`notifications/${id}/read`, {})
}

export async function markAllNotificationsRead() {
  await clientApiPost("notifications/read-all", {})
}

