"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, MessageSquare, Search, Sparkles, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTicketMessageCounts } from "@/hooks/use-ticket-message-counts"
import { useRouter } from "next/navigation"
import { ChatDialog } from "@/components/messaging/chat-dialog"
import { getOrCreateConversation } from "@/app/actions/messaging"
import { deleteAllResolvedTickets, deleteTicketPermanently } from "@/app/actions/support"
import { toast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import { DeleteAllResolvedDialog } from "@/components/admin/delete-all-resolved-dialog"
import { SupportTicketCard } from "@/components/admin/support-ticket-card"
import { countTicketsByStatus, filterTicketsByStatusAndQuery, scopeTicketsByDepartment } from "@/lib/admin/support-tickets"

const log = logger.child("admin.support-tickets-tab")

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
  const { counts: ticketMessageCounts, unread: unreadCount, markRead } = useTicketMessageCounts(tickets)
  const [deletingAllResolved, setDeletingAllResolved] = useState(false)
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const supabase = createClient()

  // Fetch message counts for conversations linked to tickets

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

  const openChat = async (ticket: any) => {
    let activeConvId = ticket.conversation_id
    if (!activeConvId) {
      try {
        const res = await getOrCreateConversation(undefined, undefined, undefined, undefined, ticket.id)
        if (res.conversation) {
          activeConvId = res.conversation.id
          ticket.conversation_id = activeConvId
        }
      } catch (e) {
        log.error("failed to auto-link conversation for ticket", e)
      }
    }
    setSelectedTicket({ ...ticket, conversation_id: activeConvId })
    setChatOpen(true)
    if (activeConvId) {
      markRead(activeConvId)
    }
  }

  const scopedTickets = scopeTicketsByDepartment(tickets, { isSuperAdmin, departmentFilter, department })
  const filteredTickets = filterTicketsByStatusAndQuery(scopedTickets, { statusFilter, query: searchQuery })
  const { open: openCount, inProgress: inProgressCount, resolved: resolvedCount } = countTicketsByStatus(scopedTickets)

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
            <span>
              Total Tickets: <strong className="text-white">{scopedTickets.length}</strong>
            </span>
          </div>

          {/* Delete All Resolved Button */}
          {resolvedCount > 0 && (
            <DeleteAllResolvedDialog
              open={deleteConfirmOpen}
              onOpenChange={setDeleteConfirmOpen}
              resolvedCount={resolvedCount}
              deleting={deletingAllResolved}
              onConfirm={handleDeleteAllResolved}
            />
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
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
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
              <SupportTicketCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                messageCount={msgCount}
                hasUnreadReply={hasNewUserMsg}
                isDeleting={deletingTicketId === ticket.id}
                onOpenChat={() => openChat(ticket)}
                onResolve={() => handleResolve(ticket.id)}
                onDelete={() => handleDeleteSingleTicket(ticket.id)}
              />
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
          ticketDescription={selectedTicket.description}
          isAdminView={true}
        />
      )}
    </div>
  )
}
