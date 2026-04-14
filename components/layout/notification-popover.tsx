"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Bell, MessageSquare } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { getUserConversations } from "@/app/actions/messaging"
import {
  AppNotification,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services/notifications.service"

export interface NotificationPopoverProps {
  userType?: string
}

export function NotificationPopover({ userType }: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "notifications" | "messages">("all")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [notifList, convResult] = await Promise.all([
        fetchNotifications({ limit: 20 }).catch(err => {
          console.error("Error fetching notifications:", err)
          return []
        }),
        getUserConversations().catch(err => {
          console.error("Error fetching conversations:", err)
          return { conversations: [] }
        })
      ])

      setNotifications(notifList)
      if (convResult.conversations) {
        setConversations(convResult.conversations)
      }

      // Calculate unread count
      const unreadNotes = notifList.filter(n => !n.is_read).length
      const unreadConvs = (convResult.conversations || []).reduce((acc: number, c: any) => acc + (c.unread_count || 0), 0)
      setUnreadCount(unreadNotes + unreadConvs)
    } catch (error) {
      console.error("Critical error in loadData:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      // Recalculate unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      // Recalculate unread count (only conversations might still have unread)
      const unreadConvs = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)
      setUnreadCount(unreadConvs)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel("global_notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          loadData()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadData, supabase])

  // Hover handling
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setOpen(true)
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 300)
  }

  const handleToggle = (newOpen: boolean) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setOpen(newOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleToggle}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-all hover:scale-110 active:scale-95"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleToggle(!open)}
        >
          <Bell className="h-6 w-6 text-stone-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 bg-primary text-white border-4 border-white rounded-full text-[10px] font-black shadow-lg animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-32px)] sm:w-[380px] p-0 rounded-[2rem] border-stone-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
        align="end"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sideOffset={8}
        collisionPadding={16}
      >
        <div className="bg-stone-950 p-6 text-white shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black tracking-tight">Notifications</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Stay Updated</p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAll}
                className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-white hover:bg-white/10"
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            {(["all", "notifications", "messages"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                  activeTab === tab ? "bg-white text-stone-950" : "text-stone-400 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-[min(450px,calc(100vh-280px))] overflow-y-auto">
          <div className="p-2">
            {loading && notifications.length === 0 && conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bell className="h-8 w-8 mb-2 animate-pulse text-stone-200" />
                <p className="text-sm font-bold text-stone-400">Syncing updates...</p>
              </div>
            ) : (conversations.length === 0 && notifications.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-3xl bg-stone-50 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-stone-200" />
                </div>
                <p className="text-sm font-bold text-stone-400">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {(activeTab === "all" || activeTab === "notifications") && notifications.map((note) => (
                  <Link
                    key={`n-${note.id}`}
                    href={
                      note?.data?.orderId || note?.data?.order_id
                        ? userType === "vendor"
                          ? `/vendor/dashboard?tab=orders&orderId=${note.data.orderId || note.data.order_id}`
                          : `/orders/${note.data.orderId || note.data.order_id}`
                        : note?.data?.url || "/orders"
                    }
                    onClick={() => {
                      if (!note.is_read) handleMarkRead(note.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl transition-all hover:bg-stone-50 group",
                      !note.is_read && "bg-primary/[0.03]"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                      !note.is_read ? "bg-primary/10 text-primary" : "bg-stone-100 text-stone-400"
                    )}>
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-stone-900 truncate">{note.title || "Update"}</p>
                        {!note.is_read && <div className="h-2 w-2 rounded-full bg-primary mt-2 shadow-[0_0_10px_rgba(var(--primary),0.5)]" />}
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">{note.message}</p>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-2 block">
                        {note.created_at ? new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                      </span>
                    </div>
                  </Link>
                ))}

                {(activeTab === "all" || activeTab === "messages") && conversations.map((conv) => {
                  if (!conv) return null
                  return (
                    <Link
                      key={conv.id}
                      href={`/messages?id=${conv.id}`}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-2xl transition-all hover:bg-stone-50 group",
                        conv.unread_count > 0 && "bg-amber-500/[0.03]"
                      )}
                    >
                      <div className="relative shrink-0 transition-transform group-hover:scale-110">
                        <Avatar className="h-12 w-12 rounded-xl border-2 border-white shadow-sm">
                          <AvatarImage src={conv.shop?.logo_url || conv.customer?.profile_image_url || ""} />
                          <AvatarFallback className="bg-stone-100 text-stone-900 font-bold">
                            {(conv.shop?.name || conv.customer?.full_name || "U").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-stone-900 truncate">
                            {conv.shop?.name || conv.customer?.full_name || conv.vendor?.full_name || "Chat"}
                          </p>
                          <MessageSquare className="h-3 w-3 text-stone-300 mt-1" />
                        </div>
                        <p className="text-xs text-stone-500 truncate mt-0.5">{conv.last_message || "Started a conversation"}</p>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-2 block">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 bg-stone-50 border-t border-stone-100">
          <Link href="/messages" onClick={() => setOpen(false)}>
            <Button className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-stone-200 transition-all hover:-translate-y-0.5">
              Messenger Hub
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

