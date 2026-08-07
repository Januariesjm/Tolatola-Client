"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle, MessageSquare, Search, Sparkles, Clock, AlertCircle, User, MessageCircle, Trash2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ChatDialog } from "@/components/messaging/chat-dialog"
import { deleteAllResolvedTickets, deleteTicketPermanently } from "@/app/actions/support"
import { toast } from "@/hooks/use-toast"

interface SupportTicketsTabProps {
  tickets: any[]
  department?: string
  roleName?: string
  isSuperAdmin?: boolean
}

export function SupportTicketsTab({ tickets, department, roleName = "Administrator", isSuperAdmin = false }: SupportTicketsTabProps) {
  const router = useRouter()
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [ticketMessageCounts, setTicketMessageCounts] = useState<Record<string, number>>({})
  const [unreadCount, setUnreadCount] = useState<Record<string, boolean>>({})
  const [deletingAllResolved, setDeletingAllResolved] = useState(false)
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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
    toast({
      title: "Ticket Resolved",
      description: "Support ticket marked as resolved successfully.",
    })
    router.refresh()
  }

  const handleDeleteAllResolved = async () => {
    setDeletingAllResolved(true)
    try {
      const res = await deleteAllResolvedTickets()
      if (res.error) {
        toast({
          title: "Delete Failed",
          description: res.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Resolved Tickets Deleted",
          description: `Successfully deleted ${res.count || 0} resolved tickets permanently.`,
        })
        router.refresh()
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete resolved tickets",
        variant: "destructive",
      })
    } finally {
      setDeletingAllResolved(false)
      setDeleteConfirmOpen(false)
    }
  }

  const handleDeleteSingleTicket = async (ticketId: string) => {
    setDeletingTicketId(ticketId)
    try {
      const res = await deleteTicketPermanently(ticketId)
      if (res.error) {
        toast({
          title: "Delete Failed",
          description: res.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Ticket Deleted",
          description: "Ticket permanently removed.",
        })
        router.refresh()
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setDeletingTicketId(null)
    }
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

  const departmentBadgeStyles: Record<string, { label: string; className: string }> = {
    general: { label: "General Support", className: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
    it: { label: "IT Support", className: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
    finance: { label: "Finance & Payouts", className: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
    hr: { label: "Human Resources", className: "bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800" },
    vendor: { label: "Vendor Management", className: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
    logistics: { label: "Logistics & Delivery", className: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800" },
  }

  // Filter tickets by department (if scoped to department or filtered by Super Admin)
  const scopedTickets = tickets.filter((ticket) => {
    const dept = ticket.department || "general"
    if (isSuperAdmin) {
      if (departmentFilter !== "all") {
        if (departmentFilter === "vendor") {
          return dept === "vendor" || dept === "logistics"
        }
        return dept === departmentFilter
      }
      return true
    }
    if (department) {
      const allowedDepts = department.split(",").map((d) => d.trim())
      return allowedDepts.includes(dept)
    }
    return true
  })

  const filteredTickets = scopedTickets.filter((ticket) => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const name = ticket.users?.full_name || ticket.users?.email || ticket.guest_name || ""
    const matchesQuery =
      ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesQuery
  })

  const openCount = scopedTickets.filter((t) => t.status === "open").length
  const inProgressCount = scopedTickets.filter((t) => t.status === "in_progress").length
  const resolvedCount = scopedTickets.filter((t) => t.status === "resolved" || t.status === "completed" || t.status === "closed").length

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight">
              {isSuperAdmin ? "Organization Support Dashboard" : `${roleName} Support Dashboard`}
            </h2>
            <Badge className="bg-emerald-500 text-slate-950 font-semibold px-2 py-0.5">
              {isSuperAdmin ? "Super Admin (All Departments)" : roleName}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {isSuperAdmin
              ? "Comprehensive oversight of support queries across Marketing, IT, HR, Vendor, and Finance departments."
              : `Manage support queries automatically routed to ${roleName}.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-400" />
            <span>Total Tickets: <strong className="text-white">{scopedTickets.length}</strong></span>
          </div>

          {/* Delete All Resolved Button */}
          {resolvedCount > 0 && (
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-9 px-3.5 gap-1.5 shadow-sm">
                  <Trash2 className="h-4 w-4" />
                  Delete All Resolved ({resolvedCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                    <Trash2 className="h-5 w-5" /> Delete All Resolved Tickets?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will <strong>permanently delete all {resolvedCount} resolved and completed tickets</strong> along with all associated chat messages and conversation records.
                    <br /><br />
                    <span className="text-rose-500 font-semibold">This action cannot be undone.</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAllResolved}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllResolved}
                    disabled={deletingAllResolved}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  >
                    {deletingAllResolved ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                      </>
                    ) : (
                      "Yes, Delete Permanently"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Super Admin Department Filter Tabs */}
      {isSuperAdmin && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: "all", label: "All Departments" },
            { id: "general", label: "Marketing & General" },
            { id: "it", label: "IT Admin" },
            { id: "finance", label: "Finance Admin" },
            { id: "hr", label: "HR Admin" },
            { id: "vendor", label: "Vendor & Logistics" },
          ].map((dept) => (
            <button
              key={dept.id}
              onClick={() => setDepartmentFilter(dept.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                departmentFilter === dept.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: "all", label: "All Status", count: scopedTickets.length },
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
            const isResolved = ticket.status === "resolved" || ticket.status === "completed" || ticket.status === "closed"
            const deptInfo = departmentBadgeStyles[ticket.department || "general"] || departmentBadgeStyles.general

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
                        <Badge variant="outline" className={`text-[11px] font-semibold ${deptInfo.className}`}>
                          {deptInfo.label}
                        </Badge>
                        {hasNewUserMsg && (
                          <Badge className="bg-emerald-500 text-white text-[10px] animate-pulse px-2 py-0.5">
                            New Reply Received
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs flex items-center gap-1.5 text-slate-500">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>From: <strong>{ticket.users?.full_name || ticket.users?.email || ticket.guest_name || "Customer User"}</strong></span>
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

                      {!isResolved && (
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

                      {/* Individual Delete Button for Super Admin */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSingleTicket(ticket.id)}
                        disabled={deletingTicketId === ticket.id}
                        className="text-xs h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        title="Delete ticket permanently"
                      >
                        {deletingTicketId === ticket.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
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
          shopName={selectedTicket.users?.full_name || selectedTicket.guest_name || "Customer User"}
          productName={`Ticket #${selectedTicket.id.substring(0, 8)}: ${selectedTicket.subject}`}
        />
      )}
    </div>
  )
}
