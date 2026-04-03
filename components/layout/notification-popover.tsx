"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  AppNotification,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services/notifications.service"

export function NotificationPopover() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const [list, count] = await Promise.all([
        fetchNotifications({ limit: 20 }),
        fetchUnreadCount(),
      ])
      setNotifications(list)
      setUnreadCount(count)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAll = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleClickNotification = async (n: AppNotification) => {
    if (!n.is_read) {
      await handleMarkRead(n.id)
    }
    // Navigate based on payload
    const orderId = n.data?.orderId || n.data?.order_id
    if (orderId) {
      window.location.href = `/orders/${orderId}`
      return
    }
    const url = n.data?.url
    if (url) {
      window.location.href = url
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              className="text-xs text-primary hover:underline"
              onClick={handleMarkAll}
            >
              Mark all as read
            </button>
          )}
        </div>
        <ScrollArea className="h-80">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 animate-pulse opacity-40" />
              <p className="text-sm">Loading notifications…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((note) => (
                <button
                  key={note.id}
                  className={`flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-0 ${
                    note.is_read ? "bg-background" : "bg-muted/40"
                  }`}
                  onClick={() => handleClickNotification(note)}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback>
                      <Bell className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium truncate">{note.title || "Notification"}</p>
                      {!note.is_read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{note.message}</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      {note.created_at ? new Date(note.created_at).toLocaleString() : "Just now"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View related orders
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

