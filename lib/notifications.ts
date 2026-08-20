import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

const log = logger.child("lib.notifications")

export type NotificationType = "order_placed" | "order_assigned" | "order_status_update" | "stock_low"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const supabase = await createClient()

    // We assume migration has been run to create the notifications table

    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || {},
      is_read: false,
    })

    if (error) {
      log.error("error creating notification", error)
      return false
    }

    return true
  } catch (error) {
    log.error("exception creating notification", error)
    return false
  }
}
