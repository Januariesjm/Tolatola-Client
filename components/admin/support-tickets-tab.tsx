"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle, MessageSquare, Search, Sparkles, Clock, AlertCircle, User, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ChatDialog } from "@/components/messaging/chat-dialog"

interface SupportTicketsTabProps {
  tickets: any[]
}

export function SupportTicketsTab({ tickets }: SupportTicketsTabProps) {
  const router = useRouter()
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [ticketMessageCounts, setTicketMessageCounts] = useState<Record<string, number>>({})
  const [unreadCount, setUnreadCount] = useState<Record<string, boolean>>({})

  const supabase = createClient()

  // Fetch message counts for conversations linked to tickets
  const fetchMessageCounts = useCallback(async () => {
    try {
      const convIds = tickets
        .map((t) => t.conversation_id)
        .filter(Boolean)

      if (convIds.length === 0) return

      const { data, error } = await supabase
        .from("messages")
        .select("conversation_id, sender_type")
        .in("conversation_id", convIds)

      if (data) {
        const counts: Record<string, number> = {}
        const unreads: Record<string, boolean> = {}

        data.forEach((msg: any) => {
          counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1
          if (msg.sender_type === "user" || msg.sender_type === "guest") {
            unreads[msg.conversation_id] = true
          }
        })

        setTicketMessageCounts(counts)
        setUnreadCount(unreads)
      }
    } catch (e) {
      console.error("[SupportTicketsTab] Error fetching message counts:", e)
    }
  }, [tickets, supabase])

  useEffect(() => {
    fetchMessageCounts()

    // Listen for realtime incoming messages across tickets
    const channel = supabase
      .channel("support_tickets_messages_counter")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: any) => {
          const newMsg = payload.new
          if (newMsg?.conversation_id) {
            setTicketMessageCounts((prev) => ({
              ...prev,
              [newMsg.conversation_id]: (prev[newMsg.conversation_id] || 0) + 1,
            }))
            if (newMsg.sender_type === "user" || newMsg.sender_type === "guest") {
              setUnreadCount((prev) => ({
                ...prev,
                [newMsg.conversation_id]: true,
              }))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMessageCounts, supabase])

  const handleResolve = async (ticketId: string) => {
    await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", ticketId)
    router.refresh()
  }

  const openChat = (ticket: any) => {
    setSelectedTicket(ticket)
    setChatOpen(true)
    if (ticket.conversation_id) {
      setUnreadCount((prev) => ({ ...prev, [ticket.conversation_id]: false }))
    }
  }

  const statusColors: Record<string, string> = {
    open: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    in_progress: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  }

  const priorityColors: Record<string, string> = {
    low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    medium: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200",
    high: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-200",
    urgent: "bg-red-600 text-white shadow-sm",
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const name = ticket.users?.full_name || ticket.users?.email || ""
    const matchesQuery =
      ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesQuery
  })

  const openCount = tickets.filter((t) => t.status === "open").length
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Customer Support Dashboard</h2>
            <Badge className="bg-emerald-500 text-slate-950 font-semibold px-2 py-0.5">
              Live Realtime
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage customer inquiries, view message history, and reply in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-400" />
            <span>Total Tickets: <strong className="text-white">{tickets.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: "all", label: "All Tickets", count: tickets.length },
            { id: "open", label: "Open", count: openCount },
            { id: "in_progress", label: "In Progress", count: inProgressCount },
            { id: "resolved", label: "Resolved", count: resolvedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === tab.id ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tickets by user or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No support tickets found</h3>
            <p className="text-xs text-slate-500 mt-1">There are no support tickets matching the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.map((ticket, index) => {
            const convId = ticket.conversation_id
            const msgCount = convId ? ticketMessageCounts[convId] || 0 : 0
            const hasNewUserMsg = convId ? unreadCount[convId] : false

            return (
              <Card
                key={ticket.id}
                className={`transition-all hover:shadow-md border ${
                  hasNewUserMsg
                    ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-emerald-500/5"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          #{index + 1}
                        </span>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                          {ticket.subject}
                        </CardTitle>
                        {hasNewUserMsg && (
                          <Badge className="bg-emerald-500 text-white text-[10px] animate-pulse px-2 py-0.5">
                            New Reply Received
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs flex items-center gap-1.5 text-slate-500">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>From: <strong>{ticket.users?.full_name || ticket.users?.email || "Customer User"}</strong></span>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-xs font-medium ${statusColors[ticket.status] || ""}`}>
                        {ticket.status?.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className={`text-xs font-medium ${priorityColors[ticket.priority] || ""}`}>
                        {ticket.priority} priority
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {ticket.description}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msgCount > 0 && (
                        <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300/50 text-[11px] flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {msgCount} {msgCount === 1 ? "Message" : "Messages"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={hasNewUserMsg ? "default" : "outline"}
                        onClick={() => openChat(ticket)}
                        className={`text-xs h-8 ${
                          hasNewUserMsg
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        Open Live Chat {msgCount > 0 && `(${msgCount})`}
                      </Button>
                      {ticket.status !== "resolved" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResolve(ticket.id)}
                          className="text-xs h-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedTicket && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          conversationId={selectedTicket.conversation_id}
          shopName={selectedTicket.users?.full_name || "Customer User"}
          productName={`Ticket #${selectedTicket.id.substring(0, 8)}: ${selectedTicket.subject}`}
        />
      )}
    </div>
  )
}
