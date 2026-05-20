"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import {
  Bell,
  UserPlus,
  Coins,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react"

interface AgentNotificationsProps {
  agent: any
}

interface Notification {
  id: string
  type: "registration" | "commission" | "performance" | "system"
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export function AgentNotifications({ agent }: AgentNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

  const getAuthHeaders = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    }
  }

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${apiBase}/agents/notifications`, { headers })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.data || [])
      }
    } catch (err) {
      console.error("[AGENT NOTIFICATIONS] Fetch failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const filteredNotifications = filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "registration":
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case "commission":
        return <Coins className="h-4 w-4 text-emerald-500" />
      case "performance":
        return <TrendingUp className="h-4 w-4 text-amber-500" />
      case "system":
        return <AlertTriangle className="h-4 w-4 text-rose-500" />
      default:
        return <Bell className="h-4 w-4 text-slate-500" />
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "registration":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "commission":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "performance":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "system":
        return "bg-rose-50 text-rose-700 border-rose-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Sasa hivi"
    if (diffMins < 60) return `Dakika ${diffMins} zilizopita`
    if (diffHours < 24) return `Saa ${diffHours} zilizopita`
    if (diffDays < 7) return `Siku ${diffDays} zilizopita`
    return date.toLocaleDateString("sw-TZ")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Arifa (Notifications)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {unreadCount > 0
              ? `Una arifa ${unreadCount} mpya ambayo haijasomwa.`
              : "Hakuna arifa mpya kwa sasa."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={isLoading}
            className="rounded-xl text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Zote ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            filter === "unread"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Hazijasomwa ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <Card className="shadow-sm rounded-xl border border-slate-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <span className="text-xs text-slate-400">Inapakia arifa...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-xs text-slate-400 font-bold">Hakuna arifa</p>
              <p className="text-[10px] text-slate-400">
                {filter === "unread"
                  ? "Arifa zote zimesomwa."
                  : "Arifa mpya zitaonyeshwa hapa."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/50 ${
                    !notification.is_read ? "bg-emerald-50/30 border-l-2 border-l-emerald-500" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-900">{notification.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-bold px-1.5 py-0 ${getNotificationBadgeColor(notification.type)}`}
                      >
                        {notification.type}
                      </Badge>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{notification.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
